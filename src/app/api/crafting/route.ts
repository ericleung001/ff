import { NextRequest, NextResponse } from 'next/server';
import { 
  getCharacterById, 
  getInventoryItemQuantity, 
  removeInventoryItem, 
  addInventoryItem 
} from '@/lib/game-data-neon';
import { recipesMap, itemsMap } from '@/lib/game-data-neon';

// 製作
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, recipeId } = body;

    const character = await getCharacterById(characterId);
    if (!character) {
      return NextResponse.json({ error: '角色不存在' }, { status: 400 });
    }

    const recipe = recipesMap.get(recipeId);
    if (!recipe) {
      return NextResponse.json({ error: '配方不存在' }, { status: 400 });
    }

    // 檢查等級要求
    if (character.level < recipe.requiredLevel) {
      return NextResponse.json({ error: `需要等級 ${recipe.requiredLevel}` }, { status: 400 });
    }

    // 檢查材料
    for (const material of recipe.materials) {
      const quantity = await getInventoryItemQuantity(characterId, material.itemId);
      if (quantity < material.quantity) {
        const item = itemsMap.get(material.itemId);
        return NextResponse.json({ 
          error: `材料不足：${item?.name || material.itemId} 需要 ${material.quantity}，只有 ${quantity}` 
        }, { status: 400 });
      }
    }

    // 扣除材料
    for (const material of recipe.materials) {
      await removeInventoryItem(characterId, material.itemId, material.quantity);
    }

    // 添加成品
    await addInventoryItem(characterId, recipe.resultItemId, recipe.resultQuantity);

    const resultItem = itemsMap.get(recipe.resultItemId);

    return NextResponse.json({
      success: true,
      crafted: {
        item: resultItem,
        quantity: recipe.resultQuantity,
      },
    });
  } catch (error) {
    console.error('Crafting error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
