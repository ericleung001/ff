// 遊戲靜態數據 - 採集點
export const gatheringNodes = [
  { id: 'node_1', name: '樹林', gatheringType: 'WOODCUTTING', levelRequired: 1, icon: '🌲', area: 'forest', drops: [{ itemId: 'item_15', dropRate: 0.8, minQuantity: 1, maxQuantity: 3 }] },
  { id: 'node_2', name: '鐵礦脈', gatheringType: 'MINING', levelRequired: 1, icon: '⛰️', area: 'cave', drops: [{ itemId: 'item_16', dropRate: 0.7, minQuantity: 1, maxQuantity: 2 }, { itemId: 'item_20', dropRate: 0.1, minQuantity: 1, maxQuantity: 1 }] },
  { id: 'node_3', name: '神秘礦脈', gatheringType: 'MINING', levelRequired: 10, icon: '💎', area: 'cave', drops: [{ itemId: 'item_21', dropRate: 0.3, minQuantity: 1, maxQuantity: 2 }, { itemId: 'item_16', dropRate: 0.5, minQuantity: 2, maxQuantity: 4 }] },
  { id: 'node_4', name: '草藥叢', gatheringType: 'HERBALISM', levelRequired: 1, icon: '🌱', area: 'forest', drops: [{ itemId: 'item_17', dropRate: 0.8, minQuantity: 1, maxQuantity: 3 }] },
  { id: 'node_5', name: '魔法花園', gatheringType: 'HERBALISM', levelRequired: 8, icon: '🌸', area: 'ruins', drops: [{ itemId: 'item_18', dropRate: 0.25, minQuantity: 1, maxQuantity: 2 }, { itemId: 'item_17', dropRate: 0.6, minQuantity: 2, maxQuantity: 5 }] },
  { id: 'node_6', name: '河流', gatheringType: 'FISHING', levelRequired: 1, icon: '🏞️', area: 'forest', drops: [{ itemId: 'item_22', dropRate: 0.6, minQuantity: 1, maxQuantity: 2 }] },
];

export const gatheringNodesMap = new Map(gatheringNodes.map(n => [n.id, n]));
