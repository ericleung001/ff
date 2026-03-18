import { NextRequest, NextResponse } from 'next/server';
import { 
  getCharacterById, 
  updateCharacter,
  addInventoryItem,
  updateUserGold,
  getUserById
} from '@/lib/game-data-neon';
import { dungeonsMap, monstersMap, itemsMap } from '@/lib/game-data-neon';

// 迷宮探險
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, dungeonId, floor } = body;

    const character = await getCharacterById(characterId);
    if (!character) {
      return NextResponse.json({ error: '角色不存在' }, { status: 400 });
    }

    const dungeon = dungeonsMap.get(dungeonId);
    if (!dungeon) {
      return NextResponse.json({ error: '迷宮不存在' }, { status: 400 });
    }

    // 檢查等級要求
    if (character.level < dungeon.levelRequired) {
      return NextResponse.json({ error: `需要等級 ${dungeon.levelRequired}` }, { status: 400 });
    }

    // 隨機事件
    const eventRoll = Math.random();
    let result: 'battle' | 'treasure' | 'empty' | 'trap';
    
    if (eventRoll < 0.5) {
      result = 'battle';
    } else if (eventRoll < 0.7) {
      result = 'treasure';
    } else if (eventRoll < 0.85) {
      result = 'empty';
    } else {
      result = 'trap';
    }

    // 處理事件
    let battleResult = null;
    let treasureItems: any[] = [];
    let trapDamage = 0;

    switch (result) {
      case 'battle': {
        // 選擇一個適合等級的怪物
        const suitableMonsters = Array.from(monstersMap.values()).filter(
          m => m.level >= character.level - 3 && m.level <= character.level + 3
        );
        const monster = suitableMonsters[Math.floor(Math.random() * suitableMonsters.length)];
        
        if (!monster) {
          result = 'empty';
          break;
        }

        // 簡化戰鬥計算
        const playerPower = character.attack + character.defense + character.magic;
        const monsterPower = monster.attack + monster.defense + monster.magic;
        const victory = playerPower + Math.random() * 20 > monsterPower;

        if (victory) {
          // 勝利獎勵
          const expGain = monster.expReward;
          const goldGain = monster.goldReward;

          // 掉落物
          for (const drop of monster.drops) {
            if (Math.random() < drop.dropRate) {
              const quantity = Math.floor(
                Math.random() * (drop.maxQuantity - drop.minQuantity + 1) + drop.minQuantity
              );
              const item = itemsMap.get(drop.itemId);
              if (item && quantity > 0) {
                treasureItems.push({ item, quantity });
                await addInventoryItem(characterId, drop.itemId, quantity);
              }
            }
          }

          // 更新角色
          const currentExp = character.exp + expGain;
          const expNeeded = character.level * 100;
          let updates: any = {
            exp: currentExp % expNeeded,
          };

          if (currentExp >= expNeeded) {
            updates.level = character.level + 1;
            updates.maxHp = character.maxHp + 20;
            updates.maxMp = character.maxMp + 10;
            updates.attack = character.attack + 3;
            updates.defense = character.defense + 2;
            updates.magic = character.magic + 2;
            updates.hp = updates.maxHp;
          }

          await updateCharacter(characterId, updates);
          await updateUserGold(character.userId, goldGain);

          battleResult = { victory: true, monster, expGain, goldGain };
        } else {
          // 戰敗
          trapDamage = Math.floor(character.maxHp * 0.5);
          await updateCharacter(characterId, { hp: character.hp - trapDamage });
          battleResult = { victory: false, monster };
        }
        break;
      }

      case 'treasure': {
        // 隨機寶物
        const treasureTable = Array.from(itemsMap.values()).filter(i => i.rarity >= 2);
        const treasure = treasureTable[Math.floor(Math.random() * treasureTable.length)];
        if (treasure) {
          treasureItems.push({ item: treasure, quantity: 1 });
          await addInventoryItem(characterId, treasure.id, 1);
        }
        break;
      }

      case 'trap': {
        trapDamage = Math.floor(character.maxHp * 0.2);
        await updateCharacter(characterId, { hp: Math.max(1, character.hp - trapDamage) });
        break;
      }

      case 'empty':
        // 無事件
        break;
    }

    // 檢查是否通關
    const dungeonComplete = floor >= dungeon.floors;

    return NextResponse.json({
      type: result,
      battle: battleResult,
      treasure: treasureItems,
      trapDamage,
      dungeonComplete,
      victory: battleResult?.victory ?? true,
    });
  } catch (error) {
    console.error('Dungeon error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
