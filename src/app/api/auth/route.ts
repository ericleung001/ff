import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/game-data-neon';

// 註冊 / 登入
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, name } = body;

    if (action === 'register') {
      // 檢查 email 是否已存在
      const existing = await getUserByEmail(email);
      if (existing) {
        return NextResponse.json({ error: '此電子郵件已被註冊' }, { status: 400 });
      }

      // 創建新用戶
      const user = await createUser(email, password, name || '冒險者');
      
      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        gold: user.gold,
      });
    }

    if (action === 'login') {
      const user = await getUserByEmail(email);
      if (!user || user.password !== password) {
        return NextResponse.json({ error: '電子郵件或密碼錯誤' }, { status: 401 });
      }

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        gold: user.gold,
      });
    }

    return NextResponse.json({ error: '無效的操作' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
