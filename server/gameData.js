// server/gameData.js — authoritative game constants (server-side)

const JOB_BASE = {
  mage:    { maxHp: 80,  maxMp: 120, stats: { STR:6,  INT:15, AGI:9,  WIS:10, DEF:5  } },
  warrior: { maxHp: 140, maxMp: 40,  stats: { STR:15, INT:5,  AGI:8,  WIS:7,  DEF:15 } },
  rogue:   { maxHp: 100, maxMp: 60,  stats: { STR:10, INT:7,  AGI:16, WIS:6,  DEF:8  } },
  priest:  { maxHp: 90,  maxMp: 100, stats: { STR:6,  INT:10, AGI:8,  WIS:16, DEF:9  } },
};

const JOB_SKILLS = {
  mage:    [
    { id:'basic_atk',  name:'魔法箭',   cost:0,  baseDmg:[4,8],   type:'magic',  heal:0 },
    { id:'fireball',   name:'火球術',   cost:15, baseDmg:[10,18], type:'magic',  heal:0 },
    { id:'frost',      name:'冰凍術',   cost:20, baseDmg:[8,14],  type:'magic',  heal:0, effect:'stun' },
    { id:'arcane_burst',name:'魔力爆發',cost:30, baseDmg:[18,30], type:'magic',  heal:0 },
  ],
  warrior: [
    { id:'basic_atk',  name:'普通攻擊', cost:0,  baseDmg:[6,12],  type:'physical', heal:0 },
    { id:'heavy_blow', name:'重擊',     cost:10, baseDmg:[12,20], type:'physical', heal:0 },
    { id:'shield_bash',name:'護盾衝鋒', cost:15, baseDmg:[8,14],  type:'physical', heal:0, effect:'stun' },
    { id:'rage',       name:'狂怒',     cost:20, baseDmg:[16,28], type:'physical', heal:0 },
  ],
  rogue:   [
    { id:'basic_atk',  name:'匕首刺',   cost:0,  baseDmg:[5,10],  type:'physical', heal:0 },
    { id:'backstab',   name:'背刺',     cost:12, baseDmg:[14,22], type:'physical', heal:0, critBonus:0.3 },
    { id:'poison_mist',name:'毒霧',     cost:18, baseDmg:[5,8],   type:'magic',    heal:0, effect:'poison', poisonDmg:8 },
    { id:'shadow_step',name:'暗影步',   cost:25, baseDmg:[20,32], type:'physical', heal:0 },
  ],
  priest:  [
    { id:'basic_atk',  name:'神聖打擊', cost:0,  baseDmg:[4,8],   type:'holy',   heal:0 },
    { id:'holy_smite', name:'神聖爆擊', cost:15, baseDmg:[10,18], type:'holy',   heal:0 },
    { id:'heal',       name:'治癒術',   cost:20, baseDmg:[0,0],   type:'heal',   heal:30 },
    { id:'divine_wrath',name:'神罰',    cost:30, baseDmg:[16,26], type:'holy',   heal:0 },
  ],
};

