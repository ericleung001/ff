import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 單人戰鬥
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, monsterId } = body;

    // 獲取角色和怪物數據
    const character = await db.character.findUnique({
      where: { id: characterId },
      include: {
        inventory: {
          where: { equipped: true },
          include: { item: true },
        },
      },
    });

    const monster = await db.monster.findUnique({
      where: { id: monsterId },
      include: {
        drops: {
          include: { item: true },
        },
      },
    });

    if (!character || !monster) {
      return NextResponse.json({ error: '角色或怪物不存在' }, { status: 400 });
    }

    // 計算裝備加成
    let totalAttack = character.attack;
    let totalDefense = character.defense;
    let totalHp = character.maxHp;

    for (const inv of character.inventory) {
      totalAttack += inv.item.attackBonus;
      totalDefense += inv.item.defenseBonus;
      totalHp += inv.item.hpBonus;
    }

    // 模擬戰鬥
    const battleLog: string[] = [];
    let characterHp = character.hp;
    let monsterHp = monster.hp;

    battleLog.push(`⚔️ 戰鬥開始！${character.name} VS ${monster.icon} ${monster.name}`);

    let turn = 1;
    while (characterHp > 0 && monsterHp > 0 && turn <= 20) {
      // 角色攻擊
      const playerDamage = Math.max(1, totalAttack - monster.defense + Math.floor(Math.random() * 5));
      monsterHp = Math.max(0, monsterHp - playerDamage);
      battleLog.push(`回合 ${turn}: ${character.name} 造成 ${playerDamage} 傷害`);

      if (monsterHp <= 0) {
        battleLog.push(`🎉 ${monster.name} 被擊敗！`);
        break;
      }

      // 怪物攻擊
      const monsterDamage = Math.max(1, monster.attack - totalDefense + Math.floor(Math.random() * 3));
      characterHp = Math.max(0, characterHp - monsterDamage);
      battleLog.push(`回合 ${turn}: ${monster.name} 造成 ${monsterDamage} 傷害`);

      if (characterHp <= 0) {
        battleLog.push(`💀 ${character.name} 被擊敗...`);
        break;
      }

      turn++;
    }

    const victory = monsterHp <= 0;

    if (victory) {
      // 計算經驗和金幣
      const expGain = monster.expReward;
      const goldGain = monster.goldReward;

      // 計算掉落
      const drops: { item: any; quantity: number }[] = [];
      for (const drop of monster.drops) {
        if (Math.random() < drop.dropRate) {
          const quantity = Math.floor(
            Math.random() * (drop.maxQuantity - drop.minQuantity + 1) + drop.minQuantity
          );
          drops.push({ item: drop.item, quantity });
        }
      }

      // 更新角色數據
      let newExp = character.exp + expGain;
      let newLevel = character.level;
      let newMaxHp = character.maxHp;
      let newAttack = character.attack;
      let newDefense = character.defense;
      let newMagic = character.magic;
      let newSpeed = character.speed;

      // 升級檢查
      const expNeeded = character.level * 100;
      if (newExp >= expNeeded) {
        newLevel++;
        newExp -= expNeeded;
        newMaxHp += 10;
        newAttack += 2;
        newDefense += 1;
        newMagic += 1;
        newSpeed += 1;
        battleLog.push(`🎊 升級了！現在是 Lv.${newLevel}`);
      }

      // 更新角色
      await db.character.update({
        where: { id: characterId },
        data: {
          hp: characterHp,
          exp: newExp,
          level: newLevel,
          maxHp: newMaxHp,
          attack: newAttack,
          defense: newDefense,
          magic: newMagic,
          speed: newSpeed,
        },
      });

      // 更新用戶金幣
      await db.user.update({
        where: { id: character.userId },
        data: { gold: { increment: goldGain } },
      });

      // 添加物品到背包
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
            data: {
              characterId,
              itemId: drop.item.id,
              quantity: drop.quantity,
            },
          });
        }
      }

      return NextResponse.json({
        victory: true,
        battleLog,
        rewards: {
          exp: expGain,
          gold: goldGain,
          drops,
          levelUp: newLevel > character.level,
          newLevel,
        },
        characterHp,
      });
    } else {
      // 戰敗，恢復一些 HP
      await db.character.update({
        where: { id: characterId },
        data: { hp: Math.floor(character.maxHp * 0.3) },
      });

      return NextResponse.json({
        victory: false,
        battleLog,
        characterHp: Math.floor(character.maxHp * 0.3),
      });
    }
  } catch (error) {
    console.error('Battle error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
