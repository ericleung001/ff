// server/socketHandler.js — Real-time dungeon & combat via Socket.io
const jwt    = require('jsonwebtoken');
const { query, queryOne, execute, transaction } = require('./db');
const { ENEMIES, JOB_SKILLS, calcDamage, calcHeal } = require('./gameData');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const TURN_TIMEOUT_MS = parseInt(process.env.DUNGEON_TURN_TIMEOUT) || 30000;

const activeSessions = new Map();
const socketIndex = new Map();

module.exports = function initSockets(io) {

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('未登入'));
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      next(new Error('Token無效'));
    }
  });

  async function handlePlayerLeave(roomCode, characterId, io) {
      if (!roomCode || !characterId) return;
      const room = await queryOne('SELECT * FROM dungeon_rooms WHERE room_code=?', [roomCode]);
      if (!room) return;

      const member = await queryOne('SELECT * FROM room_members WHERE room_id=? AND character_id=?', [room.id, characterId]);
      if (!member) return;

      const char = await queryOne('SELECT name FROM characters WHERE id=?', [characterId]);
      const charName = char ? char.name : '玩家';

      await execute('DELETE FROM room_members WHERE room_id=? AND character_id=?', [room.id, characterId]);

      const remaining = await query('SELECT character_id FROM room_members WHERE room_id=? ORDER BY joined_at ASC', [room.id]);

      if (remaining.length === 0) {
          await execute('DELETE FROM dungeon_rooms WHERE id=?', [room.id]);
          activeSessions.delete(roomCode);
          return;
      } else if (Number(member.is_leader) === 1) {
          const newLeaderId = remaining[0].character_id;
          await execute('UPDATE room_members SET is_leader=TRUE WHERE room_id=? AND character_id=?', [room.id, newLeaderId]);
          
          const session = activeSessions.get(roomCode);
          if (session && session.status === 'active') {
              const newLeaderChar = session.party.find(p => Number(p.characterId) === Number(newLeaderId));
              if (newLeaderChar) {
                  addLog(session, 'system', `👑 房主離開，權限移交給 ${newLeaderChar.name}`);
              }
          }
      }

      const session = activeSessions.get(roomCode);
      if (session && session.status === 'active') {
          session.party = session.party.filter(p => Number(p.characterId) !== Number(characterId));
          session.turnOrder = session.turnOrder.filter(id => Number(id) !== Number(characterId));
          addLog(session, 'system', `👋 ${charName} 離開了隊伍。`);
          checkCombatEnd(io, session);
      }

      const finalMembers = await getRoomMembers(room.id);
      io.to(roomCode).emit('room:update', { members: finalMembers, status: room.status });
  }

  async function kickMember(room, characterId, reason = '你已被踢出房間') {
      for (const [sid, info] of socketIndex.entries()) {
          if (Number(info.characterId) === Number(characterId) && info.roomCode === String(room.room_code).toUpperCase()) {
              io.to(sid).emit('room:kicked', { reason });
              info.roomCode = null; 
              const s = io.sockets.sockets.get(sid);
              if (s) s.leave(room.room_code);
              break;
          }
      }
      await handlePlayerLeave(room.room_code, characterId, io);
  }

  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id} user:${socket.user.userId}`);

    socket.on('room:join', async ({ roomCode, characterId }) => {
      try {
        roomCode = String(roomCode).toUpperCase(); 
        const room = await queryOne('SELECT * FROM dungeon_rooms WHERE room_code=?', [roomCode]);
        if (!room) return socket.emit('error', { msg: '房間不存在' });

        const char = await queryOne('SELECT id FROM characters WHERE id=? AND user_id=?', [characterId, socket.user.userId]);
        if (!char) return socket.emit('error', { msg: '角色驗證失敗' });

        let member = await queryOne(
          `SELECT rm.*, c.name, c.job, c.level, rm.is_leader, rm.is_ready
           FROM room_members rm JOIN characters c ON c.id=rm.character_id
           WHERE rm.room_id=? AND rm.character_id=?`,
          [room.id, characterId]
        );
        
        if (!member) {
          if (room.status !== 'waiting') return socket.emit('error', { msg: '房間已開始' });
          const cnt = await queryOne('SELECT COUNT(*) AS c FROM room_members WHERE room_id=?', [room.id]);
          if (cnt.c >= room.max_players) return socket.emit('error', { msg: '房間已滿' });
          await execute('INSERT IGNORE INTO room_members (room_id, character_id) VALUES (?,?)', [room.id, characterId]);
          member = await queryOne(
            `SELECT rm.*, c.name, c.job, c.level, rm.is_leader, rm.is_ready
             FROM room_members rm JOIN characters c ON c.id=rm.character_id
             WHERE rm.room_id=? AND rm.character_id=?`,
            [room.id, characterId]
          );
        }
        
        if (!member) return socket.emit('error', { msg: '加入房間失敗' });

        socketIndex.set(socket.id, { userId: socket.user.userId, characterId, roomCode });
        socket.join(roomCode);

        const members = await getRoomMembers(room.id);
        io.to(roomCode).emit('room:update', { members, status: room.status });
        socket.emit('room:joined', { roomCode, roomId: room.id, isLeader: Number(member.is_leader) === 1 });
      } catch (err) {
        socket.emit('error', { msg: '加入房間失敗' });
      }
    });

    socket.on('room:leave', async ({ roomCode }) => {
      roomCode = String(roomCode).toUpperCase();
      const info = socketIndex.get(socket.id);
      if (info && info.roomCode === roomCode) {
        await handlePlayerLeave(roomCode, info.characterId, io);
        info.roomCode = null;
        socket.leave(roomCode);
      }
    });

    socket.on('room:kick', async ({ roomCode, targetId }) => {
      roomCode = String(roomCode).toUpperCase();
      const info = socketIndex.get(socket.id);
      if (!info || info.roomCode !== roomCode) return;
      const room = await queryOne('SELECT * FROM dungeon_rooms WHERE room_code=?', [roomCode]);
      if (!room) return;
      
      const isLeader = await queryOne('SELECT id FROM room_members WHERE room_id=? AND character_id=? AND (is_leader=1 OR is_leader=TRUE)', [room.id, info.characterId]);
      if (!isLeader) return;

      await kickMember(room, targetId, '被隊長踢出隊伍');
    });

    socket.on('room:ready', async ({ roomCode }) => {
      roomCode = String(roomCode).toUpperCase();
      const info = socketIndex.get(socket.id);
      if (!info || info.roomCode !== roomCode) return;

      const room = await queryOne('SELECT * FROM dungeon_rooms WHERE room_code=?', [roomCode]);
      if (!room || room.status !== 'waiting') return;

      await execute('UPDATE room_members SET is_ready=NOT is_ready WHERE room_id=? AND character_id=?', [room.id, info.characterId]);
      const members = await getRoomMembers(room.id);
      io.to(roomCode).emit('room:update', { members, status: room.status });
    });

    socket.on('dungeon:start', async ({ roomCode }) => {
      roomCode = String(roomCode).toUpperCase();
      const info = socketIndex.get(socket.id);
      if (!info) return;

      const room = await queryOne('SELECT * FROM dungeon_rooms WHERE room_code=?', [roomCode]);
      if (!room || room.status !== 'waiting') return;

      const isLeader = await queryOne('SELECT is_leader FROM room_members WHERE room_id=? AND character_id=? AND (is_leader=1 OR is_leader=TRUE)', [room.id, info.characterId]);
      if (!isLeader) return socket.emit('error', { msg: '只有隊長可以開始' });

      const members = await getRoomMembers(room.id);
      const allReady = members.every(m => Number(m.is_leader) === 1 || Number(m.is_ready) === 1);
      if (!allReady) return socket.emit('error', { msg: '必須等待所有人準備完成' });

      io.to(roomCode).emit('dungeon:countdown', { seconds: 5 });
      
      setTimeout(async () => {
        const checkRoom = await queryOne('SELECT * FROM dungeon_rooms WHERE id=?', [room.id]);
        if (checkRoom && checkRoom.status === 'waiting') {
          const finalMembers = await getRoomMembers(room.id);
          if (finalMembers.length > 0) {
            await startDungeon(io, room, finalMembers, roomCode);
          }
        }
      }, 5000);
    });

    socket.on('combat:host_auto', async ({ roomCode, autoState, count }) => {
      roomCode = String(roomCode).toUpperCase();
      const info = socketIndex.get(socket.id);
      if (!info || info.roomCode !== roomCode) return;
      const isLeader = await queryOne('SELECT id FROM room_members WHERE room_id=(SELECT id FROM dungeon_rooms WHERE room_code=?) AND character_id=? AND (is_leader=1 OR is_leader=TRUE)', [roomCode, info.characterId]);
      if (isLeader) {
        socket.to(roomCode).emit('combat:sync_auto', { autoState, count });
      }
    });

    socket.on('combat:action', async ({ roomCode, skillId, targetIdx = 0 }) => {
      roomCode = String(roomCode).toUpperCase();
      const info = socketIndex.get(socket.id);
      if (!info || info.roomCode !== roomCode) return;
      const session = activeSessions.get(roomCode);
      if (!session || session.status !== 'active') return;

      const currentId = session.turnOrder[session.turnIndex];
      if (Number(currentId) !== Number(info.characterId)) return socket.emit('error', { msg: '還沒輪到你！' });

      clearTimeout(session.turnTimer);
      await processCombatAction(io, session, info.characterId, skillId, targetIdx);
    });

    socket.on('disconnect', async () => {
      const info = socketIndex.get(socket.id);
      if (info) {
        socketIndex.delete(socket.id);
        await handlePlayerLeave(info.roomCode, info.characterId, io);
      }
    });
  });

  async function startDungeon(io, room, members, roomCode) {
    await execute("UPDATE dungeon_rooms SET status='in_progress', started_at=NOW() WHERE id=?", [room.id]);
    io.to(roomCode).emit('dungeon:starting', { floor: 1 });
    setTimeout(() => spawnFloor(io, room, members, roomCode, 1), 1000);
  }

  async function spawnFloor(io, room, members, roomCode, floor) {
    // ✅ 修改：讀取 room.target_monster 作為目標
    const targetId = room.target_monster || 'goblin';
    const base = ENEMIES && ENEMIES[targetId] ? ENEMIES[targetId] : { name: '未知怪物', icon: '👹', hp: 100, atk: [5,10], def: 2, xp: 20, gold: 10 };
    const enemies = [{ ...base, currentHp: base.hp, statusEffects: [] }];

    const party = await Promise.all(members.map(async (m) => {
      const c = await queryOne('SELECT * FROM characters WHERE id=?', [m.character_id]);
      const skills = await query('SELECT skill_id FROM char_skills WHERE character_id=?', [c.id]);
      return {
        characterId: c.id,
        name: c.name, job: c.job, level: c.level,
        hp: c.hp, maxHp: c.max_hp, mp: c.mp, maxMp: c.max_mp,
        stats: { STR: c.stat_str, INT: c.stat_int, AGI: c.stat_agi, WIS: c.stat_wis, DEF: c.stat_def },
        learnedSkills: skills.map(s => s.skill_id),
        statusEffects: [],
      };
    }));

    const turnOrder = [...party].sort((a, b) => (b.stats.AGI || 0) - (a.stats.AGI || 0)).map(p => p.characterId);

    const session = {
      roomCode, roomId: room.id, floor, dungeonId: room.dungeon_id,
      enemies, party, turnOrder, turnIndex: 0,
      log: [], status: 'active', turnTimer: null,
    };
    activeSessions.set(roomCode, session);

    const payload = { floor, enemies: enemies.map(publicEnemy), party: party.map(publicParty), turnOrder, currentTurn: turnOrder[0] };
    io.to(roomCode).emit('combat:start', payload);

    setTimeout(() => {
      broadcastTurnChange(io, session);
      scheduleAutoTurn(io, session);
    }, 500);
  }

  async function handleDeaths(io, session) {
    if (session.status !== 'active') return;
    const deadMembers = session.party.filter(p => p.hp <= 0);
    if (deadMembers.length === 0) return;
    if (deadMembers.length === session.party.length) return; // 全滅由 endCombat 處理

    for (const dead of deadMembers) {
        if (dead.isDeadHandled) continue;
        dead.isDeadHandled = true;

        const room = await queryOne('SELECT * FROM dungeon_rooms WHERE id=?', [session.roomId]);
        if (room) {
            await kickMember(room, dead.characterId, '你在戰鬥中陣亡，已離開副本！');
        }
        addLog(session, 'system', `☠ ${dead.name} 陣亡並離開了隊伍。`);
    }
  }

  async function processCombatAction(io, session, characterId, skillId, targetIdx) {
    const attacker = session.party.find(p => Number(p.characterId) === Number(characterId));
    if (!attacker || attacker.hp <= 0) { advanceTurn(io, session); return; }

    const jobSkills = JOB_SKILLS ? JOB_SKILLS[attacker.job] : [];
    const skill     = jobSkills?.find(s => s.id === skillId) || { name: '普通攻擊', cost: 0, type: 'physical', baseDmg: [5, 10] };

    if (skill.cost > attacker.mp) {
      socket_to_char(io, session.roomCode, characterId, 'error', { msg: 'MP不足！' });
      socket_to_char(io, session.roomCode, characterId, 'combat:turn', { currentTurn: characterId, timeoutMs: TURN_TIMEOUT_MS });
      scheduleAutoTurn(io, session); return;
    }

    attacker.mp = Math.max(0, attacker.mp - (skill.cost||0));
    attacker.mp = Math.min(attacker.maxMp, attacker.mp + 5); 

    if (skill.type === 'heal' || skill.id?.includes('heal') || skill.id === 'revive') {
      const target = session.party[targetIdx % session.party.length];
      const healAmt = calcHeal ? calcHeal(attacker) : 30;
      target.hp = Math.min(target.maxHp, target.hp + healAmt);
      addLog(session, 'player', `✨ ${attacker.name} 施放 ${skill.name}，恢復 ${healAmt} HP！`);
    } else {
      const target = session.enemies.find((e, i) => i === targetIdx && e.currentHp > 0) || session.enemies.find(e => e.currentHp > 0);
      if (!target) { broadcastCombatState(io, session); checkCombatEnd(io, session); return; }

      const dmgInfo = calcDamage ? calcDamage(attacker, skill, target.def) : { dmg: 15, isCrit: false };
      target.currentHp = Math.max(0, target.currentHp - dmgInfo.dmg);
      addLog(session, 'player', `⚔ ${attacker.name} 使用 ${skill.name} → ${target.name} 受到 ${dmgInfo.dmg} 傷害${dmgInfo.isCrit?' [會心!]':''}！`);
    }

    broadcastCombatState(io, session);
    if (checkCombatEnd(io, session)) return;
    await handleDeaths(io, session);
    advanceTurn(io, session);
  }

  function advanceTurn(io, session) {
    if (session.status !== 'active') return;

    let next = (session.turnIndex + 1) % session.turnOrder.length;
    let skips = 0;
    while (skips < session.turnOrder.length) {
      const charId = session.turnOrder[next];
      const member = session.party.find(p => Number(p.characterId) === Number(charId));
      if (member && member.hp > 0) break;
      next = (next + 1) % session.turnOrder.length;
      skips++;
    }

    if (next <= session.turnIndex || skips >= session.turnOrder.length) {
      session.turnIndex = 0;
      enemyTurn(io, session);
      return;
    }

    session.turnIndex = next;
    broadcastTurnChange(io, session);
    scheduleAutoTurn(io, session);
  }

  async function enemyTurn(io, session) {
    if (session.status !== 'active') return;
    addLog(session, 'system', '── 敵方回合 ──');

    session.enemies.forEach(enemy => {
      if (enemy.currentHp <= 0) return;
      const alive = session.party.filter(p => p.hp > 0);
      if (!alive.length) return;
      const target = alive[Math.floor(Math.random() * alive.length)];
      const [min, max] = enemy.atk || [5, 10];
      let dmg = Math.floor(Math.random() * (max - min + 1)) + min;
      dmg = Math.max(1, dmg - Math.floor((target.stats.DEF || 10) * 0.35));
      target.hp = Math.max(0, target.hp - dmg);
      addLog(session, 'enemy', ` ${enemy.name} 攻擊 ${target.name}，造成 ${dmg} 傷害！`);
    });

    broadcastCombatState(io, session);
    if (checkCombatEnd(io, session)) return;

    await handleDeaths(io, session);

    session.turnIndex = 0;
    let skips = 0;
    while (skips < session.turnOrder.length) {
      const charId = session.turnOrder[session.turnIndex];
      const member = session.party.find(p => Number(p.characterId) === Number(charId));
      if (member && member.hp > 0) break;
      session.turnIndex = (session.turnIndex + 1) % session.turnOrder.length;
      skips++;
    }
    broadcastTurnChange(io, session);
    scheduleAutoTurn(io, session);
  }

  function checkCombatEnd(io, session) {
    const allEnemiesDead = session.enemies.every(e => e.currentHp <= 0);
    const allPlayersDead = session.party.every(p => p.hp <= 0);

    if (allEnemiesDead) { endCombat(io, session, 'victory'); return true; }
    if (allPlayersDead) { endCombat(io, session, 'defeat'); return true; }
    return false;
  }

  async function endCombat(io, session, result) {
    clearTimeout(session.turnTimer);
    session.status = result === 'victory' ? 'victory' : 'defeat';

    let totalXp = 0, totalGold = 0, loot = [];

    if (result === 'victory') {
      session.enemies.forEach(e => {
        totalXp   += e.xp;
        totalGold += e.gold;
        if (e.loot && Math.random() < 0.6) loot.push(e.loot);
      });

      for (const member of session.party) {
        const char = await queryOne('SELECT * FROM characters WHERE id=?', [member.characterId]);
        if (!char) continue;

        let newXp = char.xp + totalXp;
        let newGold = char.gold + totalGold;
        let newLevel = char.level;
        let newXpNext = char.xp_next;
        let newMaxHp = char.max_hp;
        let newMaxMp = char.max_mp;
        let newSp = char.sp;
        let newStr = char.stat_str, newInt = char.stat_int, newAgi = char.stat_agi, newWis = char.stat_wis, newDef = char.stat_def;
        let leveledUp = false;

        while (newXp >= newXpNext) {
          newXp -= newXpNext;
          newLevel++;
          newXpNext = Math.floor(newXpNext * 1.4);
          newMaxHp += 15; newMaxMp += 8; newSp += 2;
          newStr++; newInt++; newAgi++; newWis++; newDef++;
          leveledUp = true;
        }

        await transaction(async (conn) => {
           await conn.execute(
             `UPDATE characters SET
              xp=?, xp_next=?, gold=?, level=?,
              max_hp=?, hp=?, max_mp=?, mp=?, sp=?,
              stat_str=?, stat_int=?, stat_agi=?, stat_wis=?, stat_def=?
              WHERE id=?`,
             [
               newXp, newXpNext, newGold, newLevel,
               newMaxHp, leveledUp ? newMaxHp : Math.max(1, member.hp),
               newMaxMp, member.mp, newSp,
               newStr, newInt, newAgi, newWis, newDef,
               char.id
             ]
           );
        });
      }
    } else if (result === 'defeat') {
      for (const member of session.party) {
        await execute('UPDATE characters SET hp=? WHERE id=?', [Math.floor(member.maxHp * 0.2), member.characterId]);
      }
    }

    io.to(session.roomCode).emit('combat:end', {
      result, log: session.log,
      rewards: { xp: totalXp, gold: totalGold, loot },
      party: session.party.map(publicParty)
    });

    if (result === 'victory') {
      const maxFloors = 1;
      
      if (session.floor < maxFloors) {
        setTimeout(async () => {
          const members = await getRoomMembers(session.roomId);
          spawnFloor(io, { id: session.roomId, dungeon_id: session.dungeonId }, members, session.roomCode, session.floor + 1);
        }, 3000);
      } else {
        await execute("UPDATE dungeon_rooms SET status='waiting', ended_at=NOW() WHERE id=?", [session.roomId]);
        await execute("UPDATE room_members SET is_ready=FALSE WHERE room_id=? AND is_leader=FALSE", [session.roomId]);
        io.to(session.roomCode).emit('dungeon:completed', { floor: session.floor });
        activeSessions.delete(session.roomCode);
        
        const members = await getRoomMembers(session.roomId);
        io.to(session.roomCode).emit('room:update', { members, status: 'waiting' });
      }
    } else {
      await execute("UPDATE dungeon_rooms SET status='waiting', ended_at=NOW() WHERE id=?", [session.roomId]);
      await execute("UPDATE room_members SET is_ready=FALSE WHERE room_id=? AND is_leader=FALSE", [session.roomId]);
      activeSessions.delete(session.roomCode);
      const members = await getRoomMembers(session.roomId);
      io.to(session.roomCode).emit('room:update', { members, status: 'waiting' });
    }
  }

  function scheduleAutoTurn(io, session) {
    clearTimeout(session.turnTimer);
    session.turnTimer = setTimeout(() => {
      const charId = session.turnOrder[session.turnIndex];
      processCombatAction(io, session, charId, 'basic_atk', 0);
    }, TURN_TIMEOUT_MS);
  }

  async function getRoomMembers(roomId) {
    return query(
      `SELECT rm.*, c.id AS character_id, c.name, c.job, c.level, c.hp, c.max_hp, c.mp, c.max_mp
       FROM room_members rm JOIN characters c ON c.id=rm.character_id
       WHERE rm.room_id=?`, [roomId]
    );
  }

  function getFloorEnemies(dungeonId, floor) {
    return ['goblin']; 
  }

  function addLog(session, type, msg) {
    session.log.push({ type, msg, time: Date.now() });
    io.to(session.roomCode).emit('combat:log', { type, msg });
  }

  function broadcastCombatState(io, session) {
    io.to(session.roomCode).emit('combat:state', { enemies: session.enemies.map(publicEnemy), party: session.party.map(publicParty) });
  }

  function broadcastTurnChange(io, session) {
    const currentId = session.turnOrder[session.turnIndex];
    io.to(session.roomCode).emit('combat:turn', { currentTurn: currentId, timeoutMs: TURN_TIMEOUT_MS });
  }

  function publicEnemy(e) { return { id: e.id, name: e.name, icon: e.icon, level: e.level, currentHp: e.currentHp, maxHp: e.hp, statusEffects: e.statusEffects }; }
  function publicParty(p) { return { characterId: p.characterId, name: p.name, job: p.job, level: p.level, hp: p.hp, maxHp: p.maxHp, mp: p.mp, maxMp: p.maxMp, statusEffects: p.statusEffects }; }

  function socket_to_char(io, roomCode, characterId, event, data) {
    for (const [sid, info] of socketIndex.entries()) {
      if (Number(info.characterId) === Number(characterId) && info.roomCode === roomCode) {
        io.to(sid).emit(event, data);
        break;
      }
    }
  }
};
