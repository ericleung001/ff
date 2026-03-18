import { NextRequest, NextResponse } from 'next/server';
import { getCharacterById, addInventoryItem } from '@/lib/game-data-neon';
import { gatheringNodesMap, itemsMap } from '@/lib/game-data-neon';

// 採集
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, nodeId } = body;

    const character = await getCharacterById(characterId);
    if (!character) {
      return NextResponse.json({ error: '角色不存在' }, { status: 400 });
    }

    const node = gatheringNodesMap.get(nodeId);
    if (!node) {
      return NextResponse.json({ error: '採集點不存在' }, { status: 400 });
    }

    // 檢查等級要求
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
        const item = itemsMap.get(drop.itemId);
        if (item && quantity > 0) {
          drops.push({ item, quantity });
          await addInventoryItem(characterId, drop.itemId, quantity);
        }
      }
    }

    return NextResponse.json({
      success: true,
      drops,
    });
  } catch (error) {
    console.error('Gathering error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
