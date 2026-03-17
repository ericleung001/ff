import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 迷宮探險
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, dungeonId, floor } = body;

    const character = await db.character.findUnique({
      where: { id: characterId },
      include: {
        inventory: {
          where: { equipped: true },
          include: { item: true },
        },
      },
    });

    const dungeon = await db.dungeon.findUnique({
      where: { id: dungeonId },
      include: {
        monsters: {
          include: { monster: true },
        },
      },
    });

    if (!character || !dungeon) {
      return NextResponse.json({ error: '角色或迷宮不存在' }, { status: 400 });
    }

    if (character.level < dungeon.levelRequired) {
      return NextResponse.json({ error: `需要等級 ${dungeon.levelRequired}` }, { status: 400 });
    }

    // 計算裝備加成
    let totalAttack = character.attack;
    let totalDefense = character.defense;

    for (const inv of character.inventory) {
      totalAttack += inv.item.attackBonus;
      totalDefense += inv.item.defenseBonus;
    }

    // 找出這層可能出現的怪物
    const possibleMonsters = dungeon.monsters.filter(
      m => floor >= m.minFloor && floor <= m.maxFloor
    );

    // 決定是否遇到怪物
    let encounter = null;
    if (possibleMonsters.length > 0) {
      const totalSpawnRate = possibleMonsters.reduce((sum, m) => sum + m.spawnRate, 0);
      if (Math.random() < totalSpawnRate) {
        // 隨機選擇怪物
        let random = Math.random() * totalSpawnRate;
        for (const m of possibleMonsters) {
          random -= m.spawnRate;
          if (random <= 0) {
            encounter = m.monster;
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
        const expGain = Math.floor(encounter.expReward * 1.5); // 迷宮獎勵加成
        const goldGain = Math.floor(encounter.goldReward * 1.5);

        // 獲取怪物掉落
        const monsterWithDrops = await db.monster.findUnique({
          where: { id: encounter.id },
          include: { drops: { include: { item: true } } },
        });

        const drops: { item: any; quantity: number }[] = [];
        if (monsterWithDrops) {
          for (const drop of monsterWithDrops.drops) {
            if (Math.random() < drop.dropRate) {
              const quantity = Math.floor(
                Math.random() * (drop.maxQuantity - drop.minQuantity + 1) + drop.minQuantity
              );
              drops.push({ item: drop.item, quantity });
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

        await db.character.update({
          where: { id: characterId },
          data: { hp: characterHp, exp: newExp, level: newLevel },
        });

        await db.user.update({
          where: { id: character.userId },
          data: { gold: { increment: goldGain } },
        });

        // 添加掉落物品
        for (const drop of drops) {
          const existingItem = await db.inventory.findFirst({
            where: { characterId, itemId: drop.item.id, equipped: false },
          });

          if (existingItem) {
            await db.inventory.update({
              where: { id: existingItem.id },
              data: { quantity: { increment: drop.quantity } },
            });
          } else {
            await db.inventory.create({
              data: { characterId, itemId: drop.item.id, quantity: drop.quantity },
            });
          }
        }

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
        await db.character.update({
          where: { id: characterId },
          data: { hp: Math.floor(character.maxHp * 0.3) },
        });

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

      await db.character.update({
        where: { id: characterId },
        data: { exp: { increment: expGain } },
      });

      await db.user.update({
        where: { id: character.userId },
        data: { gold: { increment: goldGain } },
      });

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
