import { NextRequest, NextResponse } from 'next/server';
import { 
  getCharacterById, 
  updateCharacter,
  addInventoryItem,
  updateUserGold
} from '@/lib/game-data-neon';
import { monstersMap, itemsMap } from '@/lib/game-data-neon';

// 戰鬥
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, monsterId } = body;

    if (!characterId || !monsterId) {
      return NextResponse.json({ error: '缺少參數' }, { status: 400 });
    }

    const character = await getCharacterById(characterId);
    if (!character) {
      return NextResponse.json({ error: '角色不存在' }, { status: 400 });
    }

    const monster = monstersMap.get(monsterId);
    if (!monster) {
      return NextResponse.json({ error: '怪物不存在' }, { status: 400 });
    }

    // 獲取角色屬性（確保有默認值）
    const playerAttack = character.attack || 10;
    const playerDefense = character.defense || 5;
    const playerHp = character.hp || character.maxHp || 100;
    const playerMaxHp = character.maxHp || 100;

    // 獲取怪物屬性
    const monsterHp = monster.hp || 50;
    const monsterAttack = monster.attack || 5;
    const monsterDefense = monster.defense || 0;

    // 計算傷害
    const playerDamage = Math.max(1, playerAttack - monsterDefense + Math.floor(Math.random() * 5));
    const monsterDamage = Math.max(1, monsterAttack - playerDefense + Math.floor(Math.random() * 3));

    // 模擬戰鬥
    let currentMonsterHp = monsterHp;
    let currentPlayerHp = playerHp;
    let rounds = 0;
    const maxRounds = 50; // 防止無限循環

    while (currentPlayerHp > 0 && currentMonsterHp > 0 && rounds < maxRounds) {
      // 玩家攻擊
      currentMonsterHp -= playerDamage;
      rounds++;
      if (currentMonsterHp <= 0) break;

      // 怪物反擊
      currentPlayerHp -= monsterDamage;
    }

    const victory = currentPlayerHp > 0;

    if (!victory) {
      // 戰敗 - 恢復 30% HP
      const reviveHp = Math.floor(playerMaxHp * 0.3);
      await updateCharacter(characterId, { hp: reviveHp });

      return NextResponse.json({
        victory: false,
        message: '戰鬥失敗',
      });
    }

    // 勝利 - 計算獎勵
    const expGain = monster.expReward || 10;
    const goldGain = monster.goldReward || 5;

    // 處理掉落物
    const drops: { item: any; quantity: number }[] = [];
    
    if (monster.drops && Array.isArray(monster.drops)) {
      for (const drop of monster.drops) {
        const dropRate = drop.dropRate || drop.rate || 0.3;
        if (Math.random() < dropRate) {
          const minQty = drop.minQuantity || drop.min || 1;
          const maxQty = drop.maxQuantity || drop.max || 1;
          const quantity = Math.floor(Math.random() * (maxQty - minQty + 1)) + minQty;
          
          const item = itemsMap.get(drop.itemId);
          if (item && quantity > 0) {
            drops.push({ item, quantity });
            try {
              await addInventoryItem(characterId, drop.itemId, quantity);
            } catch (e) {
              console.error('Failed to add inventory item:', e);
            }
          }
        }
      }
    }

    // 更新角色經驗
    const currentExp = (character.exp || 0) + expGain;
    const expNeeded = (character.level || 1) * 100;
    let newLevel = character.level || 1;
    let levelUp = false;

    if (currentExp >= expNeeded) {
      newLevel = (character.level || 1) + 1;
      levelUp = true;
    }

    // 準備更新數據
    const updates: Record<string, any> = {
      exp: currentExp % expNeeded,
      hp: Math.max(1, currentPlayerHp),
    };

    if (levelUp) {
      updates.level = newLevel;
      updates.maxHp = (character.maxHp || 100) + 20;
      updates.maxMp = (character.maxMp || 50) + 10;
      updates.attack = (character.attack || 10) + 3;
      updates.defense = (character.defense || 5) + 2;
      updates.magic = (character.magic || 5) + 2;
      updates.speed = (character.speed || 5) + 1;
      updates.hp = updates.maxHp; // 升級滿血
    }

    await updateCharacter(characterId, updates);

    // 更新用戶金幣
    try {
      await updateUserGold(character.userId, goldGain);
    } catch (e) {
      console.error('Failed to update gold:', e);
    }

    return NextResponse.json({
      victory: true,
      rewards: {
        exp: expGain,
        gold: goldGain,
        drops,
        levelUp,
        newLevel: levelUp ? newLevel : undefined,
      },
    });
  } catch (error: any) {
    console.error('Battle error:', error);
    return NextResponse.json({ 
      error: '伺服器錯誤', 
      details: error.message 
    }, { status: 500 });
  }
}
