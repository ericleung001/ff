import { PrismaClient, ItemType, GatheringType, CharacterClass } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('開始初始化遊戲數據...');

  // ==================== 創建物品模板 ====================
  const items = await Promise.all([
    // 武器
    prisma.itemTemplate.create({
      data: {
        name: '新手木劍',
        description: '一把普通的木製長劍，適合初學者使用。',
        itemType: ItemType.WEAPON,
        rarity: 1,
        attackBonus: 5,
        basePrice: 100,
        icon: '🗡️',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '鐵劍',
        description: '堅固的鐵製長劍，攻擊力不錯。',
        itemType: ItemType.WEAPON,
        rarity: 2,
        attackBonus: 15,
        speedBonus: 2,
        basePrice: 500,
        icon: '⚔️',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '精鋼劍',
        description: '以精鋼打造的利劍，鋒利無比。',
        itemType: ItemType.WEAPON,
        rarity: 3,
        attackBonus: 30,
        speedBonus: 5,
        criticalBonus: 0.05,
        basePrice: 2000,
        icon: '🔪',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '新手法杖',
        description: '基礎的法師武器，能增幅魔力。',
        itemType: ItemType.WEAPON,
        rarity: 1,
        magicBonus: 8,
        mpBonus: 20,
        basePrice: 100,
        icon: '🪄',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '水晶法杖',
        description: '鑲嵌水晶的法杖，魔力強大。',
        itemType: ItemType.WEAPON,
        rarity: 3,
        magicBonus: 35,
        mpBonus: 50,
        basePrice: 2500,
        icon: '🔮',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '新手弓',
        description: '簡單的木弓，適合初學者。',
        itemType: ItemType.WEAPON,
        rarity: 1,
        attackBonus: 4,
        speedBonus: 5,
        basePrice: 100,
        icon: '🏹',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '精靈弓',
        description: '精靈族打造的魔法弓，輕盈而強大。',
        itemType: ItemType.WEAPON,
        rarity: 3,
        attackBonus: 25,
        speedBonus: 15,
        criticalBonus: 0.1,
        basePrice: 3000,
        icon: '🎯',
      },
    }),

    // 防具
    prisma.itemTemplate.create({
      data: {
        name: '布衣',
        description: '普通的布製衣服，提供基本防禦。',
        itemType: ItemType.ARMOR,
        rarity: 1,
        defenseBonus: 3,
        hpBonus: 10,
        basePrice: 80,
        icon: '👕',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '皮甲',
        description: '輕便的皮革護甲。',
        itemType: ItemType.ARMOR,
        rarity: 2,
        defenseBonus: 10,
        hpBonus: 30,
        speedBonus: 2,
        basePrice: 400,
        icon: '🥋',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '鐵甲',
        description: '堅固的鐵製盔甲，防禦力高。',
        itemType: ItemType.ARMOR,
        rarity: 3,
        defenseBonus: 25,
        hpBonus: 80,
        speedBonus: -3,
        basePrice: 1500,
        icon: '🛡️',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '法師長袍',
        description: '附魔的法師袍，增加魔力。',
        itemType: ItemType.ARMOR,
        rarity: 2,
        defenseBonus: 5,
        mpBonus: 40,
        magicBonus: 5,
        basePrice: 600,
        icon: '👘',
      },
    }),

    // 飾品
    prisma.itemTemplate.create({
      data: {
        name: '銅戒指',
        description: '普通的銅製戒指。',
        itemType: ItemType.ACCESSORY,
        rarity: 1,
        attackBonus: 2,
        basePrice: 50,
        icon: '💍',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '力量項鍊',
        description: '增加力量的項鍊。',
        itemType: ItemType.ACCESSORY,
        rarity: 2,
        attackBonus: 8,
        hpBonus: 20,
        basePrice: 400,
        icon: '📿',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '智慧耳環',
        description: '增加魔力的耳環。',
        itemType: ItemType.ACCESSORY,
        rarity: 2,
        magicBonus: 10,
        mpBonus: 30,
        basePrice: 450,
        icon: '💎',
      },
    }),

    // 材料
    prisma.itemTemplate.create({
      data: {
        name: '木頭',
        description: '基本的建築材料。',
        itemType: ItemType.MATERIAL,
        rarity: 1,
        basePrice: 10,
        icon: '🪵',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '鐵礦石',
        description: '提煉鐵的原礦。',
        itemType: ItemType.MATERIAL,
        rarity: 1,
        basePrice: 20,
        icon: '🪨',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '草藥',
        description: '常見的治療草藥。',
        itemType: ItemType.MATERIAL,
        rarity: 1,
        basePrice: 15,
        icon: '🌿',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '魔力水晶',
        description: '蘊含魔力的水晶。',
        itemType: ItemType.MATERIAL,
        rarity: 2,
        basePrice: 100,
        icon: '💠',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '怪物皮',
        description: '從怪物身上剝下的皮。',
        itemType: ItemType.MATERIAL,
        rarity: 1,
        basePrice: 25,
        icon: '🦎',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '怪物骨頭',
        description: '從怪物身上取得的骨頭。',
        itemType: ItemType.MATERIAL,
        rarity: 1,
        basePrice: 30,
        icon: '🦴',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '神秘礦石',
        description: '稀有的神秘礦石。',
        itemType: ItemType.MATERIAL,
        rarity: 3,
        basePrice: 500,
        icon: '💎',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '魚',
        description: '新鮮的魚。',
        itemType: ItemType.MATERIAL,
        rarity: 1,
        basePrice: 20,
        icon: '🐟',
      },
    }),

    // 藥水
    prisma.itemTemplate.create({
      data: {
        name: '小治療藥水',
        description: '恢復少量HP。',
        itemType: ItemType.POTION,
        rarity: 1,
        hpBonus: 50,
        basePrice: 50,
        icon: '🧪',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '中治療藥水',
        description: '恢復中等量HP。',
        itemType: ItemType.POTION,
        rarity: 2,
        hpBonus: 150,
        basePrice: 150,
        icon: '🍷',
      },
    }),
    prisma.itemTemplate.create({
      data: {
        name: '小魔力藥水',
        description: '恢復少量MP。',
        itemType: ItemType.POTION,
        rarity: 1,
        mpBonus: 30,
        basePrice: 60,
        icon: '🍶',
      },
    }),
  ]);

  console.log(`已創建 ${items.length} 個物品模板`);

  // ==================== 創建怪物 ====================
  const monsters = await Promise.all([
    prisma.monster.create({
      data: {
        name: '史萊姆',
        description: '軟綿綿的果凍狀怪物。',
        level: 1,
        hp: 30,
        attack: 3,
        defense: 1,
        speed: 3,
        expReward: 5,
        goldReward: 3,
        icon: '🟢',
        area: 'forest',
      },
    }),
    prisma.monster.create({
      data: {
        name: '野狼',
        description: '兇猛的森林野狼。',
        level: 3,
        hp: 60,
        attack: 8,
        defense: 3,
        speed: 12,
        expReward: 15,
        goldReward: 10,
        icon: '🐺',
        area: 'forest',
      },
    }),
    prisma.monster.create({
      data: {
        name: '哥布林',
        description: '矮小但狡猾的哥布林。',
        level: 5,
        hp: 80,
        attack: 12,
        defense: 5,
        speed: 8,
        expReward: 25,
        goldReward: 20,
        icon: '👺',
        area: 'forest',
      },
    }),
    prisma.monster.create({
      data: {
        name: '骷髏士兵',
        description: '不死族的骷髏戰士。',
        level: 8,
        hp: 120,
        attack: 18,
        defense: 10,
        speed: 6,
        magic: 5,
        expReward: 50,
        goldReward: 35,
        icon: '💀',
        area: 'ruins',
      },
    }),
    prisma.monster.create({
      data: {
        name: '巨型蜘蛛',
        description: '有毒的大型蜘蛛。',
        level: 10,
        hp: 150,
        attack: 22,
        defense: 8,
        speed: 15,
        expReward: 70,
        goldReward: 45,
        icon: '🕷️',
        area: 'cave',
      },
    }),
    prisma.monster.create({
      data: {
        name: '石巨人',
        description: '由岩石構成的巨大怪物。',
        level: 15,
        hp: 300,
        attack: 30,
        defense: 25,
        speed: 3,
        expReward: 120,
        goldReward: 100,
        icon: '🗿',
        area: 'cave',
      },
    }),
    prisma.monster.create({
      data: {
        name: '火元素',
        description: '燃燒的元素生物。',
        level: 12,
        hp: 180,
        attack: 25,
        defense: 8,
        magic: 20,
        speed: 10,
        expReward: 90,
        goldReward: 70,
        icon: '🔥',
        area: 'volcano',
      },
    }),
    prisma.monster.create({
      data: {
        name: '暗影騎士',
        description: '被黑暗侵蝕的騎士。',
        level: 20,
        hp: 400,
        attack: 40,
        defense: 20,
        magic: 15,
        speed: 12,
        expReward: 200,
        goldReward: 150,
        icon: '🖤',
        area: 'dungeon',
      },
    }),
    prisma.monster.create({
      data: {
        name: '遠古巨龍',
        description: '傳說中的強大巨龍。',
        level: 50,
        hp: 2000,
        attack: 100,
        defense: 50,
        magic: 80,
        speed: 20,
        expReward: 1000,
        goldReward: 500,
        icon: '🐉',
        area: 'dungeon',
      },
    }),
  ]);

  console.log(`已創建 ${monsters.length} 隻怪物`);

  // ==================== 創建怪物掉落 ====================
  const monsterDrops = await Promise.all([
    // 史萊姆掉落
    prisma.monsterDrop.create({
      data: { monsterId: monsters[0].id, itemId: items.find(i => i.name === '草藥')!.id, dropRate: 0.3, minQuantity: 1, maxQuantity: 2 },
    }),
    // 野狼掉落
    prisma.monsterDrop.create({
      data: { monsterId: monsters[1].id, itemId: items.find(i => i.name === '怪物皮')!.id, dropRate: 0.4, minQuantity: 1, maxQuantity: 2 },
    }),
    // 哥布林掉落
    prisma.monsterDrop.create({
      data: { monsterId: monsters[2].id, itemId: items.find(i => i.name === '鐵礦石')!.id, dropRate: 0.3, minQuantity: 1, maxQuantity: 3 },
    }),
    prisma.monsterDrop.create({
      data: { monsterId: monsters[2].id, itemId: items.find(i => i.name === '怪物骨頭')!.id, dropRate: 0.25, minQuantity: 1, maxQuantity: 2 },
    }),
    // 骷髏士兵掉落
    prisma.monsterDrop.create({
      data: { monsterId: monsters[3].id, itemId: items.find(i => i.name === '怪物骨頭')!.id, dropRate: 0.5, minQuantity: 2, maxQuantity: 4 },
    }),
    prisma.monsterDrop.create({
      data: { monsterId: monsters[3].id, itemId: items.find(i => i.name === '魔力水晶')!.id, dropRate: 0.15, minQuantity: 1, maxQuantity: 2 },
    }),
    // 巨型蜘蛛掉落
    prisma.monsterDrop.create({
      data: { monsterId: monsters[4].id, itemId: items.find(i => i.name === '怪物皮')!.id, dropRate: 0.4, minQuantity: 2, maxQuantity: 3 },
    }),
    // 石巨人掉落
    prisma.monsterDrop.create({
      data: { monsterId: monsters[5].id, itemId: items.find(i => i.name === '鐵礦石')!.id, dropRate: 0.6, minQuantity: 3, maxQuantity: 6 },
    }),
    prisma.monsterDrop.create({
      data: { monsterId: monsters[5].id, itemId: items.find(i => i.name === '神秘礦石')!.id, dropRate: 0.1, minQuantity: 1, maxQuantity: 1 },
    }),
    // 火元素掉落
    prisma.monsterDrop.create({
      data: { monsterId: monsters[6].id, itemId: items.find(i => i.name === '魔力水晶')!.id, dropRate: 0.4, minQuantity: 2, maxQuantity: 4 },
    }),
    // 暗影騎士掉落
    prisma.monsterDrop.create({
      data: { monsterId: monsters[7].id, itemId: items.find(i => i.name === '神秘礦石')!.id, dropRate: 0.2, minQuantity: 1, maxQuantity: 2 },
    }),
    prisma.monsterDrop.create({
      data: { monsterId: monsters[7].id, itemId: items.find(i => i.name === '魔力水晶')!.id, dropRate: 0.3, minQuantity: 2, maxQuantity: 5 },
    }),
  ]);

  console.log(`已創建 ${monsterDrops.length} 個怪物掉落`);

  // ==================== 創建採集點 ====================
  const gatheringNodes = await Promise.all([
    prisma.gatheringNode.create({
      data: {
        name: '樹林',
        gatheringType: GatheringType.WOODCUTTING,
        levelRequired: 1,
        icon: '🌲',
        area: 'forest',
      },
    }),
    prisma.gatheringNode.create({
      data: {
        name: '鐵礦脈',
        gatheringType: GatheringType.MINING,
        levelRequired: 1,
        icon: '⛰️',
        area: 'cave',
      },
    }),
    prisma.gatheringNode.create({
      data: {
        name: '神秘礦脈',
        gatheringType: GatheringType.MINING,
        levelRequired: 10,
        icon: '💎',
        area: 'cave',
      },
    }),
    prisma.gatheringNode.create({
      data: {
        name: '草藥叢',
        gatheringType: GatheringType.HERBALISM,
        levelRequired: 1,
        icon: '🌱',
        area: 'forest',
      },
    }),
    prisma.gatheringNode.create({
      data: {
        name: '魔法花園',
        gatheringType: GatheringType.HERBALISM,
        levelRequired: 8,
        icon: '🌸',
        area: 'ruins',
      },
    }),
    prisma.gatheringNode.create({
      data: {
        name: '河流',
        gatheringType: GatheringType.FISHING,
        levelRequired: 1,
        icon: '🏞️',
        area: 'forest',
      },
    }),
  ]);

  console.log(`已創建 ${gatheringNodes.length} 個採集點`);

  // ==================== 創建採集掉落 ====================
  const gatheringDrops = await Promise.all([
    // 樹林
    prisma.gatheringDrop.create({
      data: { nodeId: gatheringNodes[0].id, itemId: items.find(i => i.name === '木頭')!.id, dropRate: 0.8, minQuantity: 1, maxQuantity: 3 },
    }),
    // 鐵礦脈
    prisma.gatheringDrop.create({
      data: { nodeId: gatheringNodes[1].id, itemId: items.find(i => i.name === '鐵礦石')!.id, dropRate: 0.7, minQuantity: 1, maxQuantity: 2 },
    }),
    prisma.gatheringDrop.create({
      data: { nodeId: gatheringNodes[1].id, itemId: items.find(i => i.name === '怪物骨頭')!.id, dropRate: 0.1, minQuantity: 1, maxQuantity: 1 },
    }),
    // 神秘礦脈
    prisma.gatheringDrop.create({
      data: { nodeId: gatheringNodes[2].id, itemId: items.find(i => i.name === '神秘礦石')!.id, dropRate: 0.3, minQuantity: 1, maxQuantity: 2 },
    }),
    prisma.gatheringDrop.create({
      data: { nodeId: gatheringNodes[2].id, itemId: items.find(i => i.name === '鐵礦石')!.id, dropRate: 0.5, minQuantity: 2, maxQuantity: 4 },
    }),
    // 草藥叢
    prisma.gatheringDrop.create({
      data: { nodeId: gatheringNodes[3].id, itemId: items.find(i => i.name === '草藥')!.id, dropRate: 0.8, minQuantity: 1, maxQuantity: 3 },
    }),
    // 魔法花園
    prisma.gatheringDrop.create({
      data: { nodeId: gatheringNodes[4].id, itemId: items.find(i => i.name === '魔力水晶')!.id, dropRate: 0.25, minQuantity: 1, maxQuantity: 2 },
    }),
    prisma.gatheringDrop.create({
      data: { nodeId: gatheringNodes[4].id, itemId: items.find(i => i.name === '草藥')!.id, dropRate: 0.6, minQuantity: 2, maxQuantity: 5 },
    }),
    // 河流
    prisma.gatheringDrop.create({
      data: { nodeId: gatheringNodes[5].id, itemId: items.find(i => i.name === '魚')!.id, dropRate: 0.6, minQuantity: 1, maxQuantity: 2 },
    }),
  ]);

  console.log(`已創建 ${gatheringDrops.length} 個採集掉落`);

  // ==================== 創建迷宮 ====================
  const dungeons = await Promise.all([
    prisma.dungeon.create({
      data: {
        name: '哥布林巢穴',
        description: '哥布林聚集的地下巢穴，適合新手冒險者。',
        levelRequired: 3,
        floors: 5,
        icon: '🕳️',
      },
    }),
    prisma.dungeon.create({
      data: {
        name: '古老遺跡',
        description: '充滿不死生物的古老遺跡。',
        levelRequired: 8,
        floors: 7,
        icon: '🏛️',
      },
    }),
    prisma.dungeon.create({
      data: {
        name: '深淵洞穴',
        description: '深邃黑暗的洞穴系統，充滿危險。',
        levelRequired: 12,
        floors: 10,
        icon: '🌋',
      },
    }),
    prisma.dungeon.create({
      data: {
        name: '暗黑城堡',
        description: '被詛咒的城堡，傳說中有強大的暗影騎士守護。',
        levelRequired: 18,
        floors: 15,
        icon: '🏰',
      },
    }),
    prisma.dungeon.create({
      data: {
        name: '龍之巢',
        description: '遠古巨龍沉睡的地方，極度危險！',
        levelRequired: 40,
        floors: 5,
        icon: '🐉',
      },
    }),
  ]);

  console.log(`已創建 ${dungeons.length} 個迷宮`);

  // ==================== 創建迷宮怪物分佈 ====================
  const dungeonMonsters = await Promise.all([
    // 哥布林巢穴
    prisma.dungeonMonster.create({
      data: { dungeonId: dungeons[0].id, monsterId: monsters[0].id, minFloor: 1, maxFloor: 2, spawnRate: 0.4 },
    }),
    prisma.dungeonMonster.create({
      data: { dungeonId: dungeons[0].id, monsterId: monsters[2].id, minFloor: 2, maxFloor: 5, spawnRate: 0.5 },
    }),
    // 古老遺跡
    prisma.dungeonMonster.create({
      data: { dungeonId: dungeons[1].id, monsterId: monsters[2].id, minFloor: 1, maxFloor: 3, spawnRate: 0.3 },
    }),
    prisma.dungeonMonster.create({
      data: { dungeonId: dungeons[1].id, monsterId: monsters[3].id, minFloor: 2, maxFloor: 7, spawnRate: 0.4 },
    }),
    // 深淵洞穴
    prisma.dungeonMonster.create({
      data: { dungeonId: dungeons[2].id, monsterId: monsters[4].id, minFloor: 1, maxFloor: 5, spawnRate: 0.4 },
    }),
    prisma.dungeonMonster.create({
      data: { dungeonId: dungeons[2].id, monsterId: monsters[5].id, minFloor: 5, maxFloor: 10, spawnRate: 0.3 },
    }),
    // 暗黑城堡
    prisma.dungeonMonster.create({
      data: { dungeonId: dungeons[3].id, monsterId: monsters[3].id, minFloor: 1, maxFloor: 5, spawnRate: 0.3 },
    }),
    prisma.dungeonMonster.create({
      data: { dungeonId: dungeons[3].id, monsterId: monsters[6].id, minFloor: 5, maxFloor: 12, spawnRate: 0.3 },
    }),
    prisma.dungeonMonster.create({
      data: { dungeonId: dungeons[3].id, monsterId: monsters[7].id, minFloor: 10, maxFloor: 15, spawnRate: 0.2 },
    }),
    // 龍之巢
    prisma.dungeonMonster.create({
      data: { dungeonId: dungeons[4].id, monsterId: monsters[6].id, minFloor: 1, maxFloor: 4, spawnRate: 0.3 },
    }),
    prisma.dungeonMonster.create({
      data: { dungeonId: dungeons[4].id, monsterId: monsters[8].id, minFloor: 5, maxFloor: 5, spawnRate: 1.0 },
    }),
  ]);

  console.log(`已創建 ${dungeonMonsters.length} 個迷宮怪物分佈`);

  // ==================== 創建製作配方 ====================
  const recipes = await Promise.all([
    // 鐵劍
    prisma.craftingRecipe.create({
      data: {
        resultItemId: items.find(i => i.name === '鐵劍')!.id,
        resultQuantity: 1,
        requiredLevel: 3,
        materials: {
          create: [
            { itemId: items.find(i => i.name === '鐵礦石')!.id, quantity: 3 },
            { itemId: items.find(i => i.name === '木頭')!.id, quantity: 2 },
          ],
        },
      },
    }),
    // 精鋼劍
    prisma.craftingRecipe.create({
      data: {
        resultItemId: items.find(i => i.name === '精鋼劍')!.id,
        resultQuantity: 1,
        requiredLevel: 10,
        materials: {
          create: [
            { itemId: items.find(i => i.name === '鐵礦石')!.id, quantity: 5 },
            { itemId: items.find(i => i.name === '神秘礦石')!.id, quantity: 2 },
            { itemId: items.find(i => i.name === '怪物骨頭')!.id, quantity: 3 },
          ],
        },
      },
    }),
    // 水晶法杖
    prisma.craftingRecipe.create({
      data: {
        resultItemId: items.find(i => i.name === '水晶法杖')!.id,
        resultQuantity: 1,
        requiredLevel: 10,
        materials: {
          create: [
            { itemId: items.find(i => i.name === '木頭')!.id, quantity: 3 },
            { itemId: items.find(i => i.name === '魔力水晶')!.id, quantity: 4 },
          ],
        },
      },
    }),
    // 精靈弓
    prisma.craftingRecipe.create({
      data: {
        resultItemId: items.find(i => i.name === '精靈弓')!.id,
        resultQuantity: 1,
        requiredLevel: 12,
        materials: {
          create: [
            { itemId: items.find(i => i.name === '木頭')!.id, quantity: 5 },
            { itemId: items.find(i => i.name === '魔力水晶')!.id, quantity: 2 },
            { itemId: items.find(i => i.name === '怪物皮')!.id, quantity: 2 },
          ],
        },
      },
    }),
    // 皮甲
    prisma.craftingRecipe.create({
      data: {
        resultItemId: items.find(i => i.name === '皮甲')!.id,
        resultQuantity: 1,
        requiredLevel: 3,
        materials: {
          create: [
            { itemId: items.find(i => i.name === '怪物皮')!.id, quantity: 5 },
          ],
        },
      },
    }),
    // 鐵甲
    prisma.craftingRecipe.create({
      data: {
        resultItemId: items.find(i => i.name === '鐵甲')!.id,
        resultQuantity: 1,
        requiredLevel: 8,
        materials: {
          create: [
            { itemId: items.find(i => i.name === '鐵礦石')!.id, quantity: 8 },
            { itemId: items.find(i => i.name === '怪物皮')!.id, quantity: 3 },
          ],
        },
      },
    }),
    // 法師長袍
    prisma.craftingRecipe.create({
      data: {
        resultItemId: items.find(i => i.name === '法師長袍')!.id,
        resultQuantity: 1,
        requiredLevel: 5,
        materials: {
          create: [
            { itemId: items.find(i => i.name === '草藥')!.id, quantity: 5 },
            { itemId: items.find(i => i.name === '魔力水晶')!.id, quantity: 2 },
          ],
        },
      },
    }),
    // 力量項鍊
    prisma.craftingRecipe.create({
      data: {
        resultItemId: items.find(i => i.name === '力量項鍊')!.id,
        resultQuantity: 1,
        requiredLevel: 5,
        materials: {
          create: [
            { itemId: items.find(i => i.name === '鐵礦石')!.id, quantity: 2 },
            { itemId: items.find(i => i.name === '怪物骨頭')!.id, quantity: 2 },
          ],
        },
      },
    }),
    // 智慧耳環
    prisma.craftingRecipe.create({
      data: {
        resultItemId: items.find(i => i.name === '智慧耳環')!.id,
        resultQuantity: 1,
        requiredLevel: 5,
        materials: {
          create: [
            { itemId: items.find(i => i.name === '魔力水晶')!.id, quantity: 2 },
            { itemId: items.find(i => i.name === '鐵礦石')!.id, quantity: 1 },
          ],
        },
      },
    }),
    // 小治療藥水
    prisma.craftingRecipe.create({
      data: {
        resultItemId: items.find(i => i.name === '小治療藥水')!.id,
        resultQuantity: 2,
        requiredLevel: 1,
        materials: {
          create: [
            { itemId: items.find(i => i.name === '草藥')!.id, quantity: 2 },
          ],
        },
      },
    }),
    // 中治療藥水
    prisma.craftingRecipe.create({
      data: {
        resultItemId: items.find(i => i.name === '中治療藥水')!.id,
        resultQuantity: 1,
        requiredLevel: 5,
        materials: {
          create: [
            { itemId: items.find(i => i.name === '草藥')!.id, quantity: 4 },
            { itemId: items.find(i => i.name === '魔力水晶')!.id, quantity: 1 },
          ],
        },
      },
    }),
    // 小魔力藥水
    prisma.craftingRecipe.create({
      data: {
        resultItemId: items.find(i => i.name === '小魔力藥水')!.id,
        resultQuantity: 2,
        requiredLevel: 1,
        materials: {
          create: [
            { itemId: items.find(i => i.name === '魔力水晶')!.id, quantity: 1 },
          ],
        },
      },
    }),
  ]);

  console.log(`已創建 ${recipes.length} 個製作配方`);

  console.log('遊戲數據初始化完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
