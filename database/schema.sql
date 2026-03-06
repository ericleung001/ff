-- ═══════════════════════════════════════════════════════
--  ABYSS CHRONICLE — MariaDB Schema
--  Run: mysql -u root -p < database/schema.sql
-- ═══════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS abyss_chronicle
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE abyss_chronicle;

-- ── Users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(30)  NOT NULL UNIQUE,
  email       VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  last_login  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Characters ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS characters (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  name        VARCHAR(30)  NOT NULL,
  job         ENUM('mage','warrior','rogue','priest') NOT NULL,
  level       SMALLINT     DEFAULT 1,
  xp          INT UNSIGNED DEFAULT 0,
  xp_next     INT UNSIGNED DEFAULT 100,
  hp          SMALLINT     DEFAULT 100,
  max_hp      SMALLINT     DEFAULT 100,
  mp          SMALLINT     DEFAULT 60,
  max_mp      SMALLINT     DEFAULT 60,
  sp          SMALLINT     DEFAULT 3,        -- skill points
  gold        INT UNSIGNED DEFAULT 50,
  -- base stats
  stat_str    SMALLINT     DEFAULT 10,
  stat_int    SMALLINT     DEFAULT 10,
  stat_agi    SMALLINT     DEFAULT 10,
  stat_wis    SMALLINT     DEFAULT 10,
  stat_def    SMALLINT     DEFAULT 10,
  -- story progress
  story_index SMALLINT     DEFAULT 0,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Learned Skills (Skill Tree) ──────────────────────────
CREATE TABLE IF NOT EXISTS char_skills (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id INT UNSIGNED NOT NULL,
  skill_id     VARCHAR(30)  NOT NULL,   -- e.g. 'fire1', 'berserk'
  learned_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_char_skill (character_id, skill_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Equipment ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS char_equipment (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id INT UNSIGNED NOT NULL,
  slot         ENUM('weapon','armor','accessory') NOT NULL,
  item_id      VARCHAR(50)  NOT NULL,
  item_name    VARCHAR(60)  NOT NULL,
  rarity       ENUM('common','rare','epic','legend') DEFAULT 'common',
  stat_bonus   JSON,        -- e.g. {"STR":3,"DEF":2}
  equipped_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_slot (character_id, slot),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Inventory ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id INT UNSIGNED NOT NULL,
  item_id      VARCHAR(50)  NOT NULL,
  item_name    VARCHAR(60)  NOT NULL,
  item_type    ENUM('weapon','armor','accessory','consumable','material') NOT NULL,
  rarity       ENUM('common','rare','epic','legend') DEFAULT 'common',
  quantity     SMALLINT     DEFAULT 1,
  stat_bonus   JSON,
  obtained_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Dungeon Rooms (Party Lobbies) ────────────────────────
CREATE TABLE IF NOT EXISTS dungeon_rooms (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_code    VARCHAR(8)   NOT NULL UNIQUE,  -- e.g. 'AB12CD34'
  dungeon_id   SMALLINT     DEFAULT 1,
  status       ENUM('waiting','in_progress','completed','failed') DEFAULT 'waiting',
  max_players  TINYINT      DEFAULT 4,
  current_floor SMALLINT    DEFAULT 1,
  created_by   INT UNSIGNED NOT NULL,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  started_at   DATETIME,
  ended_at     DATETIME,
  FOREIGN KEY (created_by) REFERENCES characters(id)
) ENGINE=InnoDB;

-- ── Room Members ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_members (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id      INT UNSIGNED NOT NULL,
  character_id INT UNSIGNED NOT NULL,
  is_leader    BOOLEAN      DEFAULT FALSE,
  is_ready     BOOLEAN      DEFAULT FALSE,
  joined_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_member (room_id, character_id),
  FOREIGN KEY (room_id) REFERENCES dungeon_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id)
) ENGINE=InnoDB;

-- ── Combat Sessions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS combat_sessions (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id         INT UNSIGNED NOT NULL,
  floor           SMALLINT     DEFAULT 1,
  enemy_data      JSON         NOT NULL,   -- enemy snapshot
  party_state     JSON         NOT NULL,   -- all party members HP/MP snapshot
  turn_order      JSON,                    -- array of character_ids
  current_turn    INT UNSIGNED,            -- character_id whose turn it is
  turn_deadline   DATETIME,               -- auto-skip after timeout
  status          ENUM('active','victory','defeat') DEFAULT 'active',
  combat_log      JSON,                    -- array of log entries
  started_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  ended_at        DATETIME,
  FOREIGN KEY (room_id) REFERENCES dungeon_rooms(id)
) ENGINE=InnoDB;

-- ── Battle Log (persistent) ──────────────────────────────
CREATE TABLE IF NOT EXISTS battle_history (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id INT UNSIGNED NOT NULL,
  enemy_name   VARCHAR(60),
  result       ENUM('victory','defeat','fled') NOT NULL,
  xp_gained    SMALLINT     DEFAULT 0,
  gold_gained  SMALLINT     DEFAULT 0,
  floor        SMALLINT     DEFAULT 1,
  fought_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Indexes ──────────────────────────────────────────────
CREATE INDEX idx_char_user   ON characters(user_id);
CREATE INDEX idx_room_code   ON dungeon_rooms(room_code);
CREATE INDEX idx_room_status ON dungeon_rooms(status);
CREATE INDEX idx_member_room ON room_members(room_id);

-- ── Seed: Default Equipment for new characters ───────────
-- (Applied on character creation in app logic, not here)

-- ── Sample dungeon definitions ───────────────────────────
CREATE TABLE IF NOT EXISTS dungeons (
  id          SMALLINT     AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL,
  description TEXT,
  min_level   SMALLINT     DEFAULT 1,
  floors      SMALLINT     DEFAULT 5,
  enemy_pool  JSON,        -- array of enemy ids per floor
  boss_id     VARCHAR(30),
  unlocked    BOOLEAN      DEFAULT TRUE
) ENGINE=InnoDB;

INSERT INTO dungeons (name, description, min_level, floors, enemy_pool, boss_id) VALUES
('幽暗洞窟',    '最基礎的深淵副本，適合新手冒險者。', 1, 5,
  '{"1":["goblin","skeleton"],"2":["dark_wolf","skeleton"],"3":["shadow_hunter"],"4":["abyss_demon"],"5":["chaos_giant"]}',
  'gate_guardian'),
('魔王前廊',   '通往深淵核心的走廊，危機四伏。', 5, 8,
  '{"1":["abyss_demon","shadow_hunter"],"2":["chaos_giant"],"3":["void_knight"],"4":["bone_dragon"],"5":["dark_mage"],"6":["void_knight","abyss_demon"],"7":["bone_dragon"],"8":["abyss_lord"]}',
  'abyss_lord'),
('深淵核心',   '黑暗之神的最終所在。生還者寥寥無幾。', 10, 12,
  '{}',
  'dark_god');
