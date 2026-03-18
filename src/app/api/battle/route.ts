import { NextRequest, NextResponse } from 'next/server';
import { 
  getCharacterById, 
  updateCharacter,
  addInventoryItem,
  getUserById,
  updateUserGold
} from '@/lib/game-data-neon';
import { monstersMap, itemsMap } from '@/lib/game-data-neon';

// 戰鬥
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, monsterId } = body;

    const character = await getCharacterById(characterId);
    if (!character) {
      return NextResponse.json({ error: '角色不存在' }, { status: 400 });
    }

    const monster = monstersMap.get(monsterId);
    if (!monster) {
      return NextResponse.json({ error: '怪物不存在' }, { status: 400 });
    }

    // 計算傷害
    const playerDamage = Math.max(1, character.attack - monster.defense);
    const monsterDamage = Math.max(1, monster.attack - character.defense);

    // 模擬戰鬥（簡化版）
    let playerHp = character.hp;
    let monsterHp = monster.hp;

    while (playerHp > 0 && monsterHp > 0) {
      monsterHp -= playerDamage + Math.floor(Math.random() * 5);
      if (monsterHp <= 0) break;

      playerHp -= monsterDamage + Math.floor(Math.random() * 3);
    }

    const victory = playerHp > 0;

    if (!victory) {
      // 戰敗 - 恢復 30% HP
      await updateCharacter(characterId, {
        hp: Math.floor(character.maxHp * 0.3),
      });

      return NextResponse.json({
        victory: false,
        message: '戰鬥失敗',
      });
    }

    // 勝利 - 計算獎勵
    const expGain = monster.expReward;
    const goldGain = monster.goldReward;

    // 處理掉落物
    const drops: { item: any; quantity: number }[] = [];
    if (monster.drops) {
      for (const drop of monster.drops) {
        if (Math.random() < drop.dropRate) {
          const quantity = Math.floor(
            Math.random() * (drop.maxQuantity - drop.minQuantity + 1) + drop.minQuantity
          );
          const item = itemsMap.get(drop.itemId);
          if (item && quantity > 0) {
            drops.push({ item, quantity });
            await addInventoryItem(characterId, drop.itemId, quantity);
          }
        }
      }
    }

    // 更新角色經驗和金幣
    const currentExp = character.exp + expGain;
    const expNeeded = character.level * 100;
    let newLevel = character.level;
    let levelUp = false;

    if (currentExp >= expNeeded) {
      newLevel = character.level + 1;
      levelUp = true;
    }

    // 更新角色
    const updates: any = {
      exp: currentExp % expNeeded,
      hp: playerHp,
    };

    if (levelUp) {
      updates.level = newLevel;
      updates.maxHp = character.maxHp + 20;
      updates.maxMp = character.maxMp + 10;
      updates.attack = character.attack + 3;
      updates.defense = character.defense + 2;
      updates.magic = character.magic + 2;
      updates.speed = character.speed + 1;
      updates.hp = updates.maxHp; // 升級滿血
    }

    await updateCharacter(characterId, updates);

    // 更新用戶金幣
    await updateUserGold(character.userId, goldGain);

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
  } catch (error) {
    console.error('Battle error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
