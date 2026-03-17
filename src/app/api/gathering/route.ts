import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 採集
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, nodeId } = body;

    const character = await db.character.findUnique({
      where: { id: characterId },
    });

    const node = await db.gatheringNode.findUnique({
      where: { id: nodeId },
      include: {
        drops: {
          include: { item: true },
        },
      },
    });

    if (!character || !node) {
      return NextResponse.json({ error: '角色或採集點不存在' }, { status: 400 });
    }

    if (character.level < node.levelRequired) {
      return NextResponse.json({ error: `需要等級 ${node.levelRequired}` }, { status: 400 });
    }

    // 計算掉落
    const drops: { item: any; quantity: number }[] = [];
    for (const drop of node.drops) {
      if (Math.random() < drop.dropRate) {
        const quantity = Math.floor(
          Math.random() * (drop.maxQuantity - drop.minQuantity + 1) + drop.minQuantity
        );
        drops.push({ item: drop.item, quantity });
      }
    }

    // 獲得少量經驗
    const expGain = 2 + Math.floor(Math.random() * 3);

    // 更新角色經驗
    let newExp = character.exp + expGain;
    let newLevel = character.level;
    const expNeeded = character.level * 100;

    if (newExp >= expNeeded) {
      newLevel++;
      newExp -= expNeeded;
    }

    await db.character.update({
      where: { id: characterId },
      data: { exp: newExp, level: newLevel },
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
      success: true,
      node: {
        id: node.id,
        name: node.name,
        type: node.gatheringType,
        icon: node.icon,
      },
      drops,
      expGain,
      levelUp: newLevel > character.level,
      newLevel,
    });
  } catch (error) {
    console.error('Gathering error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
