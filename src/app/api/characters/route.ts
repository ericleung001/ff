import { NextRequest, NextResponse } from 'next/server';
import { 
  createCharacter, 
  getCharactersByUserId, 
  getCharacterById, 
  updateCharacter, 
  deleteCharacter, 
  getCharacterCount 
} from '@/lib/game-data-neon';

// 獲取用戶角色 / 創建角色 / 刪除角色 / 更新角色
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const characterId = searchParams.get('characterId');

    if (characterId) {
      const character = await getCharacterById(characterId);
      if (!character) {
        return NextResponse.json({ error: '角色不存在' }, { status: 404 });
      }
      return NextResponse.json(character);
    }

    if (userId) {
      const chars = await getCharactersByUserId(userId);
      return NextResponse.json(chars);
    }

    return NextResponse.json({ error: '缺少參數' }, { status: 400 });
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
    const count = await getCharacterCount(userId);
    if (count >= 3) {
      return NextResponse.json({ error: '每個帳號最多只能創建 3 個角色' }, { status: 400 });
    }

    // 創建角色
    const character = await createCharacter(userId, name, characterClass);
    
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

    const character = await updateCharacter(characterId, updates);
    if (!character) {
      return NextResponse.json({ error: '角色不存在' }, { status: 404 });
    }

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

    await deleteCharacter(characterId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete character error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
