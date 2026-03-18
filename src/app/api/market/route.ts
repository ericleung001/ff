import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserById, 
  updateUserGold, 
  removeInventoryItem, 
  addInventoryItem,
  getActiveMarketListings,
  createMarketListing,
  getMarketListingById,
  updateMarketListing
} from '@/lib/game-data-neon';
import { itemsMap } from '@/lib/game-data-neon';

// 獲取市場列表
export async function GET() {
  try {
    const listings = await getActiveMarketListings();
    
    return NextResponse.json(listings.map(l => ({
      ...l,
      item: itemsMap.get(l.itemId),
    })));
  } catch (error: any) {
    console.error('Get market error:', error);
    return NextResponse.json({ error: error.message || '伺服器錯誤' }, { status: 500 });
  }
}

// 出售 / 購買 / 取消
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, characterId, itemId, quantity, pricePerUnit, listingId } = body;

    if (action === 'sell') {
      const user = await getUserById(userId);
      if (!user) {
        return NextResponse.json({ error: '用戶不存在' }, { status: 400 });
      }

      // 從背包移除物品
      const removed = await removeInventoryItem(characterId, itemId, quantity);
      if (!removed) {
        return NextResponse.json({ error: '物品數量不足' }, { status: 400 });
      }

      // 上架
      const listing = await createMarketListing(userId, user.name, itemId, quantity, pricePerUnit);

      return NextResponse.json({ success: true, listing });
    }

    if (action === 'buy') {
      const listing = await getMarketListingById(listingId);
      if (!listing || listing.status !== 'active') {
        return NextResponse.json({ error: '商品不存在或已售出' }, { status: 400 });
      }

      if (listing.quantity < quantity) {
        return NextResponse.json({ error: '數量不足' }, { status: 400 });
      }

      const totalPrice = listing.pricePerUnit * quantity;

      // 檢查買家金幣
      const buyer = await getUserById(userId);
      if (!buyer || buyer.gold < totalPrice) {
        return NextResponse.json({ error: '金幣不足' }, { status: 400 });
      }

      // 扣除買家金幣
      await updateUserGold(userId, -totalPrice);

      // 增加賣家金幣
      await updateUserGold(listing.sellerId, totalPrice);

      // 添加物品到買家背包
      await addInventoryItem(characterId, listing.itemId, quantity);

      // 更新上架狀態
      if (listing.quantity === quantity) {
        await updateMarketListing(listingId, { status: 'sold' });
      } else {
        await updateMarketListing(listingId, { quantity: listing.quantity - quantity });
      }

      return NextResponse.json({ success: true, totalPrice });
    }

    if (action === 'cancel') {
      const listing = await getMarketListingById(listingId);

      if (!listing || listing.sellerId !== userId) {
        return NextResponse.json({ error: '無法取消' }, { status: 400 });
      }

      // 返還物品
      await addInventoryItem(characterId, listing.itemId, listing.quantity);
      await updateMarketListing(listingId, { status: 'cancelled' });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '無效的操作' }, { status: 400 });
  } catch (error: any) {
    console.error('Market error:', error);
    return NextResponse.json({ error: error.message || '伺服器錯誤' }, { status: 500 });
  }
}
