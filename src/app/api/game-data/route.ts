import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 獲取遊戲數據
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const characterId = searchParams.get('characterId');

    if (type === 'monsters') {
      const monsters = await db.monster.findMany({
        include: { drops: { include: { item: true } } },
      });
      return NextResponse.json(monsters);
    }

    if (type === 'dungeons') {
      const dungeons = await db.dungeon.findMany({
        include: {
          monsters: { include: { monster: true } },
        },
      });
      return NextResponse.json(dungeons);
    }

    if (type === 'recipes') {
      const recipes = await db.craftingRecipe.findMany({
        include: {
          resultItem: true,
          materials: { include: { item: true } },
        },
      });
      return NextResponse.json(recipes);
    }

    if (type === 'gathering-nodes') {
      const nodes = await db.gatheringNode.findMany({
        include: { drops: { include: { item: true } } },
      });
      return NextResponse.json(nodes);
    }

    if (type === 'items') {
      const items = await db.itemTemplate.findMany();
      return NextResponse.json(items);
    }

    if (type === 'inventory' && characterId) {
      const inventory = await db.inventory.findMany({
        where: { characterId },
        include: { item: true },
      });
      return NextResponse.json(inventory);
    }

    if (type === 'user' && userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, gold: true },
      });
      return NextResponse.json(user);
    }

    return NextResponse.json({ error: '無效的請求' }, { status: 400 });
  } catch (error) {
    console.error('Get game data error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
