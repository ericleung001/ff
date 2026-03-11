// ════════════════════════════════════════════
//  GAME DATA  (client-side mirror)
// ════════════════════════════════════════════
const JOB_ICONS = {mage:'🧙', warrior:'⚔️', rogue:'🗡️', priest:'✨'};
const JOB_NAMES = {mage:'法師', warrior:'勇者', rogue:'盜賊', priest:'聖職者'};

const SLOT_NAMES = {
  head: '頭部', headgear: '頭飾', neck: '頸部',
  weapon: '武器', armor: '身體', hand: '手部',
  foot: '腳部', accessory_l: '左手飾物', accessory_r: '右手飾物'
};

const SLOT_ICONS = {
  head: '🪖', headgear: '👑', neck: '📿',
  weapon: '⚔️', armor: '🛡️', hand: '🧤',
  foot: '👞', accessory_l: '💍', accessory_r: '💍'
};

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

// ════════════════════════════════════════════
//  ✨ 新版採集系統 - 每種類型獨立等級，每 Tier 5 樣物品
// ════════════════════════════════════════════
const GATHER_CONFIG = {
  farm: {
    name: '耕田',
    icon: '🌾',
    tickMs: 3000,
    baseXpPer: 8,
    baseGoldPer: 5,
    tiers: [
      { // Tier 1 (Lv.1-9) - 入門
        items: [
          { name: '小麥',      rarity: 'common', weight: 30 },
          { name: '藥草',      rarity: 'common', weight: 25 },
          { name: '野花',      rarity: 'common', weight: 20 },
          { name: '樹薯',      rarity: 'common', weight: 15 },
          { name: '野菜',      rarity: 'common', weight: 10 }
        ],
        xpBonus: 0, goldBonus: 0
      },
      { // Tier 2 (Lv.10-19) - 初級
        items: [
          { name: '南瓜',      rarity: 'common', weight: 25 },
          { name: '紅蘿蔔',    rarity: 'common', weight: 25 },
          { name: '馬鈴薯',    rarity: 'common', weight: 20 },
          { name: '洋蔥',      rarity: 'common', weight: 15 },
          { name: '稀有藥草',  rarity: 'rare',   weight: 15 }
        ],
        xpBonus: 20, goldBonus: 15
      },
      { // Tier 3 (Lv.20-29) - 中級
        items: [
          { name: '稻米',      rarity: 'common', weight: 20 },
          { name: '棉花',      rarity: 'common', weight: 20 },
          { name: '茶葉',      rarity: 'rare',   weight: 20 },
          { name: '高級藥草',  rarity: 'rare',   weight: 20 },
          { name: '薄荷葉',    rarity: 'rare',   weight: 20 }
        ],
        xpBonus: 40, goldBonus: 30
      },
      { // Tier 4 (Lv.30-39) - 高級
        items: [
          { name: '葡萄',      rarity: 'rare',   weight: 20 },
          { name: '靈芝',      rarity: 'rare',   weight: 20 },
          { name: '人蔘',      rarity: 'rare',   weight: 20 },
          { name: '千年靈藥',  rarity: 'epic',   weight: 20 },
          { name: '月光草',    rarity: 'epic',   weight: 20 }
        ],
        xpBonus: 60, goldBonus: 50
      },
      { // Tier 5 (Lv.40-49) - 稀有
        items: [
          { name: '仙果',      rarity: 'epic',   weight: 20 },
          { name: '龍鬚草',    rarity: 'epic',   weight: 20 },
          { name: '鳳凰花',    rarity: 'epic',   weight: 20 },
          { name: '傳說種子',  rarity: 'legend', weight: 20 },
          { name: '天使之淚',  rarity: 'legend', weight: 20 }
        ],
        xpBonus: 100, goldBonus: 80
      },
      { // Tier 6 (Lv.50+) - 傳說
        items: [
          { name: '神之麥穗',  rarity: 'legend', weight: 20 },
          { name: '生命之源',  rarity: 'legend', weight: 20 },
          { name: '永恆之花',  rarity: 'legend', weight: 20 },
          { name: '世界樹嫩芽',rarity: 'legend', weight: 20 },
          { name: '創世果實',  rarity: 'legend', weight: 20 }
        ],
        xpBonus: 150, goldBonus: 120
      }
    ]
  },
  fish: {
    name: '釣魚',
    icon: '🎣',
    tickMs: 4000,
    baseXpPer: 10,
    baseGoldPer: 8,
    tiers: [
      { // Tier 1 (Lv.1-9) - 入門
        items: [
          { name: '鯉魚',      rarity: 'common', weight: 30 },
          { name: '沙丁魚',    rarity: 'common', weight: 25 },
          { name: '小蝦',      rarity: 'common', weight: 20 },
          { name: '貝殼',      rarity: 'common', weight: 15 },
          { name: '海藻',      rarity: 'common', weight: 10 }
        ],
        xpBonus: 0, goldBonus: 0
      },
      { // Tier 2 (Lv.10-19) - 初級
        items: [
          { name: '鱒魚',      rarity: 'common', weight: 25 },
          { name: '鱸魚',      rarity: 'common', weight: 25 },
          { name: '墨魚',      rarity: 'common', weight: 20 },
          { name: '珍珠貝',    rarity: 'rare',   weight: 15 },
          { name: '河蟹',      rarity: 'rare',   weight: 15 }
        ],
        xpBonus: 20, goldBonus: 15
      },
      { // Tier 3 (Lv.20-29) - 中級
        items: [
          { name: '金槍魚',    rarity: 'rare',   weight: 20 },
          { name: '鮭魚',      rarity: 'rare',   weight: 20 },
          { name: '章魚',      rarity: 'rare',   weight: 20 },
          { name: '珊瑚',      rarity: 'rare',   weight: 20 },
          { name: '海馬',      rarity: 'rare',   weight: 20 }
        ],
        xpBonus: 40, goldBonus: 30
      },
      { // Tier 4 (Lv.30-39) - 高級
        items: [
          { name: '劍魚',      rarity: 'rare',   weight: 20 },
          { name: '龍蝦',      rarity: 'rare',   weight: 20 },
          { name: '深海珍珠',  rarity: 'epic',   weight: 20 },
          { name: '人魚鱗片',  rarity: 'epic',   weight: 20 },
          { name: '藍鰭金槍',  rarity: 'epic',   weight: 20 }
        ],
        xpBonus: 60, goldBonus: 50
      },
      { // Tier 5 (Lv.40-49) - 稀有
        items: [
          { name: '深海巨魷',  rarity: 'epic',   weight: 20 },
          { name: '水晶魚',    rarity: 'epic',   weight: 20 },
          { name: '海龍鱗',    rarity: 'epic',   weight: 20 },
          { name: '遠古巨鯨化石',rarity:'legend',weight: 20 },
          { name: '塞壬之歌',  rarity: 'legend', weight: 20 }
        ],
        xpBonus: 100, goldBonus: 80
      },
      { // Tier 6 (Lv.50+) - 傳說
        items: [
          { name: '海神之淚',  rarity: 'legend', weight: 20 },
          { name: '傳說巨鯨',  rarity: 'legend', weight: 20 },
          { name: '深淵之眼',  rarity: 'legend', weight: 20 },
          { name: '不朽珍珠',  rarity: 'legend', weight: 20 },
          { name: '利維坦之鱗',rarity: 'legend', weight: 20 }
        ],
        xpBonus: 150, goldBonus: 120
      }
    ]
  },
  wood: {
    name: '伐木',
    icon: '🪓',
    tickMs: 2500,
    baseXpPer: 6,
    baseGoldPer: 4,
    tiers: [
      { // Tier 1 (Lv.1-9) - 入門
        items: [
          { name: '普通木材',  rarity: 'common', weight: 30 },
          { name: '樹枝',      rarity: 'common', weight: 25 },
          { name: '樹脂',      rarity: 'common', weight: 20 },
          { name: '枯木',      rarity: 'common', weight: 15 },
          { name: '樹皮',      rarity: 'common', weight: 10 }
        ],
        xpBonus: 0, goldBonus: 0
      },
      { // Tier 2 (Lv.10-19) - 初級
        items: [
          { name: '硬木',      rarity: 'common', weight: 25 },
          { name: '橡木',      rarity: 'common', weight: 25 },
          { name: '楓木',      rarity: 'rare',   weight: 20 },
          { name: '琥珀',      rarity: 'rare',   weight: 15 },
          { name: '松木',      rarity: 'common', weight: 15 }
        ],
        xpBonus: 20, goldBonus: 15
      },
      { // Tier 3 (Lv.20-29) - 中級
        items: [
          { name: '紫檀木',    rarity: 'rare',   weight: 20 },
          { name: '胡桃木',    rarity: 'rare',   weight: 20 },
          { name: '神木碎片',  rarity: 'rare',   weight: 20 },
          { name: '精靈樹液',  rarity: 'rare',   weight: 20 },
          { name: '白蠟木',    rarity: 'rare',   weight: 20 }
        ],
        xpBonus: 40, goldBonus: 30
      },
      { // Tier 4 (Lv.30-39) - 高級
        items: [
          { name: '黑檀木',    rarity: 'rare',   weight: 20 },
          { name: '鐵木',      rarity: 'rare',   weight: 20 },
          { name: '古樹之心',  rarity: 'epic',   weight: 20 },
          { name: '世界樹碎片',rarity: 'epic',   weight: 20 },
          { name: '血檀木',    rarity: 'epic',   weight: 20 }
        ],
        xpBonus: 60, goldBonus: 50
      },
      { // Tier 5 (Lv.40-49) - 稀有
        items: [
          { name: '龍血木',    rarity: 'epic',   weight: 20 },
          { name: '星辰木',    rarity: 'epic',   weight: 20 },
          { name: '生命之木',  rarity: 'epic',   weight: 20 },
          { name: '世界樹之枝',rarity: 'legend', weight: 20 },
          { name: '鳳凰木',    rarity: 'legend', weight: 20 }
        ],
        xpBonus: 100, goldBonus: 80
      },
      { // Tier 6 (Lv.50+) - 傳說
        items: [
          { name: '永恆神木',  rarity: 'legend', weight: 20 },
          { name: '創世之木',  rarity: 'legend', weight: 20 },
          { name: '虛空之根',  rarity: 'legend', weight: 20 },
          { name: '世界樹核心',rarity: 'legend', weight: 20 },
          { name: '尤格德拉希爾之葉',rarity:'legend',weight: 20 }
        ],
        xpBonus: 150, goldBonus: 120
      }
    ]
  },
  mine: {
    name: '採礦',
    icon: '⛏️',
    tickMs: 3500,
    baseXpPer: 12,
    baseGoldPer: 10,
    tiers: [
      { // Tier 1 (Lv.1-9) - 入門
        items: [
          { name: '石頭',      rarity: 'common', weight: 30 },
          { name: '銅礦',      rarity: 'common', weight: 25 },
          { name: '煤礦',      rarity: 'common', weight: 20 },
          { name: '砂礫',      rarity: 'common', weight: 15 },
          { name: '黏土',      rarity: 'common', weight: 10 }
        ],
        xpBonus: 0, goldBonus: 0
      },
      { // Tier 2 (Lv.10-19) - 初級
        items: [
          { name: '鐵礦',      rarity: 'common', weight: 25 },
          { name: '錫礦',      rarity: 'common', weight: 25 },
          { name: '銀礦碎片',  rarity: 'rare',   weight: 20 },
          { name: '水晶',      rarity: 'rare',   weight: 15 },
          { name: '鋅礦',      rarity: 'common', weight: 15 }
        ],
        xpBonus: 20, goldBonus: 15
      },
      { // Tier 3 (Lv.20-29) - 中級
        items: [
          { name: '銀礦',      rarity: 'rare',   weight: 20 },
          { name: '秘銀礦',    rarity: 'rare',   weight: 20 },
          { name: '寶石原石',  rarity: 'rare',   weight: 20 },
          { name: '魔晶碎片',  rarity: 'rare',   weight: 20 },
          { name: '鈷礦',      rarity: 'rare',   weight: 20 }
        ],
        xpBonus: 40, goldBonus: 30
      },
      { // Tier 4 (Lv.30-39) - 高級
        items: [
          { name: '金礦',      rarity: 'rare',   weight: 20 },
          { name: '鉑金礦',    rarity: 'rare',   weight: 20 },
          { name: '魔晶礦石',  rarity: 'epic',   weight: 20 },
          { name: '龍晶碎片',  rarity: 'epic',   weight: 20 },
          { name: '鈦礦',      rarity: 'epic',   weight: 20 }
        ],
        xpBonus: 60, goldBonus: 50
      },
      { // Tier 5 (Lv.40-49) - 稀有
        items: [
          { name: '奧利哈鋼',  rarity: 'epic',   weight: 20 },
          { name: '隕石礦',    rarity: 'epic',   weight: 20 },
          { name: '深淵魔晶',  rarity: 'epic',   weight: 20 },
          { name: '賢者之石碎片',rarity:'legend',weight: 20 },
          { name: '精金礦',    rarity: 'legend', weight: 20 }
        ],
        xpBonus: 100, goldBonus: 80
      },
      { // Tier 6 (Lv.50+) - 傳說
        items: [
          { name: '永恆秘銀',  rarity: 'legend', weight: 20 },
          { name: '創世礦石',  rarity: 'legend', weight: 20 },
          { name: '虛空晶石',  rarity: 'legend', weight: 20 },
          { name: '賢者之石',  rarity: 'legend', weight: 20 },
          { name: '世界之心',  rarity: 'legend', weight: 20 }
        ],
        xpBonus: 150, goldBonus: 120
      }
    ]
  }
};

