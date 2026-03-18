import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/game-data';
import { hash, verify } from '@/lib/auth';

// 註冊/登入
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, name } = body;

    if (action === 'register') {
      const existingUser = getUserByEmail(email);

      if (existingUser) {
        return NextResponse.json({ error: '此信箱已被註冊' }, { status: 400 });
      }

      const hashedPassword = await hash(password);
      const user = createUser(email, hashedPassword, name);

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        gold: user.gold,
      });
    }

    if (action === 'login') {
      const user = getUserByEmail(email);

      if (!user) {
        return NextResponse.json({ error: '用戶不存在' }, { status: 400 });
      }

      const isValid = await verify(password, user.password);
      if (!isValid) {
        return NextResponse.json({ error: '密碼錯誤' }, { status: 400 });
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
