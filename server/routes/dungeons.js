// server/routes/dungeons.js
const express = require('express');
const { query, queryOne, execute } = require('../db');
const { authMiddleware } = require('./auth');

const router = express.Router();
router.use(authMiddleware);

// ── POST /api/dungeons/rooms — create room ────────────────
router.post('/rooms', async (req, res) => {
  try {
    const { characterId, dungeonId = 1, maxPlayers = 4, isPrivate = false, title = '' } = req.body;

    const char = await queryOne(
      'SELECT id, name FROM characters WHERE id=? AND user_id=?',
      [characterId, req.user.userId]
    );
    if (!char) return res.status(403).json({ error: '角色不存在' });

    let code, exists;
    do {
      code = Math.random().toString(36).substr(2, 8).toUpperCase();
      exists = await queryOne('SELECT id FROM dungeon_rooms WHERE room_code=?', [code]);
    } while (exists);

    const roomTitle = title.trim().slice(0, 40) || `${char.name} 的房間`;

    const r = await execute(
      `INSERT INTO dungeon_rooms (room_code, dungeon_id, max_players, is_private, room_title, created_by)
       VALUES (?,?,?,?,?,?)`,
      [code, dungeonId, maxPlayers, isPrivate ? 1 : 0, roomTitle, characterId]
    );

    await execute(
      `INSERT INTO room_members (room_id, character_id, is_leader, is_ready)
       VALUES (?,?,TRUE,FALSE)`,
      [r.insertId, characterId]
    );

    res.status(201).json({ roomId: r.insertId, roomCode: code, isPrivate, title: roomTitle });
  } catch (err) {
    console.error('[create room]', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// ── POST /api/dungeons/rooms/join — join by code ──────────
router.post('/rooms/join', async (req, res) => {
  try {
    const { roomCode, characterId } = req.body;

    const char = await queryOne(
      'SELECT id FROM characters WHERE id=? AND user_id=?',
      [characterId, req.user.userId]
    );
    if (!char) return res.status(403).json({ error: '角色不存在' });

    const room = await queryOne(
      'SELECT * FROM dungeon_rooms WHERE room_code=?', [roomCode.toUpperCase()]
    );
    if (!room) return res.status(404).json({ error: '房間不存在' });
    if (room.status !== 'waiting') return res.status(400).json({ error: '房間已開始或已結束' });

    const memberCount = await queryOne(
      'SELECT COUNT(*) AS c FROM room_members WHERE room_id=?', [room.id]
    );
    if (memberCount.c >= room.max_players)
      return res.status(400).json({ error: '房間已滿' });

    const already = await queryOne(
      'SELECT id FROM room_members WHERE room_id=? AND character_id=?',
      [room.id, characterId]
    );
    if (already) return res.status(400).json({ error: '已在房間中' });

    await execute(
      'INSERT INTO room_members (room_id, character_id) VALUES (?,?)',
      [room.id, characterId]
    );

    res.json({ roomId: room.id, roomCode: room.room_code, title: room.room_title });
  } catch (err) {
    console.error('[join room]', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// ── GET /api/dungeons/rooms/:code — room details ──────────
router.get('/rooms/:code', async (req, res) => {
  const room = await queryOne(
    'SELECT * FROM dungeon_rooms WHERE room_code=?', [req.params.code.toUpperCase()]
  );
  if (!room) return res.status(404).json({ error: '房間不存在' });

  const members = await query(
    `SELECT rm.is_leader, rm.is_ready, c.id, c.name, c.job, c.level, c.hp, c.max_hp
     FROM room_members rm
     JOIN characters c ON c.id = rm.character_id
     WHERE rm.room_id=?`,
    [room.id]
  );

  res.json({ ...room, members });
});

// ── GET /api/dungeons/rooms — list open PUBLIC rooms ──────
router.get('/rooms', async (req, res) => {
  const rooms = await query(
    `SELECT dr.*, 
      (SELECT COUNT(*) FROM room_members WHERE room_id=dr.id) AS member_count,
      c.name AS leader_name
     FROM dungeon_rooms dr
     JOIN room_members rm ON rm.room_id=dr.id AND rm.is_leader=TRUE
     JOIN characters c ON c.id=rm.character_id
     WHERE dr.status='waiting' AND (dr.is_private=0 OR dr.is_private IS NULL)
     ORDER BY dr.created_at DESC LIMIT 20`
  );
  res.json(rooms);
});

// ── PATCH /api/dungeons/rooms/:id/ready ───────────────────
router.patch('/rooms/:id/ready', async (req, res) => {
  const { characterId } = req.body;
  await execute(
    'UPDATE room_members SET is_ready=TRUE WHERE room_id=? AND character_id=?',
    [req.params.id, characterId]
  );
  res.json({ ok: true });
});

module.exports = router;