// 採集經驗值計算公式 (每次採集獲得的採集技能經驗)
const GATHER_XP_FORMULA = (tier) => 50 + tier * 30;

// 採集等級所需總經驗值
const GATHER_LEVEL_XP = (level) => level * 100;

const HOUSE_CONFIG = {
  pond:    { name:'魚場',   icon:'🐟', gatherBonus:{ fish:{ xp:30, gold:25, rare:25 } } },
  farm:    { name:'農場',   icon:'🏡', gatherBonus:{ farm:{ xp:30, gold:40, rare:20 } } },
  forge:   { name:'鍛造所', icon:'⚒️', gatherBonus:{ mine:{ xp:25, gold:30, rare:30 } } },
  sawmill: { name:'木材廠', icon:'🪵', gatherBonus:{ wood:{ xp:35, gold:50, rare:15 } } },
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

// ✅ 工具資料庫 (支援 Lv1 - 100 升級)
const TOOL_DATA = {
  tool_pickaxe: { name: '鐵製鶴嘴鋤', icon: '⛏️', baseReq: {'鐵礦': 2, '普通木材': 1}, desc: '提升採礦速度與產量' },
  tool_axe:     { name: '強化斧頭',   icon: '🪓', baseReq: {'鐵礦': 1, '普通木材': 2}, desc: '提升伐木速度與產量' },
  tool_rod:     { name: '精良釣魚竿', icon: '🎣', baseReq: {'普通木材': 2, '蜘蛛絲': 1}, desc: '提升釣魚速度與產量' },
  tool_hoe:     { name: '金屬鋤頭',   icon: '🌾', baseReq: {'鐵礦': 1, '普通木材': 1}, desc: '提升耕田速度與產量' },
  tool_cook:    { name: '煮食工具',   icon: '🍳', baseReq: {'鐵礦': 2, '枯骨': 1}, desc: '提升料理製作時的屬性加成' },
  tool_enhance: { name: '強化工具',   icon: '⚒️', baseReq: {'魔晶礦石': 1, '鐵礦': 2}, desc: '解鎖高級裝備，提升裝備強化上限(最高Lv100)' }
};

// ════════════════════════════════════════════
//  採集輔助函數
// ════════════════════════════════════════════

/**
 * 根據採集等級獲取當前 Tier (1-6)
 */
function getGatherTier(level) {
  if (level >= 50) return 6;
  if (level >= 40) return 5;
  if (level >= 30) return 4;
  if (level >= 20) return 3;
  if (level >= 10) return 2;
  return 1;
}

/**
 * 根據權重隨機選擇物品
 */
function selectGatherItem(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[0];
}

/**
 * 獲取採集類型的當前等級信息
 */
function getGatherLevelInfo(gatherLevels, type) {
  const level = (gatherLevels && gatherLevels[type]) || 1;
  const xp = (gatherLevels && gatherLevels[type + '_xp']) || 0;
  const tier = getGatherTier(level);
  const xpToNext = GATHER_LEVEL_XP(level);
  
  return { level, xp, tier, xpToNext };
}

/**
 * 計算採集收益
 */
function calculateGatherReward(config, level, toolLevel = 1) {
  const tier = getGatherTier(level);
  const tierData = config.tiers[tier - 1];
  
  // 基礎收益 + Tier 加成
  let xp = config.baseXpPer + tierData.xpBonus;
  let gold = config.baseGoldPer + tierData.goldBonus;
  
  // 工具加成 (每級工具 +2%)
  const toolMult = 1 + (toolLevel - 1) * 0.02;
  xp = Math.floor(xp * toolMult);
  gold = Math.floor(gold * toolMult);
  
  // 隨機選擇物品
  const item = selectGatherItem(tierData.items);
  
  // 稀有物品額外加成
  const isRare = item.rarity !== 'common';
  if (isRare) {
    xp = Math.floor(xp * 1.5);
    gold = Math.floor(gold * 1.5);
  }
  
  return { item, xp, gold, tier, isRare };
}
