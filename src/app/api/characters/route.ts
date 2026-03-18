import { NextRequest, NextResponse } from 'next/server';
import { 
  getCharactersByUserId, 
  createCharacter, 
  updateCharacter, 
  deleteCharacter,
  getCharacterCount,
  getInventoryByCharacterId
} from '@/lib/game-data';
import { itemsMap } from '@/lib/game-data';

// 獲取用戶角色 / 創建角色
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: '缺少用戶ID' }, { status: 400 });
    }

    const characters = getCharactersByUserId(userId);
    
    // 添加背包信息
    const charactersWithInventory = characters.map(char => ({
      ...char,
      inventory: getInventoryByCharacterId(char.id).map(inv => ({
        ...inv,
        item: itemsMap.get(inv.itemId),
      })),
    }));

    return NextResponse.json(charactersWithInventory);
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
    const count = getCharacterCount(userId);
    if (count >= 3) {
      return NextResponse.json({ error: '每個帳號最多只能創建3個角色' }, { status: 400 });
    }

    // 創建角色
    const character = createCharacter(userId, name, characterClass);
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

    const character = updateCharacter(characterId, updates);
    if (!character) {
      return NextResponse.json({ error: '角色不存在' }, { status: 400 });
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

    deleteCharacter(characterId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete character error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
