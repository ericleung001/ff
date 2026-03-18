import { NextRequest, NextResponse } from 'next/server';
import { getCharacterById, updateCharacter, getInventoryItemQuantity, removeInventoryItem, addInventoryItem } from '@/lib/game-data';
import { recipesMap, itemsMap } from '@/lib/game-data';

// 製作物品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, recipeId } = body;

    const character = getCharacterById(characterId);
    const recipe = recipesMap.get(recipeId);

    if (!character || !recipe) {
      return NextResponse.json({ error: '角色或配方不存在' }, { status: 400 });
    }

    if (character.level < recipe.requiredLevel) {
      return NextResponse.json({ error: `需要等級 ${recipe.requiredLevel}` }, { status: 400 });
    }

    // 檢查材料是否足夠
    for (const material of recipe.materials) {
      const quantity = getInventoryItemQuantity(characterId, material.itemId);
      if (quantity < material.quantity) {
        const item = itemsMap.get(material.itemId);
        return NextResponse.json({
          error: `材料不足：需要 ${item?.name || material.itemId} x${material.quantity}`,
        }, { status: 400 });
      }
    }

    // 扣除材料
    for (const material of recipe.materials) {
      removeInventoryItem(characterId, material.itemId, material.quantity);
    }

    // 添加成品
    addInventoryItem(characterId, recipe.resultItemId, recipe.resultQuantity);

    // 獲得少量經驗
    const expGain = 5 + recipe.requiredLevel * 2;
    updateCharacter(characterId, { exp: character.exp + expGain });

    const resultItem = itemsMap.get(recipe.resultItemId);

    return NextResponse.json({
      success: true,
      crafted: {
        item: resultItem,
        quantity: recipe.resultQuantity,
      },
      expGain,
    });
  } catch (error) {
    console.error('Crafting error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
