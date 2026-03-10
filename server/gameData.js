// server/gameData.js — authoritative game constants (server-side)

const JOB_BASE = {
  mage:    { maxHp: 80,  maxMp: 120, stats: { STR:6,  INT:15, AGI:9,  WIS:10, DEF:5  } },
  warrior: { maxHp: 140, maxMp: 40,  stats: { STR:15, INT:5,  AGI:8,  WIS:7,  DEF:15 } },
  rogue:   { maxHp: 100, maxMp: 60,  stats: { STR:10, INT:7,  AGI:16, WIS:6,  DEF:8  } },
  priest:  { maxHp: 90,  maxMp: 100, stats: { STR:6,  INT:10, AGI:8,  WIS:16, DEF:9  } },
};

const JOB_SKILLS = {
  mage: [
    {id:'basic_atk', name:'魔法箭', cost:0, baseDmg:[4,8], type:'magic'},
    {id:'fireball', name:'火球術', cost:15, baseDmg:[10,18], type:'magic'},
    {id:'frost', name:'冰凍術', cost:20, baseDmg:[8,14], type:'magic'},
    {id:'magic_shield', name:'魔法護盾', cost:25, baseDmg:[0,0], type:'heal'},
    {id:'arcane_burst', name:'魔力爆發', cost:30, baseDmg:[18,30], type:'magic'},
    {id:'chain', name:'連鎖閃電', cost:25, baseDmg:[15,25], type:'magic'},
    {id:'mana_drain', name:'魔力汲取', cost:10, baseDmg:[10,20], type:'magic'}, 
    {id:'blizzard', name:'暴風雪', cost:35, baseDmg:[25,40], type:'magic'},
    {id:'meteor', name:'隕石術', cost:40, baseDmg:[30,50], type:'magic'}
  ],
  warrior: [
    {id:'basic_atk', name:'普通攻擊', cost:0, baseDmg:[6,12], type:'physical'},
    {id:'heavy_blow', name:'重擊', cost:10, baseDmg:[12,20], type:'physical'},
    {id:'shield_bash', name:'護盾衝鋒', cost:15, baseDmg:[8,14], type:'physical'},
    {id:'warcry', name:'戰吼', cost:15, baseDmg:[0,0], type:'heal'},
    {id:'rage', name:'狂怒', cost:20, baseDmg:[16,28], type:'physical'},
    {id:'taunt', name:'嘲諷', cost:10, baseDmg:[10,15], type:'physical'},
    {id:'iron_skin', name:'鋼鐵之軀', cost:25, baseDmg:[0,0], type:'heal'},
    {id:'counter', name:'反擊刃', cost:25, baseDmg:[20,35], type:'physical'},
    {id:'earthquake', name:'裂地擊', cost:35, baseDmg:[30,45], type:'physical'}
  ],
  rogue: [
    {id:'basic_atk', name:'匕首刺', cost:0, baseDmg:[5,10], type:'physical'},
    {id:'backstab', name:'背刺', cost:12, baseDmg:[14,22], type:'physical', critBonus:0.3},
    {id:'poison_mist', name:'毒霧', cost:18, baseDmg:[8,15], type:'magic'},
    {id:'evade', name:'殘影步', cost:15, baseDmg:[0,0], type:'heal'},
    {id:'shadow_step', name:'暗影擊', cost:25, baseDmg:[20,32], type:'physical'},
    {id:'smoke', name:'煙霧彈', cost:20, baseDmg:[15,25], type:'physical'},
    {id:'lifesteal', name:'吸血刃', cost:25, baseDmg:[0,0], type:'heal'},
    {id:'trap', name:'陷阱術', cost:25, baseDmg:[18,35], type:'physical'},
    {id:'assassin', name:'瞬殺', cost:35, baseDmg:[40,60], type:'physical', critBonus:0.3}
  ],
  priest: [
    {id:'basic_atk', name:'神聖打擊', cost:0, baseDmg:[4,8], type:'holy'},
    {id:'holy_smite', name:'神聖爆擊', cost:15, baseDmg:[10,18], type:'holy'},
    {id:'heal', name:'治癒術', cost:20, baseDmg:[0,0], type:'heal'},
    {id:'bless', name:'聖光祝福', cost:20, baseDmg:[0,0], type:'heal'},
    {id:'divine_wrath', name:'神罰', cost:30, baseDmg:[16,26], type:'holy'},
    {id:'revive', name:'大治癒術', cost:40, baseDmg:[0,0], type:'heal'},
    {id:'purify', name:'淨化之光', cost:25, baseDmg:[15,25], type:'holy'},
    {id:'barrier', name:'神聖護盾', cost:30, baseDmg:[0,0], type:'heal'},
    {id:'smite', name:'神聖審判', cost:35, baseDmg:[25,45], type:'holy'}
  ]
};

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

