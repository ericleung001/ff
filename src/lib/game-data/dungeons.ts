// 遊戲靜態數據 - 迷宮
export const dungeons = [
  { id: 'dungeon_1', name: '哥布林巢穴', description: '哥布林聚集的地下巢穴，適合新手冒險者。', levelRequired: 3, floors: 5, icon: '🕳️', monsters: [{ monsterId: 'monster_1', minFloor: 1, maxFloor: 2, spawnRate: 0.4 }, { monsterId: 'monster_3', minFloor: 2, maxFloor: 5, spawnRate: 0.5 }] },
  { id: 'dungeon_2', name: '古老遺跡', description: '充滿不死生物的古老遺跡。', levelRequired: 8, floors: 7, icon: '🏛️', monsters: [{ monsterId: 'monster_3', minFloor: 1, maxFloor: 3, spawnRate: 0.3 }, { monsterId: 'monster_4', minFloor: 2, maxFloor: 7, spawnRate: 0.4 }] },
  { id: 'dungeon_3', name: '深淵洞穴', description: '深邃黑暗的洞穴系統，充滿危險。', levelRequired: 12, floors: 10, icon: '🌋', monsters: [{ monsterId: 'monster_5', minFloor: 1, maxFloor: 5, spawnRate: 0.4 }, { monsterId: 'monster_6', minFloor: 5, maxFloor: 10, spawnRate: 0.3 }] },
  { id: 'dungeon_4', name: '暗黑城堡', description: '被詛咒的城堡，傳說中有強大的暗影騎士守護。', levelRequired: 18, floors: 15, icon: '🏰', monsters: [{ monsterId: 'monster_4', minFloor: 1, maxFloor: 5, spawnRate: 0.3 }, { monsterId: 'monster_7', minFloor: 5, maxFloor: 12, spawnRate: 0.3 }, { monsterId: 'monster_8', minFloor: 10, maxFloor: 15, spawnRate: 0.2 }] },
  { id: 'dungeon_5', name: '龍之巢', description: '遠古巨龍沉睡的地方，極度危險！', levelRequired: 40, floors: 5, icon: '🐉', monsters: [{ monsterId: 'monster_7', minFloor: 1, maxFloor: 4, spawnRate: 0.3 }, { monsterId: 'monster_9', minFloor: 5, maxFloor: 5, spawnRate: 1.0 }] },
];

export const dungeonsMap = new Map(dungeons.map(d => [d.id, d]));
