import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash, verify } from '@/lib/auth';

// 註冊/登入
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, name } = body;

    if (action === 'register') {
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json({ error: '此信箱已被註冊' }, { status: 400 });
      }

      const hashedPassword = await hash(password);
      const user = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          gold: 1000,
        },
      });

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        gold: user.gold,
      });
    }

    if (action === 'login') {
      const user = await db.user.findUnique({
        where: { email },
      });

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
