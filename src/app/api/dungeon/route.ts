import { NextRequest, NextResponse } from 'next/server';
import { 
  getCharacterById, 
  updateCharacter,
  addInventoryItem,
  updateUserGold,
} from '@/lib/game-data-neon';
import { dungeonsMap, monstersMap, itemsMap } from '@/lib/game-data-neon';

// 迷宮探險
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, dungeonId, floor } = body;

    if (!characterId || !dungeonId) {
      return NextResponse.json({ error: '缺少參數' }, { status: 400 });
    }

    const character = await getCharacterById(characterId);
    if (!character) {
      return NextResponse.json({ error: '角色不存在' }, { status: 400 });
    }

    const dungeon = dungeonsMap.get(dungeonId);
    if (!dungeon) {
      return NextResponse.json({ error: '迷宮不存在' }, { status: 400 });
    }

    // 檢查等級要求
    if ((character.level || 1) < (dungeon.levelRequired || 1)) {
      return NextResponse.json({ error: `需要等級 ${dungeon.levelRequired}` }, { status: 400 });
    }

    // 隨機事件
    const eventRoll = Math.random();
    let resultType: 'battle' | 'treasure' | 'empty' | 'trap';
    
    if (eventRoll < 0.5) {
      resultType = 'battle';
    } else if (eventRoll < 0.7) {
      resultType = 'treasure';
    } else if (eventRoll < 0.85) {
      resultType = 'empty';
    } else {
      resultType = 'trap';
    }

    // 處理事件
    let battleResult = null;
    const treasureItems: any[] = [];
    let trapDamage = 0;
    let expGain = 0;
    let goldGain = 0;

    switch (resultType) {
      case 'battle': {
        // 選擇適合等級的怪物
        const suitableMonsters = Array.from(monstersMap.values()).filter(
          m => m.level >= (character.level || 1) - 3 && m.level <= (character.level || 1) + 3
        );
        
        if (suitableMonsters.length === 0) {
          resultType = 'empty';
          break;
        }

        const monster = suitableMonsters[Math.floor(Math.random() * suitableMonsters.length)];
        
        // 簡化戰鬥計算
        const playerPower = (character.attack || 10) + (character.defense || 5) + (character.magic || 5);
        const monsterPower = (monster.attack || 5) + (monster.defense || 0);
        const victory = playerPower + Math.random() * 20 > monsterPower;

        if (victory) {
          expGain = monster.expReward || 10;
          goldGain = monster.goldReward || 5;

          // 處理掉落物
          if (monster.drops && Array.isArray(monster.drops)) {
            for (const drop of monster.drops) {
              const dropRate = drop.dropRate || drop.rate || 0.3;
              if (Math.random() < dropRate) {
                const minQty = drop.minQuantity || drop.min || 1;
                const maxQty = drop.maxQuantity || drop.max || 1;
                const quantity = Math.floor(Math.random() * (maxQty - minQty + 1)) + minQty;
                const item = itemsMap.get(drop.itemId);
                if (item && quantity > 0) {
                  treasureItems.push({ item, quantity });
                  try {
                    await addInventoryItem(characterId, drop.itemId, quantity);
                  } catch (e) {
                    console.error('Failed to add item:', e);
                  }
                }
              }
            }
          }

          battleResult = { victory: true, monster, expGain, goldGain };
        } else {
          trapDamage = Math.floor((character.maxHp || 100) * 0.3);
          const newHp = Math.max(1, (character.hp || 100) - trapDamage);
          await updateCharacter(characterId, { hp: newHp });
          battleResult = { victory: false, monster };
        }
        break;
      }

      case 'treasure': {
        // 隨機寶物
        const treasureTable = Array.from(itemsMap.values()).filter(i => (i.rarity || 1) >= 2);
        if (treasureTable.length > 0) {
          const treasure = treasureTable[Math.floor(Math.random() * treasureTable.length)];
          if (treasure) {
            treasureItems.push({ item: treasure, quantity: 1 });
            try {
              await addInventoryItem(characterId, treasure.id, 1);
            } catch (e) {
              console.error('Failed to add treasure:', e);
            }
          }
        }
        expGain = 5;
        goldGain = 10;
        break;
      }

      case 'trap': {
        trapDamage = Math.floor((character.maxHp || 100) * 0.15);
        const newHp = Math.max(1, (character.hp || 100) - trapDamage);
        await updateCharacter(characterId, { hp: newHp });
        break;
      }

      case 'empty':
        expGain = 2;
        break;
    }

    // 更新經驗和金幣
    if (expGain > 0 || goldGain > 0) {
      const currentExp = (character.exp || 0) + expGain;
      const expNeeded = (character.level || 1) * 100;
      let newLevel = character.level || 1;
      let levelUp = false;

      if (currentExp >= expNeeded) {
        newLevel = (character.level || 1) + 1;
        levelUp = true;
      }

      const updates: Record<string, any> = {
        exp: currentExp % expNeeded,
      };

      if (levelUp) {
        updates.level = newLevel;
        updates.maxHp = (character.maxHp || 100) + 20;
        updates.maxMp = (character.maxMp || 50) + 10;
        updates.attack = (character.attack || 10) + 3;
        updates.defense = (character.defense || 5) + 2;
        updates.magic = (character.magic || 5) + 2;
        updates.hp = updates.maxHp;
      }

      await updateCharacter(characterId, updates);
      
      if (goldGain > 0) {
        try {
          await updateUserGold(character.userId, goldGain);
        } catch (e) {
          console.error('Failed to update gold:', e);
        }
      }
    }

    // 檢查是否通關
    const currentFloor = floor || 1;
    const dungeonComplete = currentFloor >= (dungeon.floors || 5);

    return NextResponse.json({
      type: resultType,
      battle: battleResult,
      treasure: treasureItems,
      trapDamage,
      expGain,
      goldGain,
      dungeonComplete,
      victory: battleResult?.victory ?? true,
    });
  } catch (error: any) {
    console.error('Dungeon error:', error);
    return NextResponse.json({ 
      error: '伺服器錯誤', 
      details: error.message 
    }, { status: 500 });
  }
}
