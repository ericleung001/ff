// server/socketHandler.js — Real-time dungeon & combat via Socket.io
const jwt    = require('jsonwebtoken');
const { query, queryOne, execute, transaction } = require('./db');
const { ENEMIES, JOB_SKILLS, calcDamage, calcHeal, LOOT_TABLE } = require('./gameData');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const TURN_TIMEOUT_MS = parseInt(process.env.DUNGEON_TURN_TIMEOUT) || 30000;

// In-memory active combat sessions
// Map<roomCode, CombatState>
const activeSessions = new Map();

// Map<socketId, { userId, characterId, roomCode }>
const socketIndex = new Map();

// ─────────────────────────────────────────────────────────────────
//  CombatState shape:
//  {
//    roomCode, roomId, floor, dungeonId,
//    enemies: [{...enemyData, currentHp, statusEffects:[]}],
//    party: [{ characterId, name, job, level, hp, maxHp, mp, maxMp, stats, skills, statusEffects:[] }],
//    turnOrder: [characterId, ...],  // all party members (enemies act after all)
//    turnIndex: 0,
//    log: [],
//    status: 'active'|'victory'|'defeat',
//    turnTimer: setTimeout handle,
//  }
// ─────────────────────────────────────────────────────────────────

module.exports = function initSockets(io) {

  // ── Auth middleware for socket ──────────────────────────
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

  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id} user:${socket.user.userId}`);

    // ── JOIN ROOM ───────────────────────────────────────
    socket.on('room:join', async ({ roomCode, characterId }) => {
      try {
        const room = await queryOne(
          'SELECT * FROM dungeon_rooms WHERE room_code=?', [roomCode]
        );
        if (!room) return socket.emit('error', { msg: '房間不存在' });

        // Verify character belongs to this user
        const char = await queryOne(
          'SELECT id FROM characters WHERE id=? AND user_id=?',
          [characterId, socket.user.userId]
        );
        if (!char) return socket.emit('error', { msg: '角色驗證失敗' });

        // Check if member exists in DB — if not (race condition), insert now
        let member = await queryOne(
          `SELECT rm.*, c.name, c.job, c.level, rm.is_leader, rm.is_ready
           FROM room_members rm JOIN characters c ON c.id=rm.character_id
           WHERE rm.room_id=? AND rm.character_id=?`,
          [room.id, characterId]
        );
        if (!member) {
          // Auto-insert if room still waiting and not full
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

        // Register socket
        socketIndex.set(socket.id, { userId: socket.user.userId, characterId, roomCode });
        socket.join(roomCode);

        const members = await getRoomMembers(room.id);
        io.to(roomCode).emit('room:update', { members, status: room.status });
        socket.emit('room:joined', { roomCode, roomId: room.id, isLeader: !!member.is_leader });
      } catch (err) {
        console.error('[room:join]', err);
        socket.emit('error', { msg: '加入房間失敗' });
      }
    });

    // ── READY TOGGLE ────────────────────────────────────
    socket.on('room:ready', async ({ roomCode }) => {
      const info = socketIndex.get(socket.id);
      if (!info) return socket.emit('error', { msg: '請先加入房間' });
      if (info.roomCode !== roomCode) return socket.emit('error', { msg: '房間代碼不符' });

      const room = await queryOne('SELECT * FROM dungeon_rooms WHERE room_code=?', [roomCode]);
      if (!room || room.status !== 'waiting') return;

      await execute(
        'UPDATE room_members SET is_ready=NOT is_ready WHERE room_id=? AND character_id=?',
        [room.id, info.characterId]
      );

      const members = await getRoomMembers(room.id);
      io.to(roomCode).emit('room:update', { members, status: room.status });
    });

    // ── START DUNGEON (leader only) ──────────────────────
    socket.on('dungeon:start', async ({ roomCode }) => {
      const info = socketIndex.get(socket.id);
      if (!info) return;

      const room = await queryOne('SELECT * FROM dungeon_rooms WHERE room_code=?', [roomCode]);
      if (!room || room.status !== 'waiting') return;

      const isLeader = await queryOne(
        'SELECT is_leader FROM room_members WHERE room_id=? AND character_id=? AND is_leader=TRUE',
        [room.id, info.characterId]
      );
      if (!isLeader) return socket.emit('error', { msg: '只有隊長可以開始' });

      const members = await getRoomMembers(room.id);
      await startDungeon(io, room, members, roomCode);
    });

    // ── COMBAT ACTION ────────────────────────────────────
    socket.on('combat:action', async ({ roomCode, skillId, targetIdx = 0 }) => {
      const info = socketIndex.get(socket.id);
      if (!info || info.roomCode !== roomCode) return;

      const session = activeSessions.get(roomCode);
      if (!session || session.status !== 'active') return;

      // Verify it's this player's turn
      const currentId = session.turnOrder[session.turnIndex];
      if (currentId !== info.characterId) {
        return socket.emit('error', { msg: '還沒輪到你！' });
      }

      clearTimeout(session.turnTimer);
      await processCombatAction(io, session, info.characterId, skillId, targetIdx);
    });

    // ── FLEE ────────────────────────────────────────────
    socket.on('combat:flee', async ({ roomCode }) => {
      const info = socketIndex.get(socket.id);
      const session = activeSessions.get(roomCode);
      if (!session) return;

      const currentId = session.turnOrder[session.turnIndex];
      if (currentId !== info.characterId) return;

      clearTimeout(session.turnTimer);
      const member = session.party.find(p => p.characterId === info.characterId);
      const agiBonus = (member?.stats?.AGI || 8) * 0.01;
      const success = Math.random() < 0.4 + agiBonus;

      if (success) {
        addLog(session, 'system', `${member.name} 成功逃跑！`);
        endCombat(io, session, 'fled');
      } else {
        const dmg = Math.floor(8 + Math.random() * 10);
        member.hp = Math.max(0, member.hp - dmg);
        addLog(session, 'enemy', `${member.name} 逃跑失敗，受到 ${dmg} 傷害！`);
        advanceTurn(io, session);
      }
    });

    // ── CHAT ────────────────────────────────────────────
    socket.on('chat', ({ roomCode, message }) => {
      const info = socketIndex.get(socket.id);
      if (!info || !message) return;
      io.to(roomCode).emit('chat', {
        from: socket.user.username,
        characterId: info.characterId,
        message: message.slice(0, 200),
        time: Date.now(),
      });
    });

    // ── DISCONNECT ───────────────────────────────────────
    socket.on('disconnect', () => {
      const info = socketIndex.get(socket.id);
      if (info) {
        io.to(info.roomCode).emit('room:member_left', { characterId: info.characterId });
        socketIndex.delete(socket.id);
      }
    });
  });

  // ─────────────────────────────────────────────────────────
  //  DUNGEON LOGIC
  // ─────────────────────────────────────────────────────────

  async function startDungeon(io, room, members, roomCode) {
    await execute(
      "UPDATE dungeon_rooms SET status='in_progress', started_at=NOW() WHERE id=?",
      [room.id]
    );
    io.to(roomCode).emit('dungeon:starting', { floor: 1 });
    // Give clients 2s to receive the event and prepare
    setTimeout(() => spawnFloor(io, room, members, roomCode, 1), 2000);
  }

  async function spawnFloor(io, room, members, roomCode, floor) {
    const enemyIds = getFloorEnemies(room.dungeon_id, floor);
    const enemies = enemyIds.map(id => {
      const base = ENEMIES[id] || ENEMIES['goblin'];
      return { ...base, currentHp: base.hp, statusEffects: [] };
    });

    // Build party snapshot from DB
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

    // Turn order by AGI desc
    const turnOrder = [...party].sort((a, b) => (b.stats.AGI || 0) - (a.stats.AGI || 0))
                                 .map(p => p.characterId);

    const session = {
      roomCode, roomId: room.id, floor, dungeonId: room.dungeon_id,
      enemies, party, turnOrder, turnIndex: 0,
      log: [], status: 'active', turnTimer: null,
    };
    activeSessions.set(roomCode, session);

    const payload = {
      floor,
      enemies: enemies.map(publicEnemy),
      party: party.map(publicParty),
      turnOrder,
      currentTurn: turnOrder[0],
    };

    // Emit to entire room — all sockets that have joined roomCode channel
    io.to(roomCode).emit('combat:start', payload);

    // Schedule first turn timer
    setTimeout(() => {
      broadcastTurnChange(io, session);
      scheduleAutoTurn(io, session);
    }, 500);
  }


  async function processCombatAction(io, session, characterId, skillId, targetIdx) {
    const attacker = session.party.find(p => p.characterId === characterId);
    if (!attacker || attacker.hp <= 0) {
      advanceTurn(io, session); return;
    }

    const jobSkills = JOB_SKILLS[attacker.job] || [];
    const basicAtk  = jobSkills.find(s => s.id === 'basic_atk');
    const skill     = jobSkills.find(s => s.id === skillId) || basicAtk;

    if (!skill) { advanceTurn(io, session); return; }

    if (skill.cost > attacker.mp) {
      socket_to_char(io, session.roomCode, characterId, 'error', { msg: 'MP不足！' });
      socket_to_char(io, session.roomCode, characterId, 'combat:turn', {
        currentTurn: characterId, timeoutMs: TURN_TIMEOUT_MS,
      });
      scheduleAutoTurn(io, session); return;
    }

    attacker.mp = Math.max(0, attacker.mp - skill.cost);
    attacker.mp = Math.min(attacker.maxMp, attacker.mp + 5); // MP regen per action

    if (skill.type === 'heal') {
      const target = session.party[targetIdx % session.party.length];
      const healAmt = calcHeal(attacker);
      target.hp = Math.min(target.maxHp, target.hp + healAmt);
      addLog(session, 'player', `✨ ${attacker.name} 對 ${target.name} 施放 ${skill.name}，恢復 ${healAmt} HP！`);
    } else {
      // Find a valid alive enemy target
      const target = session.enemies.find((e, i) => i === targetIdx && e.currentHp > 0)
                  || session.enemies.find(e => e.currentHp > 0);

      if (!target) {
        // All enemies already dead
        broadcastCombatState(io, session);
        checkCombatEnd(io, session);
        return;
      }

      const { dmg, isCrit } = calcDamage(attacker, skill, target.def);
      target.currentHp = Math.max(0, target.currentHp - dmg);
      addLog(session, 'player',
        `⚔ ${attacker.name} 使用 ${skill.name} → ${target.name} 受到 ${dmg} 傷害${isCrit?' [暴擊!]':''}！`
      );

      if (skill.effect === 'poison' && Math.random() < 0.5) {
        target.statusEffects.push({ type:'poison', dmg: skill.poisonDmg || 5, turns: 3 });
        addLog(session, 'system', `${target.name} 中毒了！`);
      }
      if (skill.effect === 'stun' && Math.random() < 0.3) {
        target.statusEffects.push({ type:'stun', turns: 1 });
        addLog(session, 'system', `${target.name} 被眩暈了！`);
      }
    }

    // Always broadcast state FIRST so clients see updated HP
    broadcastCombatState(io, session);

    // Check win/loss BEFORE advancing turn — if combat ended, stop here
    if (checkCombatEnd(io, session)) return;

    advanceTurn(io, session);
  }

  function advanceTurn(io, session) {
    if (session.status !== 'active') return;

    tickStatusEffects(io, session);
    if (checkCombatEnd(io, session)) return;

    // Move to next alive party member
    let next = (session.turnIndex + 1) % session.turnOrder.length;
    let skips = 0;
    while (skips < session.turnOrder.length) {
      const charId = session.turnOrder[next];
      const member = session.party.find(p => p.characterId === charId);
      if (member && member.hp > 0) break;
      next = (next + 1) % session.turnOrder.length;
      skips++;
    }

    // If we've gone through everyone (all players dead or looped back to start)
    if (next <= session.turnIndex || skips >= session.turnOrder.length) {
      // Enemy turn after all players have acted
      session.turnIndex = 0;
      enemyTurn(io, session);
      return;
    }

    session.turnIndex = next;
    broadcastTurnChange(io, session);
    scheduleAutoTurn(io, session);
  }

  function enemyTurn(io, session) {
    if (session.status !== 'active') return;

    addLog(session, 'system', '── 敵方回合 ──');

    session.enemies.forEach(enemy => {
      if (enemy.currentHp <= 0) return;
      if (session.status !== 'active') return;

      const stun = enemy.statusEffects.find(e => e.type === 'stun');
      if (stun) {
        stun.turns--;
        if (stun.turns <= 0) enemy.statusEffects = enemy.statusEffects.filter(e => e.type !== 'stun');
        addLog(session, 'system', `${enemy.name} 被眩暈，跳過回合！`);
        return;
      }

      const poison = enemy.statusEffects.find(e => e.type === 'poison');
      if (poison) {
        enemy.currentHp = Math.max(0, enemy.currentHp - poison.dmg);
        poison.turns--;
        if (poison.turns <= 0) enemy.statusEffects = enemy.statusEffects.filter(e => e.type !== 'poison');
        addLog(session, 'enemy', `${enemy.name} 受到毒素傷害 ${poison.dmg}！`);
        if (enemy.currentHp <= 0) {
          addLog(session, 'system', `${enemy.name} 因毒素死亡！`);
          return;
        }
      }

      const alive = session.party.filter(p => p.hp > 0);
      if (!alive.length) return;
      const target = alive[Math.floor(Math.random() * alive.length)];
      const [min, max] = enemy.atk;
      let dmg = Math.floor(Math.random() * (max - min + 1)) + min;
      dmg = Math.max(1, dmg - Math.floor((target.stats.DEF || 10) * 0.35));
      target.hp = Math.max(0, target.hp - dmg);
      addLog(session, 'enemy', ` ${enemy.name} 攻擊 ${target.name}，造成 ${dmg} 傷害！`);
    });

    broadcastCombatState(io, session);
    if (checkCombatEnd(io, session)) return;

    // Back to first alive player
    session.turnIndex = 0;
    let skips = 0;
    while (skips < session.turnOrder.length) {
      const charId = session.turnOrder[session.turnIndex];
      const member = session.party.find(p => p.characterId === charId);
      if (member && member.hp > 0) break;
      session.turnIndex = (session.turnIndex + 1) % session.turnOrder.length;
      skips++;
    }
    broadcastTurnChange(io, session);
    scheduleAutoTurn(io, session);
  }

  function tickStatusEffects(io, session) {
    // Tick player effects
    session.party.forEach(p => {
      p.statusEffects = p.statusEffects.filter(e => {
        if (e.type === 'poison') {
          p.hp = Math.max(0, p.hp - e.dmg);
          e.turns--;
          addLog(session, 'enemy', `${p.name} 受到毒素傷害 ${e.dmg}！`);
          return e.turns > 0;
        }
        if (e.type === 'regen') {
          p.hp = Math.min(p.maxHp, p.hp + e.amt);
          e.turns--;
          return e.turns > 0;
        }
        return true;
      });
    });
  }

  function checkCombatEnd(io, session) {
    const allEnemiesDead = session.enemies.every(e => e.currentHp <= 0);
    const allPlayersDead = session.party.every(p => p.hp <= 0);

    if (allEnemiesDead) {
      endCombat(io, session, 'victory');
      return true;
    }
    if (allPlayersDead) {
      endCombat(io, session, 'defeat');
      return true;
    }
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

      // Persist rewards to DB
      for (const member of session.party) {
        await transaction(async (conn) => {
          // Save HP/MP
          await conn.execute(
            'UPDATE characters SET hp=?, mp=? WHERE id=?',
            [Math.max(1, member.hp), member.mp, member.characterId]
          );
          // Add XP & gold
          await conn.execute(
            'UPDATE characters SET xp=xp+?, gold=gold+? WHERE id=?',
            [totalXp, totalGold, member.characterId]
          );
          // Check level up
          await handleLevelUp(conn, member.characterId);
          // Add loot to inventory
          for (const lootId of loot) {
            const item = LOOT_TABLE[lootId];
            if (!item) continue;
            await conn.execute(
              `INSERT INTO inventory (character_id, item_id, item_name, item_type, rarity, stat_bonus, quantity)
               VALUES (?,?,?,?,?,?,1)
               ON DUPLICATE KEY UPDATE quantity=quantity+1`,
              [member.characterId, lootId, item.name, item.type, item.rarity, JSON.stringify({})]
            );
          }
          // Battle history
          await conn.execute(
            `INSERT INTO battle_history (character_id, enemy_name, result, xp_gained, gold_gained, floor)
             VALUES (?,?,?,?,?,?)`,
            [member.characterId, session.enemies[0]?.name, result, totalXp, totalGold, session.floor]
          );
        });
      }

      addLog(session, 'system', `✦ 勝利！獲得 ${totalXp} EXP · ¥${totalGold} 金幣！`);
      if (loot.length) addLog(session, 'system', `戰利品：${loot.map(l => LOOT_TABLE[l]?.name).join(', ')}`);
    } else if (result === 'defeat') {
      for (const member of session.party) {
        await execute(
          'UPDATE characters SET hp=? WHERE id=?',
          [Math.floor(member.maxHp * 0.2), member.characterId]
        );
      }
      addLog(session, 'system', '☠ 全滅... 隊伍被傳送回村莊。HP恢復20%。');
    }

    io.to(session.roomCode).emit('combat:end', {
      result, log: session.log,
      rewards: { xp: totalXp, gold: totalGold, loot },
      party: session.party.map(publicParty),
    });

    // Advance floor or end dungeon
    if (result === 'victory') {
      const maxFloors = 5;
      if (session.floor < maxFloors) {
        setTimeout(async () => {
          const members = await getRoomMembers(session.roomId);
          spawnFloor(io, { id: session.roomId, dungeon_id: session.dungeonId }, members, session.roomCode, session.floor + 1);
        }, 3000);
      } else {
        await execute('UPDATE dungeon_rooms SET status=\'completed\', ended_at=NOW() WHERE id=?', [session.roomId]);
        io.to(session.roomCode).emit('dungeon:completed', { floor: session.floor });
        activeSessions.delete(session.roomCode);
      }
    } else {
      await execute('UPDATE dungeon_rooms SET status=\'failed\', ended_at=NOW() WHERE id=?', [session.roomId]);
      activeSessions.delete(session.roomCode);
    }
  }

  function scheduleAutoTurn(io, session) {
    clearTimeout(session.turnTimer);
    session.turnTimer = setTimeout(() => {
      const charId = session.turnOrder[session.turnIndex];
      addLog(session, 'system', '⏱ 時間到，自動使用普通攻擊！');
      processCombatAction(io, session, charId, 'basic_atk', 0);
    }, TURN_TIMEOUT_MS);
  }

  // ─── Helpers ───────────────────────────────────────────

  async function handleLevelUp(conn, characterId) {
    const c = await conn.execute(
      'SELECT level, xp, xp_next, max_hp, max_mp, sp FROM characters WHERE id=? FOR UPDATE',
      [characterId]
    );
    const char = c[0][0];
    if (!char || char.xp < char.xp_next) return;

    const newLevel  = char.level + 1;
    const newXpNext = Math.floor(char.xp_next * 1.4);
    await conn.execute(
      `UPDATE characters
       SET level=?, xp=xp-xp_next, xp_next=?, sp=sp+2,
           max_hp=max_hp+15, hp=max_hp+15,
           max_mp=max_mp+8,
           stat_str=stat_str+1, stat_int=stat_int+1,
           stat_agi=stat_agi+1, stat_wis=stat_wis+1, stat_def=stat_def+1
       WHERE id=?`,
      [newLevel, newXpNext, characterId]
    );
  }

  async function getRoomMembers(roomId) {
    return query(
      `SELECT rm.*, c.id AS character_id, c.name, c.job, c.level, c.hp, c.max_hp, c.mp, c.max_mp
       FROM room_members rm JOIN characters c ON c.id=rm.character_id
       WHERE rm.room_id=?`,
      [roomId]
    );
  }

  function getFloorEnemies(dungeonId, floor) {
    const pools = {
      1: { 1:['goblin','goblin'],2:['skeleton','dark_wolf'],3:['shadow_hunter'],4:['abyss_demon'],5:['gate_guardian'] },
      2: { 1:['abyss_demon'],2:['chaos_giant'],3:['void_knight'],4:['abyss_lord'] },
    };
    const pool = (pools[dungeonId] || pools[1])[floor] || ['goblin'];
    return pool;
  }

  function addLog(session, type, msg) {
    session.log.push({ type, msg, time: Date.now() });
    io.to(session.roomCode).emit('combat:log', { type, msg });
  }

  function broadcastCombatState(io, session) {
    io.to(session.roomCode).emit('combat:state', {
      enemies: session.enemies.map(publicEnemy),
      party: session.party.map(publicParty),
    });
  }

  function broadcastTurnChange(io, session) {
    const currentId = session.turnOrder[session.turnIndex];
    io.to(session.roomCode).emit('combat:turn', {
      currentTurn: currentId,
      timeoutMs: TURN_TIMEOUT_MS,
    });
  }

  function publicEnemy(e) {
    return { id: e.id, name: e.name, icon: e.icon, level: e.level,
             currentHp: e.currentHp, maxHp: e.hp, statusEffects: e.statusEffects };
  }
  function publicParty(p) {
    return { characterId: p.characterId, name: p.name, job: p.job, level: p.level,
             hp: p.hp, maxHp: p.maxHp, mp: p.mp, maxMp: p.maxMp, statusEffects: p.statusEffects };
  }

  function socket_to_char(io, roomCode, characterId, event, data) {
    // Send to specific character's socket
    for (const [sid, info] of socketIndex.entries()) {
      if (info.characterId === characterId && info.roomCode === roomCode) {
        io.to(sid).emit(event, data);
        break;
      }
    }
  }
};