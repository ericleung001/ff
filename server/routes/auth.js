// server/routes/auth.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { query, queryOne, execute } = require('../db');

const router = express.Router();
const JWT_SECRET  = process.env.JWT_SECRET  || 'dev_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// ── Middleware: verify JWT ────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登入' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token 無效或已過期' });
  }
}

// ── POST /api/auth/register ───────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: '請填寫所有欄位' });
    if (username.length < 2 || username.length > 30)
      return res.status(400).json({ error: '用戶名需2-30字' });
    if (password.length < 6)
      return res.status(400).json({ error: '密碼至少6位' });

    const existing = await queryOne(
      'SELECT id FROM users WHERE username=? OR email=?', [username, email]
    );
    if (existing) return res.status(409).json({ error: '用戶名或郵箱已存在' });

    const hash = await bcrypt.hash(password, 12);
    const result = await execute(
      'INSERT INTO users (username, email, password) VALUES (?,?,?)',
      [username, email, hash]
    );

    const token = jwt.sign(
      { userId: result.insertId, username },
      JWT_SECRET, { expiresIn: JWT_EXPIRES }
    );
    res.status(201).json({ token, userId: result.insertId, username });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await queryOne(
      'SELECT * FROM users WHERE username=?', [username]
    );
    if (!user) return res.status(401).json({ error: '用戶名或密碼錯誤' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)  return res.status(401).json({ error: '用戶名或密碼錯誤' });

    await execute('UPDATE users SET last_login=NOW() WHERE id=?', [user.id]);

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET, { expiresIn: JWT_EXPIRES }
    );
    res.json({ token, userId: user.id, username: user.username });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  const user = await queryOne(
    'SELECT id, username, email, created_at, last_login FROM users WHERE id=?',
    [req.user.userId]
  );
  res.json(user || {});
});

module.exports = { router, authMiddleware };
