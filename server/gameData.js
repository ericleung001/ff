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

const ENEMIES = {
  goblin:        { id:'goblin',        name:'深淵小鬼',   icon:'👺', level:1, hp:40,  atk:[6,12],  def:3,  xp:25,  gold:15, loot:'small_rune' },
  skeleton:      { id:'skeleton',      name:'骷髏戰士',   icon:'💀', level:2, hp:60,  atk:[10,18], def:5,  xp:40,  gold:22, loot:'bone_shard' },
  dark_wolf:     { id:'dark_wolf',     name:'黑暗狼',     icon:'🐺', level:2, hp:55,  atk:[12,20], def:4,  xp:42,  gold:20, loot:'wolf_fang' },
  shadow_hunter: { id:'shadow_hunter', name:'暗影獵人',   icon:'🌑', level:3, hp:80,  atk:[14,24], def:6,  xp:65,  gold:35, loot:'shadow_blade' },
  abyss_demon:   { id:'abyss_demon',   name:'深淵惡魔',   icon:'👹', level:3, hp:100, atk:[16,28], def:8,  xp:80,  gold:50, loot:'demon_core' },
  chaos_giant:   { id:'chaos_giant',   name:'混沌巨人',   icon:'🧌', level:4, hp:160, atk:[20,35], def:12, xp:120, gold:80, loot:'chaos_slab' },
  gate_guardian: { id:'gate_guardian', name:'深淵守門者', icon:'🔱', level:5, hp:260, atk:[25,45], def:15, xp:250, gold:180,loot:'guardian_key', isBoss:true },
  void_knight:   { id:'void_knight',   name:'虛空騎士',   icon:'⚫', level:6, hp:200, atk:[28,48], def:18, xp:200, gold:120,loot:'void_armor' },
  abyss_lord:    { id:'abyss_lord',    name:'深淵領主',   icon:'🔴', level:10,hp:500, atk:[40,70], def:25, xp:600, gold:400,loot:'abyss_crown', isBoss:true },
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

// How damage is calculated (server-authoritative)
function calcDamage(attacker, skill, defenderDef = 0) {
  // 🔥【BUG 修復 2】增加防呆陣列 || [5, 10]，避免找不到 baseDmg 時報錯崩潰
  const [min, max] = skill.baseDmg || [5, 10];
  
  // 修正回復技能的返回值格式，避免後方取 dmgInfo.dmg 時變成 undefined
  if (min === 0 && max === 0) return { dmg: 0, isCrit: false }; 

  let base = Math.floor(Math.random() * (max - min + 1)) + min;
  // stat scaling
  const statKey = skill.type === 'magic' || skill.type === 'holy' ? 'INT' : 'STR';
  base += Math.floor((attacker.stats[statKey] || 10) * 0.5);
  // defense reduction
  const reduced = Math.max(1, base - Math.floor(defenderDef * 0.35));
  // crit
  const critChance = 0.1 + (attacker.stats.AGI || 8) * 0.005 + (skill.critBonus || 0);
  const isCrit = Math.random() < critChance;
  return { dmg: isCrit ? Math.floor(reduced * 1.8) : reduced, isCrit };
}

function calcHeal(healer) {
  const base = 20 + Math.floor((healer.stats.WIS || 10) * 1.2);
  return Math.floor(base * (0.9 + Math.random() * 0.2));
}

module.exports = { JOB_BASE, JOB_SKILLS, ENEMIES, LOOT_TABLE, calcDamage, calcHeal };
