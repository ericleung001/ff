import { NextRequest, NextResponse } from 'next/server';
import { getCharacterById, updateCharacter, addInventoryItem } from '@/lib/game-data';
import { gatheringNodesMap, itemsMap } from '@/lib/game-data';

// 採集
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, nodeId } = body;

    const character = getCharacterById(characterId);
    const node = gatheringNodesMap.get(nodeId);

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
        const item = itemsMap.get(drop.itemId);
        if (item) {
          drops.push({ item, quantity });
          addInventoryItem(characterId, drop.itemId, quantity);
        }
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

    updateCharacter(characterId, { exp: newExp, level: newLevel });

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
