import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 獲取市場列表 / 出售物品 / 購買物品
export async function GET(request: NextRequest) {
  try {
    const listings = await db.marketListing.findMany({
      where: { status: 'active' },
      include: {
        item: true,
        seller: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(listings);
  } catch (error) {
    console.error('Get market error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, characterId, itemId, quantity, pricePerUnit, listingId } = body;

    if (action === 'sell') {
      // 出售物品
      const inventory = await db.inventory.findFirst({
        where: { characterId, itemId, equipped: false },
      });

      if (!inventory || inventory.quantity < quantity) {
        return NextResponse.json({ error: '物品數量不足' }, { status: 400 });
      }

      // 從背包扣除
      if (inventory.quantity === quantity) {
        await db.inventory.delete({ where: { id: inventory.id } });
      } else {
        await db.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: quantity } },
        });
      }

      // 上架
      const listing = await db.marketListing.create({
        data: {
          sellerId: userId,
          itemId,
          quantity,
          pricePerUnit,
          status: 'active',
        },
        include: { item: true },
      });

      return NextResponse.json({ success: true, listing });
    }

    if (action === 'buy') {
      // 購買物品
      const listing = await db.marketListing.findUnique({
        where: { id: listingId },
        include: { item: true },
      });

      if (!listing || listing.status !== 'active') {
        return NextResponse.json({ error: '商品不存在或已售出' }, { status: 400 });
      }

      if (listing.quantity < quantity) {
        return NextResponse.json({ error: '數量不足' }, { status: 400 });
      }

      const totalPrice = listing.pricePerUnit * quantity;

      // 檢查買家金幣
      const buyer = await db.user.findUnique({ where: { id: userId } });
      if (!buyer || buyer.gold < totalPrice) {
        return NextResponse.json({ error: '金幣不足' }, { status: 400 });
      }

      // 扣除買家金幣
      await db.user.update({
        where: { id: userId },
        data: { gold: { decrement: totalPrice } },
      });

      // 增加賣家金幣
      await db.user.update({
        where: { id: listing.sellerId },
        data: { gold: { increment: totalPrice } },
      });

      // 添加物品到買家背包
      const existingItem = await db.inventory.findFirst({
        where: { characterId, itemId: listing.itemId, equipped: false },
      });

      if (existingItem) {
        await db.inventory.update({
          where: { id: existingItem.id },
          data: { quantity: { increment: quantity } },
        });
      } else {
        await db.inventory.create({
          data: { characterId, itemId: listing.itemId, quantity },
        });
      }

      // 更新上架狀態
      if (listing.quantity === quantity) {
        await db.marketListing.update({
          where: { id: listingId },
          data: { status: 'sold' },
        });
      } else {
        await db.marketListing.update({
          where: { id: listingId },
          data: { quantity: { decrement: quantity } },
        });
      }

      return NextResponse.json({ success: true, totalPrice });
    }

    if (action === 'cancel') {
      // 取消上架
      const listing = await db.marketListing.findUnique({
        where: { id: listingId },
      });

      if (!listing || listing.sellerId !== userId) {
        return NextResponse.json({ error: '無法取消' }, { status: 400 });
      }

      // 返還物品
      const existingItem = await db.inventory.findFirst({
        where: { characterId, itemId: listing.itemId, equipped: false },
      });

      if (existingItem) {
        await db.inventory.update({
          where: { id: existingItem.id },
          data: { quantity: { increment: listing.quantity } },
        });
      } else {
        await db.inventory.create({
          data: { characterId, itemId: listing.itemId, quantity: listing.quantity },
        });
      }

      await db.marketListing.update({
        where: { id: listingId },
        data: { status: 'cancelled' },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '無效的操作' }, { status: 400 });
  } catch (error) {
    console.error('Market error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
