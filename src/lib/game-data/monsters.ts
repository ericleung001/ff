// 遊戲靜態數據 - 怪物
export const monsters = [
  { id: 'monster_1', name: '史萊姆', description: '軟綿綿的果凍狀怪物。', level: 1, hp: 30, attack: 3, defense: 1, magic: 0, speed: 3, expReward: 5, goldReward: 3, icon: '🟢', area: 'forest', drops: [{ itemId: 'item_17', dropRate: 0.3, minQuantity: 1, maxQuantity: 2 }] },
  { id: 'monster_2', name: '野狼', description: '兇猛的森林野狼。', level: 3, hp: 60, attack: 8, defense: 3, magic: 0, speed: 12, expReward: 15, goldReward: 10, icon: '🐺', area: 'forest', drops: [{ itemId: 'item_19', dropRate: 0.4, minQuantity: 1, maxQuantity: 2 }] },
  { id: 'monster_3', name: '哥布林', description: '矮小但狡猾的哥布林。', level: 5, hp: 80, attack: 12, defense: 5, magic: 0, speed: 8, expReward: 25, goldReward: 20, icon: '👺', area: 'forest', drops: [{ itemId: 'item_16', dropRate: 0.3, minQuantity: 1, maxQuantity: 3 }, { itemId: 'item_20', dropRate: 0.25, minQuantity: 1, maxQuantity: 2 }] },
  { id: 'monster_4', name: '骷髏士兵', description: '不死族的骷髏戰士。', level: 8, hp: 120, attack: 18, defense: 10, magic: 5, speed: 6, expReward: 50, goldReward: 35, icon: '💀', area: 'ruins', drops: [{ itemId: 'item_20', dropRate: 0.5, minQuantity: 2, maxQuantity: 4 }, { itemId: 'item_18', dropRate: 0.15, minQuantity: 1, maxQuantity: 2 }] },
  { id: 'monster_5', name: '巨型蜘蛛', description: '有毒的大型蜘蛛。', level: 10, hp: 150, attack: 22, defense: 8, magic: 0, speed: 15, expReward: 70, goldReward: 45, icon: '🕷️', area: 'cave', drops: [{ itemId: 'item_19', dropRate: 0.4, minQuantity: 2, maxQuantity: 3 }] },
  { id: 'monster_6', name: '石巨人', description: '由岩石構成的巨大怪物。', level: 15, hp: 300, attack: 30, defense: 25, magic: 0, speed: 3, expReward: 120, goldReward: 100, icon: '🗿', area: 'cave', drops: [{ itemId: 'item_16', dropRate: 0.6, minQuantity: 3, maxQuantity: 6 }, { itemId: 'item_21', dropRate: 0.1, minQuantity: 1, maxQuantity: 1 }] },
  { id: 'monster_7', name: '火元素', description: '燃燒的元素生物。', level: 12, hp: 180, attack: 25, defense: 8, magic: 20, speed: 10, expReward: 90, goldReward: 70, icon: '🔥', area: 'volcano', drops: [{ itemId: 'item_18', dropRate: 0.4, minQuantity: 2, maxQuantity: 4 }] },
  { id: 'monster_8', name: '暗影騎士', description: '被黑暗侵蝕的騎士。', level: 20, hp: 400, attack: 40, defense: 20, magic: 15, speed: 12, expReward: 200, goldReward: 150, icon: '🖤', area: 'dungeon', drops: [{ itemId: 'item_21', dropRate: 0.2, minQuantity: 1, maxQuantity: 2 }, { itemId: 'item_18', dropRate: 0.3, minQuantity: 2, maxQuantity: 5 }] },
  { id: 'monster_9', name: '遠古巨龍', description: '傳說中的強大巨龍。', level: 50, hp: 2000, attack: 100, defense: 50, magic: 80, speed: 20, expReward: 1000, goldReward: 500, icon: '🐉', area: 'dungeon', drops: [{ itemId: 'item_21', dropRate: 0.5, minQuantity: 3, maxQuantity: 5 }] },
];

export const monstersMap = new Map(monsters.map(m => [m.id, m]));
