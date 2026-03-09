// ════════════════════════════════════════════
//  GAME DATA  (client-side mirror)
// ════════════════════════════════════════════
const JOB_ICONS = {mage:'🧙', warrior:'⚔️', rogue:'🗡️', priest:'✨'};
const JOB_NAMES = {mage:'法師', warrior:'勇者', rogue:'盜賊', priest:'聖職者'};

// 統一的技能資料庫 (每個職業 9 個技能，樹狀解鎖)
const JOB_SKILLS_DB = {
  mage: [
    {id:'basic_atk', name:'魔法箭', icon:'🪄', cost:0, dmg:'4-8+INT', spCost:1, req:null, desc:'基礎魔法攻擊'},
    {id:'fireball', name:'火球術', icon:'🔥', cost:15, dmg:'10-18+INT', spCost:1, req:null, desc:'發射火球燃燒敵人'},
    {id:'frost', name:'冰凍術', icon:'❄️', cost:20, dmg:'8-14+INT', spCost:2, req:null, desc:'發射冰錐，降低敵人速度'},
    {id:'magic_shield', name:'魔法護盾', icon:'🛡️', cost:25, dmg:'回復+INT', spCost:2, req:'basic_atk', desc:'用魔力化為護盾，回復生命'},
    {id:'arcane_burst', name:'魔力爆發', icon:'✨', cost:30, dmg:'18-30+INT', spCost:3, req:'fireball', desc:'釋放強大奧術能量'},
    {id:'chain', name:'連鎖閃電', icon:'⚡', cost:25, dmg:'15-25+INT', spCost:3, req:'frost', desc:'強大的閃電攻擊'},
    {id:'mana_drain', name:'魔力汲取', icon:'🌀', cost:10, dmg:'10-20+INT', spCost:4, req:'magic_shield', desc:'攻擊並吸收周圍魔力'},
    {id:'blizzard', name:'暴風雪', icon:'🌨️', cost:35, dmg:'25-40+INT', spCost:4, req:'chain', desc:'召喚極寒暴風雪'},
    {id:'meteor', name:'隕石術', icon:'☄️', cost:40, dmg:'30-50+INT', spCost:5, req:'arcane_burst', desc:'召喚巨大隕石造成毀滅傷害'}
  ],
  warrior: [
    {id:'basic_atk', name:'普通攻擊', icon:'⚔️', cost:0, dmg:'6-12+STR', spCost:1, req:null, desc:'基礎物理攻擊'},
    {id:'heavy_blow', name:'重擊', icon:'⚡', cost:10, dmg:'12-20+STR', spCost:1, req:null, desc:'用力揮劈造成較高傷害'},
    {id:'shield_bash', name:'護盾衝鋒', icon:'🛡️', cost:15, dmg:'8-14+STR', spCost:2, req:null, desc:'用盾牌強力撞擊敵人'},
    {id:'warcry', name:'戰吼', icon:'🗣️', cost:15, dmg:'回復+STR', spCost:2, req:'basic_atk', desc:'振奮精神，回復些許生命'},
    {id:'rage', name:'狂怒', icon:'💢', cost:20, dmg:'16-28+STR', spCost:3, req:'heavy_blow', desc:'消耗MP進行猛烈攻擊'},
    {id:'taunt', name:'嘲諷', icon:'🗯️', cost:10, dmg:'10-15+STR', spCost:3, req:'shield_bash', desc:'激怒敵人並造成傷害'},
    {id:'iron_skin', name:'鋼鐵之軀', icon:'🦾', cost:25, dmg:'回復+STR', spCost:4, req:'warcry', desc:'硬化身軀，大幅回復生命'},
    {id:'counter', name:'反擊刃', icon:'🪃', cost:25, dmg:'20-35+STR', spCost:4, req:'taunt', desc:'看準時機給予強烈反擊'},
    {id:'earthquake', name:'裂地擊', icon:'💥', cost:35, dmg:'30-45+STR', spCost:5, req:'rage', desc:'重擊地面引發震盪傷害'}
  ],
  rogue: [
    {id:'basic_atk', name:'匕首刺', icon:'🗡️', cost:0, dmg:'5-10+AGI', spCost:1, req:null, desc:'快速的匕首攻擊'},
    {id:'backstab', name:'背刺', icon:'🩸', cost:12, dmg:'14-22+AGI', spCost:1, req:null, desc:'高暴擊率的致命一擊'},
    {id:'poison_mist', name:'毒霧', icon:'☠️', cost:18, dmg:'8-15+AGI', spCost:2, req:null, desc:'散佈毒氣傷害敵人'},
    {id:'evade', name:'殘影步', icon:'💨', cost:15, dmg:'回復+AGI', spCost:2, req:'basic_atk', desc:'高速移動閃避並回復體力'},
    {id:'shadow_step', name:'暗影擊', icon:'👤', cost:25, dmg:'20-32+AGI', spCost:3, req:'backstab', desc:'如同鬼魅般出現在敵人身後'},
    {id:'smoke', name:'煙霧彈', icon:'🌫️', cost:20, dmg:'15-25+AGI', spCost:3, req:'poison_mist', desc:'用煙霧干擾並打擊敵人'},
    {id:'lifesteal', name:'吸血刃', icon:'🦇', cost:25, dmg:'回復+AGI', spCost:4, req:'evade', desc:'汲取敵人的生命力補血'},
    {id:'trap', name:'陷阱術', icon:'⛓️', cost:25, dmg:'18-35+AGI', spCost:4, req:'smoke', desc:'利用陷阱造成大量傷害'},
    {id:'assassin', name:'瞬殺', icon:'☠️', cost:35, dmg:'40-60+AGI', spCost:5, req:'shadow_step', desc:'終極刺客暗殺技巧'}
  ],
  priest: [
    {id:'basic_atk', name:'神聖打擊', icon:'✝️', cost:0, dmg:'4-8+WIS', spCost:1, req:null, desc:'帶有神聖力量的攻擊'},
    {id:'holy_smite', name:'神聖爆擊', icon:'✨', cost:15, dmg:'10-18+WIS', spCost:1, req:null, desc:'用聖光灼燒敵人'},
    {id:'heal', name:'治癒術', icon:'💚', cost:20, dmg:'回復+WIS', spCost:2, req:null, desc:'回復少量生命值'},
    {id:'bless', name:'聖光祝福', icon:'🕊️', cost:20, dmg:'回復+WIS', spCost:2, req:'basic_atk', desc:'接受祝福，回復生命'},
    {id:'divine_wrath', name:'神罰', icon:'☀️', cost:30, dmg:'16-26+WIS', spCost:3, req:'holy_smite', desc:'降下神罰造成大量傷害'},
    {id:'revive', name:'大治癒術', icon:'💖', cost:40, dmg:'大量回復', spCost:3, req:'heal', desc:'大幅度回復生命值'},
    {id:'purify', name:'淨化之光', icon:'🌟', cost:25, dmg:'15-25+WIS', spCost:4, req:'bless', desc:'用純淨之光造成傷害'},
    {id:'barrier', name:'神聖護盾', icon:'🛡️', cost:30, dmg:'回復+WIS', spCost:4, req:'revive', desc:'提供護盾並回復生命'},
    {id:'smite', name:'神聖審判', icon:'⚖️', cost:35, dmg:'25-45+WIS', spCost:5, req:'divine_wrath', desc:'終極的神聖制裁'}
  ]
};

