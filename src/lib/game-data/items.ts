// 遊戲靜態數據 - 物品模板
export const items = [
  // 武器
  { id: 'item_1', name: '新手木劍', description: '一把普通的木製長劍，適合初學者使用。', itemType: 'WEAPON', rarity: 1, attackBonus: 5, defenseBonus: 0, magicBonus: 0, hpBonus: 0, mpBonus: 0, speedBonus: 0, criticalBonus: 0, basePrice: 100, icon: '🗡️' },
  { id: 'item_2', name: '鐵劍', description: '堅固的鐵製長劍，攻擊力不錯。', itemType: 'WEAPON', rarity: 2, attackBonus: 15, defenseBonus: 0, magicBonus: 0, hpBonus: 0, mpBonus: 0, speedBonus: 2, criticalBonus: 0, basePrice: 500, icon: '⚔️' },
  { id: 'item_3', name: '精鋼劍', description: '以精鋼打造的利劍，鋒利無比。', itemType: 'WEAPON', rarity: 3, attackBonus: 30, defenseBonus: 0, magicBonus: 0, hpBonus: 0, mpBonus: 0, speedBonus: 5, criticalBonus: 0.05, basePrice: 2000, icon: '🔪' },
  { id: 'item_4', name: '新手法杖', description: '基礎的法師武器，能增幅魔力。', itemType: 'WEAPON', rarity: 1, attackBonus: 0, defenseBonus: 0, magicBonus: 8, hpBonus: 0, mpBonus: 20, speedBonus: 0, criticalBonus: 0, basePrice: 100, icon: '🪄' },
  { id: 'item_5', name: '水晶法杖', description: '鑲嵌水晶的法杖，魔力強大。', itemType: 'WEAPON', rarity: 3, attackBonus: 0, defenseBonus: 0, magicBonus: 35, hpBonus: 0, mpBonus: 50, speedBonus: 0, criticalBonus: 0, basePrice: 2500, icon: '🔮' },
  { id: 'item_6', name: '新手弓', description: '簡單的木弓，適合初學者。', itemType: 'WEAPON', rarity: 1, attackBonus: 4, defenseBonus: 0, magicBonus: 0, hpBonus: 0, mpBonus: 0, speedBonus: 5, criticalBonus: 0, basePrice: 100, icon: '🏹' },
  { id: 'item_7', name: '精靈弓', description: '精靈族打造的魔法弓，輕盈而強大。', itemType: 'WEAPON', rarity: 3, attackBonus: 25, defenseBonus: 0, magicBonus: 0, hpBonus: 0, mpBonus: 0, speedBonus: 15, criticalBonus: 0.1, basePrice: 3000, icon: '🎯' },
  // 防具
  { id: 'item_8', name: '布衣', description: '普通的布製衣服，提供基本防禦。', itemType: 'ARMOR', rarity: 1, attackBonus: 0, defenseBonus: 3, magicBonus: 0, hpBonus: 10, mpBonus: 0, speedBonus: 0, criticalBonus: 0, basePrice: 80, icon: '👕' },
  { id: 'item_9', name: '皮甲', description: '輕便的皮革護甲。', itemType: 'ARMOR', rarity: 2, attackBonus: 0, defenseBonus: 10, magicBonus: 0, hpBonus: 30, mpBonus: 0, speedBonus: 2, criticalBonus: 0, basePrice: 400, icon: '🥋' },
  { id: 'item_10', name: '鐵甲', description: '堅固的鐵製盔甲，防禦力高。', itemType: 'ARMOR', rarity: 3, attackBonus: 0, defenseBonus: 25, magicBonus: 0, hpBonus: 80, mpBonus: 0, speedBonus: -3, criticalBonus: 0, basePrice: 1500, icon: '🛡️' },
  { id: 'item_11', name: '法師長袍', description: '附魔的法師袍，增加魔力。', itemType: 'ARMOR', rarity: 2, attackBonus: 0, defenseBonus: 5, magicBonus: 5, hpBonus: 0, mpBonus: 40, speedBonus: 0, criticalBonus: 0, basePrice: 600, icon: '👘' },
  // 飾品
  { id: 'item_12', name: '銅戒指', description: '普通的銅製戒指。', itemType: 'ACCESSORY', rarity: 1, attackBonus: 2, defenseBonus: 0, magicBonus: 0, hpBonus: 0, mpBonus: 0, speedBonus: 0, criticalBonus: 0, basePrice: 50, icon: '💍' },
  { id: 'item_13', name: '力量項鍊', description: '增加力量的項鍊。', itemType: 'ACCESSORY', rarity: 2, attackBonus: 8, defenseBonus: 0, magicBonus: 0, hpBonus: 20, mpBonus: 0, speedBonus: 0, criticalBonus: 0, basePrice: 400, icon: '📿' },
  { id: 'item_14', name: '智慧耳環', description: '增加魔力的耳環。', itemType: 'ACCESSORY', rarity: 2, attackBonus: 0, defenseBonus: 0, magicBonus: 10, hpBonus: 0, mpBonus: 30, speedBonus: 0, criticalBonus: 0, basePrice: 450, icon: '💎' },
  // 材料
  { id: 'item_15', name: '木頭', description: '基本的建築材料。', itemType: 'MATERIAL', rarity: 1, attackBonus: 0, defenseBonus: 0, magicBonus: 0, hpBonus: 0, mpBonus: 0, speedBonus: 0, criticalBonus: 0, basePrice: 10, icon: '🪵' },
  { id: 'item_16', name: '鐵礦石', description: '提煉鐵的原礦。', itemType: 'MATERIAL', rarity: 1, attackBonus: 0, defenseBonus: 0, magicBonus: 0, hpBonus: 0, mpBonus: 0, speedBonus: 0, criticalBonus: 0, basePrice: 20, icon: '🪨' },
  { id: 'item_17', name: '草藥', description: '常見的治療草藥。', itemType: 'MATERIAL', rarity: 1, attackBonus: 0, defenseBonus: 0, magicBonus: 0, hpBonus: 0, mpBonus: 0, speedBonus: 0, criticalBonus: 0, basePrice: 15, icon: '🌿' },
  { id: 'item_18', name: '魔力水晶', description: '蘊含魔力的水晶。', itemType: 'MATERIAL', rarity: 2, attackBonus: 0, defenseBonus: 0, magicBonus: 0, hpBonus: 0, mpBonus: 0, speedBonus: 0, criticalBonus: 0, basePrice: 100, icon: '💠' },
  { id: 'item_19', name: '怪物皮', description: '從怪物身上剝下的皮。', itemType: 'MATERIAL', rarity: 1, attackBonus: 0, defenseBonus: 0, magicBonus: 0, hpBonus: 0, mpBonus: 0, speedBonus: 0, criticalBonus: 0, basePrice: 25, icon: '🦎' },
  { id: 'item_20', name: '怪物骨頭', description: '從怪物身上取得的骨頭。', itemType: 'MATERIAL', rarity: 1, attackBonus: 0, defenseBonus: 0, magicBonus: 0, hpBonus: 0, mpBonus: 0, speedBonus: 0, criticalBonus: 0, basePrice: 30, icon: '🦴' },
  { id: 'item_21', name: '神秘礦石', description: '稀有的神秘礦石。', itemType: 'MATERIAL', rarity: 3, attackBonus: 0, defenseBonus: 0, magicBonus: 0, hpBonus: 0, mpBonus: 0, speedBonus: 0, criticalBonus: 0, basePrice: 500, icon: '💎' },
  { id: 'item_22', name: '魚', description: '新鮮的魚。', itemType: 'MATERIAL', rarity: 1, attackBonus: 0, defenseBonus: 0, magicBonus: 0, hpBonus: 0, mpBonus: 0, speedBonus: 0, criticalBonus: 0, basePrice: 20, icon: '🐟' },
  // 藥水
  { id: 'item_23', name: '小治療藥水', description: '恢復少量HP。', itemType: 'POTION', rarity: 1, attackBonus: 0, defenseBonus: 0, magicBonus: 0, hpBonus: 50, mpBonus: 0, speedBonus: 0, criticalBonus: 0, basePrice: 50, icon: '🧪' },
  { id: 'item_24', name: '中治療藥水', description: '恢復中等量HP。', itemType: 'POTION', rarity: 2, attackBonus: 0, defenseBonus: 0, magicBonus: 0, hpBonus: 150, mpBonus: 0, speedBonus: 0, criticalBonus: 0, basePrice: 150, icon: '🍷' },
  { id: 'item_25', name: '小魔力藥水', description: '恢復少量MP。', itemType: 'POTION', rarity: 1, attackBonus: 0, defenseBonus: 0, magicBonus: 0, hpBonus: 0, mpBonus: 30, speedBonus: 0, criticalBonus: 0, basePrice: 60, icon: '🍶' },
];

export const itemsMap = new Map(items.map(item => [item.id, item]));
