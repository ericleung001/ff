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
const { pool }                 = require('./db');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST','PATCH','DELETE'] },
  transports: ['websocket', 'polling'],
});

const PORT = parseInt(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

app.use('/api/auth',       authRouter);
app.use('/api/characters', charRouter);
app.use('/api/dungeons',   dungeonRouter);

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date() }));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/index.html'));
  }
});

// ✅ 自動修正資料庫欄位 (目標怪物 + 擴充裝備位置)
pool.query("ALTER TABLE dungeon_rooms ADD COLUMN target_monster VARCHAR(50) DEFAULT 'goblin'").catch(() => {});
pool.query("ALTER TABLE char_equipment MODIFY COLUMN slot ENUM('head','headgear','neck','weapon','armor','hand','foot','accessory_l','accessory_r','accessory') NOT NULL").catch(() => {});
pool.query("ALTER TABLE inventory MODIFY COLUMN item_type ENUM('weapon','armor','accessory','consumable','material','head','hand','foot','accessory_l','accessory_r','headgear','neck') NOT NULL").catch(() => {});

initSockets(io);

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   ABYSS CHRONICLE Server            ║
  ║   http://localhost:${PORT}              ║
  ╚══════════════════════════════════════╝
  `);
});
