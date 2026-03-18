import { NextRequest, NextResponse } from 'next/server';
import { 
  getCharacterById, 
  updateCharacter, 
  updateUserGold, 
  getInventoryByCharacterId,
  addInventoryItem
} from '@/lib/game-data';
import { dungeonsMap, monstersMap, itemsMap } from '@/lib/game-data';

// 迷宮探險
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, dungeonId, floor } = body;

    const character = getCharacterById(characterId);
    const dungeon = dungeonsMap.get(dungeonId);

    if (!character || !dungeon) {
      return NextResponse.json({ error: '角色或迷宮不存在' }, { status: 400 });
    }

    if (character.level < dungeon.levelRequired) {
      return NextResponse.json({ error: `需要等級 ${dungeon.levelRequired}` }, { status: 400 });
    }

    // 計算裝備加成
    let totalAttack = character.attack;
    let totalDefense = character.defense;

    const invItems = getInventoryByCharacterId(characterId);
    for (const inv of invItems) {
      if (inv.equipped) {
        const item = itemsMap.get(inv.itemId);
        if (item) {
          totalAttack += item.attackBonus;
          totalDefense += item.defenseBonus;
        }
      }
    }

    // 找出這層可能出現的怪物
    const possibleMonsters = (dungeon.monsters || []).filter(
      m => floor >= m.minFloor && floor <= m.maxFloor
    );

    // 決定是否遇到怪物
    let encounter = null;
    if (possibleMonsters.length > 0) {
      const totalSpawnRate = possibleMonsters.reduce((sum, m) => sum + m.spawnRate, 0);
      if (Math.random() < totalSpawnRate) {
        let random = Math.random() * totalSpawnRate;
        for (const m of possibleMonsters) {
          random -= m.spawnRate;
          if (random <= 0) {
            encounter = monstersMap.get(m.monsterId);
            break;
          }
        }
      }
    }

    if (encounter) {
      // 戰鬥
      const battleLog: string[] = [];
      let characterHp = character.hp;
      let monsterHp = encounter.hp;

      battleLog.push(`🏰 迷宮第 ${floor} 層 - 遭遇 ${encounter.icon} ${encounter.name}！`);

      let turn = 1;
      while (characterHp > 0 && monsterHp > 0 && turn <= 20) {
        const playerDamage = Math.max(1, totalAttack - encounter.defense + Math.floor(Math.random() * 5));
        monsterHp = Math.max(0, monsterHp - playerDamage);
        battleLog.push(`回合 ${turn}: 你造成 ${playerDamage} 傷害`);

        if (monsterHp <= 0) break;

        const monsterDamage = Math.max(1, encounter.attack - totalDefense + Math.floor(Math.random() * 3));
        characterHp = Math.max(0, characterHp - monsterDamage);
        battleLog.push(`回合 ${turn}: ${encounter.name} 造成 ${monsterDamage} 傷害`);

        turn++;
      }

      const victory = monsterHp <= 0;

      if (victory) {
        // 獲得獎勵
        const expGain = Math.floor(encounter.expReward * 1.5);
        const goldGain = Math.floor(encounter.goldReward * 1.5);

        // 獲取怪物掉落
        const drops: { item: any; quantity: number }[] = [];
        if (encounter.drops) {
          for (const drop of encounter.drops) {
            if (Math.random() < drop.dropRate) {
              const quantity = Math.floor(
                Math.random() * (drop.maxQuantity - drop.minQuantity + 1) + drop.minQuantity
              );
              const item = itemsMap.get(drop.itemId);
              if (item) {
                drops.push({ item, quantity });
                addInventoryItem(characterId, drop.itemId, quantity);
              }
            }
          }
        }

        // 更新角色
        let newExp = character.exp + expGain;
        let newLevel = character.level;

        if (newExp >= character.level * 100) {
          newLevel++;
          newExp -= character.level * 100;
        }

        updateCharacter(characterId, { hp: characterHp, exp: newExp, level: newLevel });
        updateUserGold(character.userId, goldGain);

        const isLastFloor = floor >= dungeon.floors;

        return NextResponse.json({
          type: 'battle',
          victory: true,
          battleLog,
          rewards: { exp: expGain, gold: goldGain, drops },
          characterHp,
          currentFloor: floor,
          isLastFloor,
          dungeonComplete: isLastFloor,
        });
      } else {
        // 戰敗
        updateCharacter(characterId, { hp: Math.floor(character.maxHp * 0.3) });

        return NextResponse.json({
          type: 'battle',
          victory: false,
          battleLog,
          characterHp: Math.floor(character.maxHp * 0.3),
        });
      }
    } else {
      // 安全通過，獲得少量獎勵
      const expGain = 5 + floor * 2;
      const goldGain = 3 + floor * 2;

      updateCharacter(characterId, { exp: character.exp + expGain });
      updateUserGold(character.userId, goldGain);

      const isLastFloor = floor >= dungeon.floors;

      return NextResponse.json({
        type: 'safe',
        message: `安全通過第 ${floor} 層！`,
        rewards: { exp: expGain, gold: goldGain },
        currentFloor: floor + 1,
        isLastFloor,
        dungeonComplete: isLastFloor,
      });
    }
  } catch (error) {
    console.error('Dungeon error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
