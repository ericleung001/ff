import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const getSql = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  return neon(databaseUrl);
};

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 解析 players 字段（可能是 JSON 字符串或已經是數組）
function parsePlayers(players: any): any[] {
  if (!players) return [];
  if (Array.isArray(players)) return players;
  if (typeof players === 'string') {
    try {
      return JSON.parse(players);
    } catch {
      return [];
    }
  }
  return [];
}

// 獲取所有等待中的房間
export async function GET() {
  try {
    const sql = getSql();
    const results = await sql`
      SELECT * FROM rooms 
      WHERE status = 'waiting' 
      ORDER BY created_at DESC
    `;
    
    const rooms = results.map((row: any) => ({
      id: row.id,
      name: row.name,
      isPublic: row.is_public,
      password: row.password,
      hostId: row.host_id,
      hostName: row.host_name,
      maxPlayers: row.max_players,
      players: parsePlayers(row.players),
      status: row.status,
    }));
    
    return NextResponse.json(rooms);
  } catch (error: any) {
    console.error('Get rooms error:', error);
    return NextResponse.json({ error: error.message || '伺服器錯誤' }, { status: 500 });
  }
}

// 創建 / 加入 / 離開房間
export async function POST(request: NextRequest) {
  try {
    const sql = getSql();
    const body = await request.json();
    const { action, roomId, name, isPublic, password, hostId, hostName, player } = body;

    if (action === 'create') {
      // 創建新房間
      const id = generateId();
      const players = [{
        id: hostId,
        name: hostName,
        level: player?.level || 1,
        characterClass: player?.characterClass || 'WARRIOR'
      }];
      
      await sql`
        INSERT INTO rooms (id, name, is_public, password, host_id, host_name, max_players, players, status)
        VALUES (${id}, ${name}, ${isPublic}, ${password || null}, ${hostId}, ${hostName}, 4, ${JSON.stringify(players)}, 'waiting')
      `;
      
      return NextResponse.json({
        id,
        name,
        isPublic,
        password: password || null,
        hostId,
        hostName,
        maxPlayers: 4,
        players,
        status: 'waiting'
      });
    }

    if (action === 'join') {
      // 加入房間
      const results = await sql`SELECT * FROM rooms WHERE id = ${roomId}`;
      if (!results[0]) {
        return NextResponse.json({ error: '房間不存在' }, { status: 400 });
      }
      
      const room = results[0];
      
      // 檢查密碼
      if (!room.is_public && room.password && room.password !== password) {
        return NextResponse.json({ error: '密碼錯誤' }, { status: 400 });
      }
      
      // 檢查人數
      const currentPlayers = parsePlayers(room.players);
      if (currentPlayers.length >= room.max_players) {
        return NextResponse.json({ error: '房間已滿' }, { status: 400 });
      }
      
      // 檢查是否已在房間
      if (currentPlayers.some((p: any) => p.id === player.id)) {
        return NextResponse.json({ error: '你已在房間中' }, { status: 400 });
      }
      
      // 添加玩家
      const newPlayer = {
        id: player.id,
        name: player.name,
        level: player.level || 1,
        characterClass: player.characterClass || 'WARRIOR'
      };
      
      const updatedPlayers = [...currentPlayers, newPlayer];
      await sql`
        UPDATE rooms SET players = ${JSON.stringify(updatedPlayers)} WHERE id = ${roomId}
      `;
      
      return NextResponse.json({
        id: room.id,
        name: room.name,
        isPublic: room.is_public,
        password: room.password,
        hostId: room.host_id,
        hostName: room.host_name,
        maxPlayers: room.max_players,
        players: updatedPlayers,
        status: room.status
      });
    }

    if (action === 'leave') {
      // 離開房間
      const results = await sql`SELECT * FROM rooms WHERE id = ${roomId}`;
      if (!results[0]) {
        return NextResponse.json({ error: '房間不存在' }, { status: 400 });
      }
      
      const room = results[0];
      const currentPlayers = parsePlayers(room.players);
      const updatedPlayers = currentPlayers.filter((p: any) => p.id !== player.id);
      
      if (updatedPlayers.length === 0) {
        // 最後一人離開，刪除房間
        await sql`DELETE FROM rooms WHERE id = ${roomId}`;
        return NextResponse.json({ success: true, deleted: true });
      }
      
      // 檢查是否需要更換房主
      let newHostId = room.host_id;
      let newHostName = room.host_name;
      
      if (room.host_id === player.id && updatedPlayers.length > 0) {
        newHostId = updatedPlayers[0].id;
        newHostName = updatedPlayers[0].name;
      }
      
      await sql`
        UPDATE rooms 
        SET players = ${JSON.stringify(updatedPlayers)}, host_id = ${newHostId}, host_name = ${newHostName}
        WHERE id = ${roomId}
      `;
      
      return NextResponse.json({ 
        success: true,
        room: {
          id: room.id,
          name: room.name,
          isPublic: room.is_public,
          hostId: newHostId,
          hostName: newHostName,
          maxPlayers: room.max_players,
          players: updatedPlayers,
          status: room.status
        }
      });
    }

    if (action === 'start') {
      // 開始戰鬥
      await sql`UPDATE rooms SET status = 'in_battle' WHERE id = ${roomId}`;
      return NextResponse.json({ success: true });
    }

    if (action === 'finish') {
      // 戰鬥結束
      await sql`DELETE FROM rooms WHERE id = ${roomId}`;
      return NextResponse.json({ success: true, deleted: true });
    }

    return NextResponse.json({ error: '無效的操作' }, { status: 400 });
  } catch (error: any) {
    console.error('Room error:', error);
    return NextResponse.json({ error: error.message || '伺服器錯誤' }, { status: 500 });
  }
}