// ✅ 同步與前端一模一樣的所有怪物數值
const ENEMIES = {
  slime:        { id:'slime',        name:'史萊姆',   icon:'🟢', level:1, hp:30,   atk:[3,6],    def:0,  xp:10,   gold:5,   loot:'史萊姆核心' },
  goblin:       { id:'goblin',       name:'哥布林',   icon:'👺', level:2, hp:45,   atk:[5,9],    def:1,  xp:18,   gold:8,   loot:'哥布林耳環' },
  bat:          { id:'bat',          name:'吸血蝙蝠', icon:'🦇', level:3, hp:38,   atk:[6,10],   def:1,  xp:22,   gold:10,  loot:'蝙蝠翅膀' },
  wolf:         { id:'wolf',         name:'野狼',     icon:'🐺', level:4, hp:60,   atk:[8,14],   def:2,  xp:30,   gold:15,  loot:'狼牙' },
  treant:       { id:'treant',       name:'樹人',     icon:'🌳', level:5, hp:120,  atk:[12,18],  def:5,  xp:80,   gold:40,  loot:'古樹之心', isBoss:true },
  
  bat_l:        { id:'bat_l',        name:'巨型蝙蝠', icon:'🦇', level:5, hp:80,   atk:[12,18],  def:3,  xp:45,   gold:22,  loot:'洞窟結晶' },
  spider:       { id:'spider',       name:'毒蜘蛛',   icon:'🕷️', level:6, hp:70,   atk:[14,20],  def:2,  xp:50,   gold:25,  loot:'蜘蛛絲' },
  skeleton:     { id:'skeleton',     name:'骷髏兵',   icon:'💀', level:7, hp:95,   atk:[16,24],  def:4,  xp:60,   gold:30,  loot:'枯骨' },
  golem:        { id:'golem',        name:'石像鬼',   icon:'🗿', level:8, hp:150,  atk:[18,26],  def:8,  xp:85,   gold:45,  loot:'石魔之核' },
  cave_boss:    { id:'cave_boss',    name:'洞窟龍',   icon:'🐉', level:9, hp:320,  atk:[28,42],  def:12, xp:250,  gold:120, loot:'龍鱗', isBoss:true },

  dark_knight:  { id:'dark_knight',  name:'黑暗騎士', icon:'🗡️', level:12, hp:200,  atk:[35,52],  def:15, xp:160,  gold:90,  loot:'黑鐵碎片' },
  witch:        { id:'witch',        name:'邪惡女巫', icon:'🧙', level:14, hp:170,  atk:[42,60],  def:10, xp:185,  gold:100, loot:'魔女之眼' },
  demon:        { id:'demon',        name:'惡魔使者', icon:'😈', level:16, hp:260,  atk:[48,70],  def:18, xp:220,  gold:130, loot:'惡魔之骨' },
  skeleton_k:   { id:'skeleton_k',   name:'骷髏騎士', icon:'💀', level:21, hp:460,  atk:[75,108], def:28, xp:430,  gold:240, loot:'死靈護甲' },
  fire_dragon:  { id:'fire_dragon',  name:'炎龍幼體', icon:'🐲', level:22, hp:620,  atk:[88,120], def:35, xp:550,  gold:300, loot:'龍鱗碎片' },
  lich:         { id:'lich',         name:'巫妖術士', icon:'🧟‍♂️', level:23, hp:580,  atk:[95,135], def:25, xp:620,  gold:350, loot:'巫妖魔典' },
  demon_lord_l: { id:'demon_lord_l', name:'魔王近衛', icon:'👿', level:24, hp:800,  atk:[105,150],def:40, xp:800,  gold:500, loot:'魔王符文' },
  demon_lord:   { id:'demon_lord',   name:'魔王索瑪', icon:'👹', level:25, hp:2000, atk:[130,180],def:55, xp:2500, gold:2000,loot:'封印之冠', isBoss:true },
};

const LOOT_TABLE = {
  small_rune:   { name:'小型符文石',   type:'material', rarity:'common' },
  bone_shard:   { name:'骨質碎片',     type:'material', rarity:'common' },
  wolf_fang:    { name:'黑狼獠牙',     type:'material', rarity:'common' },
  shadow_blade: { name:'暗影匕首',     type:'weapon',   rarity:'rare',   bonus:{STR:4,AGI:3} },
  demon_core:   { name:'惡魔之核',     type:'material', rarity:'rare' },
  chaos_slab:   { name:'混沌石板',     type:'material', rarity:'rare' },
  guardian_key: { name:'守門者之鑰',   type:'accessory',rarity:'epic',  bonus:{DEF:8,maxHp:30} },
  void_armor:   { name:'虛空護甲',     type:'armor',    rarity:'epic',  bonus:{DEF:12,maxHp:50} },
  abyss_crown:  { name:'深淵王冠',     type:'accessory',rarity:'legend',bonus:{INT:10,WIS:10,maxMp:40} },
};

function calcDamage(attacker, skill, defenderDef = 0) {
  const [min, max] = skill.baseDmg || [5, 10];
  if (min === 0 && max === 0) return { dmg: 0, isCrit: false }; 

  let base = Math.floor(Math.random() * (max - min + 1)) + min;
  const statKey = skill.type === 'magic' || skill.type === 'holy' ? 'INT' : 'STR';
  base += Math.floor((attacker.stats[statKey] || 10) * 0.5);
  const reduced = Math.max(1, base - Math.floor(defenderDef * 0.35));
  const critChance = 0.1 + (attacker.stats.AGI || 8) * 0.005 + (skill.critBonus || 0);
  const isCrit = Math.random() < critChance;
  return { dmg: isCrit ? Math.floor(reduced * 1.8) : reduced, isCrit };
}

function calcHeal(healer) {
  const base = 20 + Math.floor((healer.stats.WIS || 10) * 1.2);
  return Math.floor(base * (0.9 + Math.random() * 0.2));
}

module.exports = { JOB_BASE, JOB_SKILLS, ENEMIES, LOOT_TABLE, calcDamage, calcHeal };
