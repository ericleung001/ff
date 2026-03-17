import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 獲取用戶角色 / 創建角色
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: '缺少用戶ID' }, { status: 400 });
    }

    const characters = await db.character.findMany({
      where: { userId },
      include: {
        inventory: {
          include: { item: true },
        },
      },
    });

    return NextResponse.json(characters);
  } catch (error) {
    console.error('Get characters error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, characterClass } = body;

    // 檢查角色數量限制
    const existingCharacters = await db.character.count({
      where: { userId },
    });

    if (existingCharacters >= 3) {
      return NextResponse.json({ error: '每個帳號最多只能創建3個角色' }, { status: 400 });
    }

    // 檢查角色名是否重複
    const existingName = await db.character.findFirst({
      where: { userId, name },
    });

    if (existingName) {
      return NextResponse.json({ error: '角色名稱已存在' }, { status: 400 });
    }

    // 根據職業設置基礎屬性
    const classStats = {
      WARRIOR: { hp: 150, mp: 30, attack: 15, defense: 10, magic: 3, speed: 8, critical: 0.05 },
      MAGE: { hp: 80, mp: 100, attack: 5, defense: 3, magic: 18, speed: 6, critical: 0.03 },
      ARCHER: { hp: 100, mp: 50, attack: 12, defense: 5, magic: 5, speed: 15, critical: 0.1 },
    };

    const stats = classStats[characterClass as keyof typeof classStats] || classStats.WARRIOR;

    const character = await db.character.create({
      data: {
        userId,
        name,
        characterClass,
        level: 1,
        exp: 0,
        hp: stats.hp,
        maxHp: stats.hp,
        mp: stats.mp,
        maxMp: stats.mp,
        attack: stats.attack,
        defense: stats.defense,
        magic: stats.magic,
        speed: stats.speed,
        critical: stats.critical,
        currentArea: 'village',
      },
    });

    return NextResponse.json(character);
  } catch (error) {
    console.error('Create character error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId, updates } = body;

    const character = await db.character.update({
      where: { id: characterId },
      data: updates,
    });

    return NextResponse.json(character);
  } catch (error) {
    console.error('Update character error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get('characterId');

    if (!characterId) {
      return NextResponse.json({ error: '缺少角色ID' }, { status: 400 });
    }

    await db.character.delete({
      where: { id: characterId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete character error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
