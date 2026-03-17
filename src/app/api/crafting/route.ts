import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 製作物品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, recipeId } = body;

    const character = await db.character.findUnique({
      where: { id: characterId },
    });

    const recipe = await db.craftingRecipe.findUnique({
      where: { id: recipeId },
      include: {
        resultItem: true,
        materials: {
          include: { item: true },
        },
      },
    });

    if (!character || !recipe) {
      return NextResponse.json({ error: '角色或配方不存在' }, { status: 400 });
    }

    if (character.level < recipe.requiredLevel) {
      return NextResponse.json({ error: `需要等級 ${recipe.requiredLevel}` }, { status: 400 });
    }

    // 檢查材料是否足夠
    const inventory = await db.inventory.findMany({
      where: { characterId, equipped: false },
      include: { item: true },
    });

    for (const material of recipe.materials) {
      const invItem = inventory.find(i => i.itemId === material.itemId);
      if (!invItem || invItem.quantity < material.quantity) {
        return NextResponse.json({
          error: `材料不足：需要 ${material.item.name} x${material.quantity}`,
        }, { status: 400 });
      }
    }

    // 扣除材料
    for (const material of recipe.materials) {
      const invItem = inventory.find(i => i.itemId === material.itemId)!;
      if (invItem.quantity === material.quantity) {
        await db.inventory.delete({ where: { id: invItem.id } });
      } else {
        await db.inventory.update({
          where: { id: invItem.id },
          data: { quantity: { decrement: material.quantity } },
        });
      }
    }

    // 添加成品
    const existingResult = await db.inventory.findFirst({
      where: { characterId, itemId: recipe.resultItemId, equipped: false },
    });

    if (existingResult) {
      await db.inventory.update({
        where: { id: existingResult.id },
        data: { quantity: { increment: recipe.resultQuantity } },
      });
    } else {
      await db.inventory.create({
        data: {
          characterId,
          itemId: recipe.resultItemId,
          quantity: recipe.resultQuantity,
        },
      });
    }

    // 獲得少量經驗
    const expGain = 5 + recipe.requiredLevel * 2;
    await db.character.update({
      where: { id: characterId },
      data: { exp: { increment: expGain } },
    });

    return NextResponse.json({
      success: true,
      crafted: {
        item: recipe.resultItem,
        quantity: recipe.resultQuantity,
      },
      expGain,
    });
  } catch (error) {
    console.error('Crafting error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
