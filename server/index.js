// server/index.js — Main entry point
require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const path       = require('path');

const { router: authRouter }  = require('./routes/auth');
const charRouter               = require('./routes/characters');
const dungeonRouter            = require('./routes/dungeons');
const initSockets              = require('./socketHandler');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST','PATCH','DELETE'] },
  transports: ['websocket', 'polling'],
});

const PORT = parseInt(process.env.PORT) || 3000;

// ── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// ── REST API ──────────────────────────────────────────────
app.use('/api/auth',       authRouter);
app.use('/api/characters', charRouter);
app.use('/api/dungeons',   dungeonRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date() }));

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/index.html'));
  }
});

// ── Socket.io ─────────────────────────────────────────────
initSockets(io);

// ── Start ─────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   ABYSS CHRONICLE Server            ║
  ║   http://localhost:${PORT}              ║
  ╚══════════════════════════════════════╝
  `);
});
