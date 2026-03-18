import { Server } from 'socket.io';

const PORT = 3003;

const io = new Server(PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

interface Party {
  id: string;
  name: string;
  leaderId: string;
  members: Set<string>;
  maxMembers: number;
  status: 'open' | 'closed' | 'in_battle' | 'in_dungeon';
  dungeonId?: string;
  currentFloor?: number;
}

interface Character {
  id: string;
  name: string;
  userId: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  magic: number;
  speed: number;
  characterClass: string;
}

interface BattleState {
  partyId: string;
  monsterId: string;
  monsterName: string;
  monsterHp: number;
  monsterMaxHp: number;
  monsterAttack: number;
  monsterDefense: number;
  turn: number;
  logs: string[];
  characterHps: Map<string, number>;
}

// 內存存儲
const parties = new Map<string, Party>();
const userPartyMap = new Map<string, string>(); // userId -> partyId
const characterMap = new Map<string, Character>(); // characterId -> Character
const battleStates = new Map<string, BattleState>(); // partyId -> BattleState
const pendingInvites = new Map<string, { fromPartyId: string; fromCharacterName: string }>(); // characterId -> invite

io.on('connection', (socket) => {
  console.log(`玩家連接: ${socket.id}`);

  // 註冊角色
  socket.on('register_character', (character: Character) => {
    characterMap.set(character.id, character);
    socket.data.characterId = character.id;
    socket.data.userId = character.userId;
    console.log(`角色註冊: ${character.name} (${character.id})`);
  });

  // 創建隊伍
  socket.on('create_party', (data: { name: string; character: Character }) => {
    const character = data.character;
    const partyId = `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const party: Party = {
      id: partyId,
      name: data.name,
      leaderId: character.id,
      members: new Set([character.id]),
      maxMembers: 4,
      status: 'open',
    };
    
    parties.set(partyId, party);
    userPartyMap.set(character.userId, partyId);
    characterMap.set(character.id, character);
    
    socket.join(partyId);
    socket.emit('party_created', {
      partyId,
      party: {
        ...party,
        members: Array.from(party.members),
      },
    });
    
    // 廣播新隊伍
    io.emit('party_list_update', getPartyList());
  });

  // 獲取隊伍列表
  socket.on('get_party_list', () => {
    socket.emit('party_list', getPartyList());
  });

  // 加入隊伍
  socket.on('join_party', (data: { partyId: string; character: Character }) => {
    const party = parties.get(data.partyId);
    
    if (!party) {
      socket.emit('error', { message: '隊伍不存在' });
      return;
    }
    
    if (party.members.size >= party.maxMembers) {
      socket.emit('error', { message: '隊伍已滿' });
      return;
    }
    
    if (party.status !== 'open') {
      socket.emit('error', { message: '隊伍目前無法加入' });
      return;
    }
    
    party.members.add(data.character.id);
    userPartyMap.set(data.character.userId, data.partyId);
    characterMap.set(data.character.id, data.character);
    
    socket.join(data.partyId);
    
    io.to(data.partyId).emit('party_update', {
      party: {
        ...party,
        members: Array.from(party.members),
      },
      joinedCharacter: data.character,
    });
    
    io.emit('party_list_update', getPartyList());
  });

  // 邀請加入隊伍
  socket.on('invite_to_party', (data: { targetCharacterId: string; partyId: string }) => {
    const party = parties.get(data.partyId);
    if (!party) {
      socket.emit('error', { message: '隊伍不存在' });
      return;
    }
    
    const inviterCharacter = characterMap.get(socket.data.characterId);
    if (!inviterCharacter) {
      socket.emit('error', { message: '請先註冊角色' });
      return;
    }
    
    pendingInvites.set(data.targetCharacterId, {
      fromPartyId: data.partyId,
      fromCharacterName: inviterCharacter.name,
    });
    
    // 廣播邀請給目標玩家
    io.emit('party_invite', {
      targetCharacterId: data.targetCharacterId,
      fromCharacterName: inviterCharacter.name,
      partyId: data.partyId,
      partyName: party.name,
    });
  });

  // 接受邀請
  socket.on('accept_invite', (data: { character: Character }) => {
    const invite = pendingInvites.get(data.character.id);
    if (!invite) {
      socket.emit('error', { message: '沒有有效的邀請' });
      return;
    }
    
    const party = parties.get(invite.fromPartyId);
    if (!party) {
      socket.emit('error', { message: '隊伍已解散' });
      pendingInvites.delete(data.character.id);
      return;
    }
    
    if (party.members.size >= party.maxMembers) {
      socket.emit('error', { message: '隊伍已滿' });
      pendingInvites.delete(data.character.id);
      return;
    }
    
    party.members.add(data.character.id);
    userPartyMap.set(data.character.userId, invite.fromPartyId);
    characterMap.set(data.character.id, data.character);
    
    socket.join(invite.fromPartyId);
    pendingInvites.delete(data.character.id);
    
    io.to(invite.fromPartyId).emit('party_update', {
      party: {
        ...party,
        members: Array.from(party.members),
      },
      joinedCharacter: data.character,
    });
    
    io.emit('party_list_update', getPartyList());
  });

  // 離開隊伍
  socket.on('leave_party', (data: { characterId: string; userId: string }) => {
    const partyId = userPartyMap.get(data.userId);
    if (!partyId) return;
    
    const party = parties.get(partyId);
    if (!party) return;
    
    party.members.delete(data.characterId);
    userPartyMap.delete(data.userId);
    
    socket.leave(partyId);
    
    if (party.members.size === 0) {
      parties.delete(partyId);
      battleStates.delete(partyId);
      io.emit('party_list_update', getPartyList());
    } else {
      // 如果隊長離開，轉移隊長
      if (party.leaderId === data.characterId) {
        party.leaderId = Array.from(party.members)[0];
      }
      
      io.to(partyId).emit('party_update', {
        party: {
          ...party,
          members: Array.from(party.members),
        },
        leftCharacterId: data.characterId,
      });
      
      io.emit('party_list_update', getPartyList());
    }
  });

  // 開始戰鬥（打怪）
  socket.on('start_battle', async (data: { partyId: string; monster: any }) => {
    const party = parties.get(data.partyId);
    if (!party) {
      socket.emit('error', { message: '隊伍不存在' });
      return;
    }
    
    party.status = 'in_battle';
    
    const battleState: BattleState = {
      partyId: data.partyId,
      monsterId: data.monster.id,
      monsterName: data.monster.name,
      monsterHp: data.monster.hp,
      monsterMaxHp: data.monster.hp,
      monsterAttack: data.monster.attack,
      monsterDefense: data.monster.defense,
      turn: 1,
      logs: [`⚔️ 戰鬥開始！遭遇 ${data.monster.icon} ${data.monster.name}！`],
      characterHps: new Map(),
    };
    
    // 初始化角色 HP
    for (const memberId of party.members) {
      const char = characterMap.get(memberId);
      if (char) {
        battleState.characterHps.set(memberId, char.hp);
      }
    }
    
    battleStates.set(data.partyId, battleState);
    
    io.to(data.partyId).emit('battle_started', {
      battle: {
        ...battleState,
        characterHps: Object.fromEntries(battleState.characterHps),
      },
      monster: data.monster,
    });
  });

  // 執行戰鬥回合
  socket.on('battle_action', (data: { partyId: string; action: 'attack' | 'skill'; skillId?: string }) => {
    const battleState = battleStates.get(data.partyId);
    if (!battleState) {
      socket.emit('error', { message: '沒有進行中的戰鬥' });
      return;
    }
    
    const party = parties.get(data.partyId);
    if (!party) return;
    
    const characterId = socket.data.characterId;
    const character = characterMap.get(characterId);
    if (!character) return;
    
    // 玩家攻擊
    const damage = Math.max(1, character.attack - battleState.monsterDefense + Math.floor(Math.random() * 5));
    battleState.monsterHp = Math.max(0, battleState.monsterHp - damage);
    battleState.logs.push(`🗡️ ${character.name} 攻擊造成 ${damage} 傷害！`);
    
    // 檢查怪物是否死亡
    if (battleState.monsterHp <= 0) {
      battleState.logs.push(`🎉 ${battleState.monsterName} 被擊敗了！`);
      io.to(data.partyId).emit('battle_ended', {
        victory: true,
        logs: battleState.logs,
      });
      battleStates.delete(data.partyId);
      if (party) {
        party.status = 'open';
      }
      return;
    }
    
    // 怪物反擊（攻擊隨機成員）
    const members = Array.from(party.members);
    const targetId = members[Math.floor(Math.random() * members.length)];
    const targetChar = characterMap.get(targetId);
    const currentHp = battleState.characterHps.get(targetId) || 0;
    
    if (targetChar && currentHp > 0) {
      const monsterDamage = Math.max(1, battleState.monsterAttack - targetChar.defense + Math.floor(Math.random() * 3));
      const newHp = Math.max(0, currentHp - monsterDamage);
      battleState.characterHps.set(targetId, newHp);
      battleState.logs.push(`💥 ${battleState.monsterName} 攻擊 ${targetChar.name}，造成 ${monsterDamage} 傷害！`);
      
      if (newHp <= 0) {
        battleState.logs.push(`💀 ${targetChar.name} 被擊倒了！`);
      }
    }
    
    // 檢查是否全滅
    const allDead = Array.from(battleState.characterHps.values()).every(hp => hp <= 0);
    if (allDead) {
      battleState.logs.push(`💔 隊伍全滅...`);
      io.to(data.partyId).emit('battle_ended', {
        victory: false,
        logs: battleState.logs,
      });
      battleStates.delete(data.partyId);
      if (party) {
        party.status = 'open';
      }
      return;
    }
    
    battleState.turn++;
    
    io.to(data.partyId).emit('battle_update', {
      battle: {
        ...battleState,
        characterHps: Object.fromEntries(battleState.characterHps),
      },
    });
  });

  // 開始迷宮探險
  socket.on('start_dungeon', (data: { partyId: string; dungeon: any }) => {
    const party = parties.get(data.partyId);
    if (!party) {
      socket.emit('error', { message: '隊伍不存在' });
      return;
    }
    
    party.status = 'in_dungeon';
    party.dungeonId = data.dungeon.id;
    party.currentFloor = 1;
    
    io.to(data.partyId).emit('dungeon_started', {
      dungeon: data.dungeon,
      currentFloor: 1,
    });
  });

  // 迷宮前進
  socket.on('dungeon_progress', (data: { partyId: string; encounter: any }) => {
    const party = parties.get(data.partyId);
    if (!party) return;
    
    if (data.encounter) {
      // 遭遇怪物
      io.to(data.partyId).emit('dungeon_encounter', {
        monster: data.encounter,
        currentFloor: party.currentFloor,
      });
    } else {
      // 安全通過
      party.currentFloor = (party.currentFloor || 1) + 1;
      io.to(data.partyId).emit('dungeon_floor_clear', {
        currentFloor: party.currentFloor,
      });
    }
  });

  // 完成迷宮
  socket.on('dungeon_complete', (data: { partyId: string }) => {
    const party = parties.get(data.partyId);
    if (!party) return;
    
    party.status = 'open';
    party.dungeonId = undefined;
    party.currentFloor = undefined;
    
    io.to(data.partyId).emit('dungeon_finished', {
      success: true,
    });
  });

  // 發送聊天訊息
  socket.on('chat_message', (data: { partyId: string; message: string; characterName: string }) => {
    io.to(data.partyId).emit('chat_message', {
      characterName: data.characterName,
      message: data.message,
      timestamp: Date.now(),
    });
  });

  // 斷線處理
  socket.on('disconnect', () => {
    console.log(`玩家斷線: ${socket.id}`);
    // 角色會保持在隊伍中，直到明確離開
  });
});

function getPartyList() {
  return Array.from(parties.values())
    .filter(p => p.status === 'open')
    .map(p => ({
      id: p.id,
      name: p.name,
      leaderId: p.leaderId,
      memberCount: p.members.size,
      maxMembers: p.maxMembers,
      status: p.status,
    }));
}

console.log(`🎮 遊戲 WebSocket 服務運行於端口 ${PORT}`);