const CRAFT_DATA = {
  bread:     { name:'烤麵包',    icon:'🍞', type:'consumable', req:'小麥 ×3', mats:{'小麥':3}, result:'回復 30 HP', category:'cook', rarity:'common', bonus:{} },
  hp_pot:    { name:'生命藥水',  icon:'🧪', type:'consumable', req:'藥草 ×3 · 史萊姆核心 ×1', mats:{'藥草':3, '史萊姆核心':1}, result:'回復 100 HP', category:'cook', rarity:'common', bonus:{} },
  mp_pot:    { name:'魔力藥水',  icon:'🧪', type:'consumable', req:'藥草 ×3 · 蝙蝠翅膀 ×1', mats:{'藥草':3, '蝙蝠翅膀':1}, result:'回復 50 MP', category:'cook', rarity:'rare', bonus:{} },
  fish_soup: { name:'鮮魚湯',    icon:'🥣', type:'consumable', req:'鯉魚 ×1 · 藥草 ×1', mats:{'鯉魚':1, '藥草':1}, result:'回復 50 HP/MP', category:'cook', rarity:'rare', bonus:{} },
  sword:     { name:'鐵劍',      icon:'⚔️', type:'weapon', req:'鐵礦 ×5 · 普通木材 ×2', mats:{'鐵礦':5, '普通木材':2}, result:'STR +12', category:'weapon', rarity:'common', bonus:{STR:12} },
  bow:       { name:'獵人弓',    icon:'🏹', type:'weapon', req:'普通木材 ×8 · 狼牙 ×3', mats:{'普通木材':8, '狼牙':3}, result:'STR +10 · AGI +5', category:'weapon', rarity:'common', bonus:{STR:10, AGI:5} },
  staff:     { name:'魔法法杖',  icon:'🪄', type:'weapon', req:'魔晶礦石 ×4 · 普通木材 ×3', mats:{'魔晶礦石':4, '普通木材':3}, result:'INT +15 · maxMp +20', category:'weapon', rarity:'rare', bonus:{INT:15, maxMp:20} },
  dagger:    { name:'暗影短刃',  icon:'🗡️', type:'weapon', req:'鐵礦 ×3 · 蝙蝠翅膀 ×4', mats:{'鐵礦':3, '蝙蝠翅膀':4}, result:'AGI +12', category:'weapon', rarity:'rare', bonus:{AGI:12} },
  shield:    { name:'鋼鐵盾牌',  icon:'🛡️', type:'armor',  req:'鐵礦 ×8 · 普通木材 ×2', mats:{'鐵礦':8, '普通木材':2}, result:'DEF +18', category:'armor', rarity:'common', bonus:{DEF:18} },
  armor:     { name:'皮製護甲',  icon:'🧥', type:'armor',  req:'狼牙 ×5 · 藥草 ×3', mats:{'狼牙':5, '藥草':3}, result:'DEF +10 · maxHp +30', category:'armor', rarity:'common', bonus:{DEF:10, maxHp:30} },
  cloth_cap: { name:'精製布帽',  icon:'🪖', type:'head',   req:'蜘蛛絲 ×5 · 藥草 ×2', mats:{'蜘蛛絲':5, '藥草':2}, result:'DEF +5 · AGI +2', category:'armor', rarity:'common', bonus:{DEF:5, AGI:2} },
  boots:     { name:'輕巧皮靴',  icon:'👞', type:'foot',   req:'枯骨 ×6 · 普通木材 ×1', mats:{'枯骨':6, '普通木材':1}, result:'AGI +5 · DEF +2', category:'armor', rarity:'common', bonus:{AGI:5, DEF:2} },
};

const TOOL_DATA = {
  tool_pickaxe: { name: '鐵製鶴嘴鋤', icon: '⛏️', baseReq: {'鐵礦': 2, '普通木材': 1}, desc: '提升採礦速度與產量' },
  tool_axe:     { name: '強化斧頭',   icon: '🪓', baseReq: {'鐵礦': 1, '普通木材': 2}, desc: '提升伐木速度與產量' },
  tool_rod:     { name: '精良釣魚竿', icon: '🎣', baseReq: {'普通木材': 2, '蜘蛛絲': 1}, desc: '提升釣魚速度與產量' },
  tool_hoe:     { name: '金屬鋤頭',   icon: '🌾', baseReq: {'鐵礦': 1, '普通木材': 1}, desc: '提升耕田速度與產量' },
  tool_cook:    { name: '煮食工具',   icon: '🍳', baseReq: {'鐵礦': 2, '枯骨': 1}, desc: '提升料理製作時的屬性加成' },
  tool_enhance: { name: '強化工具',   icon: '⚒️', baseReq: {'魔晶礦石': 1, '鐵礦': 2}, desc: '解鎖高級裝備，提升裝備強化上限(最高Lv100)' }
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

module.exports = { JOB_BASE, JOB_SKILLS, ENEMIES, LOOT_TABLE, CRAFT_DATA, TOOL_DATA, calcDamage, calcHeal };
