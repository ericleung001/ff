import { NextRequest, NextResponse } from 'next/server';
import { 
  items, 
  monsters, 
  dungeons, 
  gatheringNodes, 
  recipes,
  itemsMap,
  getUserById,
  getInventoryByCharacterId
} from '@/lib/game-data-neon';

// 獲取遊戲數據
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const characterId = searchParams.get('characterId');

    if (type === 'monsters') {
      return NextResponse.json(monsters);
    }

    if (type === 'dungeons') {
      return NextResponse.json(dungeons);
    }

    if (type === 'recipes') {
      const recipesWithItems = recipes.map(r => ({
        ...r,
        resultItem: itemsMap.get(r.resultItemId),
        materials: r.materials.map(m => ({
          ...m,
          item: itemsMap.get(m.itemId),
        })),
      }));
      return NextResponse.json(recipesWithItems);
    }

    if (type === 'gathering-nodes') {
      const nodesWithItems = gatheringNodes.map(n => ({
        ...n,
        drops: n.drops.map(d => ({
          ...d,
          item: itemsMap.get(d.itemId),
        })),
      }));
      return NextResponse.json(nodesWithItems);
    }

    if (type === 'items') {
      return NextResponse.json(items);
    }

    if (type === 'inventory' && characterId) {
      const inventoryItems = await getInventoryByCharacterId(characterId);
      return NextResponse.json(inventoryItems.map(inv => ({
        ...inv,
        item: itemsMap.get(inv.itemId),
      })));
    }

    if (type === 'user' && userId) {
      const user = await getUserById(userId);
      if (!user) {
        return NextResponse.json({ error: '用戶不存在' }, { status: 404 });
      }
      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        gold: user.gold,
      });
    }

    return NextResponse.json({ error: '無效的請求' }, { status: 400 });
  } catch (error: any) {
    console.error('Get game data error:', error);
    return NextResponse.json({ error: error.message || '伺服器錯誤' }, { status: 500 });
  }
}