const GATHER_CONFIG = {
  farm:  { name:'耕田中…',  icon:'🌾', tickMs:3000, items:['小麥','藥草','南瓜','紅蘿蔔'], xpPer:8,  goldPer:5  },
  fish:  { name:'釣魚中…',  icon:'🎣', tickMs:4000, items:['鯉魚','鱒魚','稀有魚','大魚'], xpPer:10, goldPer:8  },
  wood:  { name:'伐木中…',  icon:'🪓', tickMs:2500, items:['普通木材','硬木','稀有木'],   xpPer:6,  goldPer:4  },
  mine:  { name:'採礦中…',  icon:'⛏️', tickMs:3500, items:['鐵礦','銅礦','魔晶礦石'],    xpPer:12, goldPer:10 },
};

const HOUSE_CONFIG = {
  pond:    { name:'魚場',   icon:'🐟', gatherBonus:{ fish:{ xp:30, gold:25, rare:25 } } },
  farm:    { name:'農場',   icon:'🏡', gatherBonus:{ farm:{ xp:30, gold:40, rare:20 } } },
  forge:   { name:'鍛造所', icon:'⚒️', gatherBonus:{ mine:{ xp:25, gold:30, rare:30 } } },
  sawmill: { name:'木材廠', icon:'🪵', gatherBonus:{ wood:{ xp:35, gold:50, rare:15 } } },
};

const CRAFT_DATA = {
  sword:     { name:'鐵劍',      icon:'⚔️', type:'weapon', req:'鐵礦 ×5 · 木材 ×2',      result:'ATK +12',           panel:'craft' },
  bow:       { name:'獵人弓',    icon:'🏹', type:'weapon', req:'木材 ×8 · 獸皮 ×3',      result:'ATK +10 · 射程遠',  panel:'craft' },
  staff:     { name:'魔法法杖',  icon:'🪄', type:'weapon', req:'魔晶礦石 ×4 · 木材 ×3',  result:'INT +15 · MP +20',  panel:'craft' },
  dagger:    { name:'暗影短刃',  icon:'🗡️', type:'weapon', req:'鐵礦 ×3 · 獸皮 ×4',      result:'AGI +8 · 會心 +5%', panel:'craft' },
  shield:    { name:'鋼鐵盾牌',  icon:'🛡️', type:'armor',  req:'鐵礦 ×8 · 木材 ×2',      result:'DEF +18',           panel:'craft' },
  armor:     { name:'皮製護甲',  icon:'🧥', type:'armor',  req:'獸皮 ×10 · 草藥 ×3',     result:'DEF +10 · HP +30',  panel:'craft' },
  pickaxe:   { name:'鐵製鶴嘴鋤',icon:'⛏️', type:'tool',   req:'鐵礦 ×6 · 木材 ×3',      result:'採礦效率 +30%',     panel:'tools' },
  axe:       { name:'強化斧頭',  icon:'🪓', type:'tool',   req:'鐵礦 ×4 · 木材 ×5',      result:'伐木效率 +40%',     panel:'tools' },
  rod:       { name:'精良釣魚竿',icon:'🎣', type:'tool',   req:'木材 ×6 · 鯉魚 ×3',      result:'釣魚效率 +35%',     panel:'tools' },
  hoe:       { name:'金屬鋤頭',  icon:'🌾', type:'tool',   req:'鐵礦 ×3 · 木材 ×4',      result:'耕田效率 +25%',     panel:'tools' },
  waterskin: { name:'藥水容器',  icon:'🏺', type:'tool',   req:'獸皮 ×5 · 草藥 ×2',      result:'攜帶 HP 藥水 ×3',   panel:'tools' },
  torch:     { name:'礦山火把',  icon:'🔥', type:'tool',   req:'木材 ×3 · 草藥 ×1',      result:'深層礦山解鎖',      panel:'tools' },
};
