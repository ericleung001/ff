import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// 初始化數據庫表 - 訪問 /api/setup-db 來執行
export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return NextResponse.json({ 
        error: 'DATABASE_URL 未設置',
        hint: '請在 Vercel 環境變量中設置 DATABASE_URL'
      }, { status: 500 });
    }

    const sql = neon(databaseUrl);

    console.log('Creating database tables...');

    // 創建用戶表
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        gold INTEGER DEFAULT 1000 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✓ users table created');

    // 創建角色表
    await sql`
      CREATE TABLE IF NOT EXISTS characters (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL REFERENCES users(id),
        name VARCHAR(100) NOT NULL,
        character_class VARCHAR(20) NOT NULL,
        level INTEGER DEFAULT 1 NOT NULL,
        exp INTEGER DEFAULT 0 NOT NULL,
        hp INTEGER DEFAULT 100 NOT NULL,
        max_hp INTEGER DEFAULT 100 NOT NULL,
        mp INTEGER DEFAULT 50 NOT NULL,
        max_mp INTEGER DEFAULT 50 NOT NULL,
        attack INTEGER DEFAULT 10 NOT NULL,
        defense INTEGER DEFAULT 5 NOT NULL,
        magic INTEGER DEFAULT 5 NOT NULL,
        speed INTEGER DEFAULT 5 NOT NULL,
        critical INTEGER DEFAULT 5 NOT NULL,
        current_area VARCHAR(50) DEFAULT 'village',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✓ characters table created');

    // 創建背包表
    await sql`
      CREATE TABLE IF NOT EXISTS inventory (
        id VARCHAR(50) PRIMARY KEY,
        character_id VARCHAR(50) NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
        item_id VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        equipped BOOLEAN DEFAULT FALSE,
        slot VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✓ inventory table created');

    // 創建市場列表表
    await sql`
      CREATE TABLE IF NOT EXISTS market_listings (
        id VARCHAR(50) PRIMARY KEY,
        seller_id VARCHAR(50) NOT NULL REFERENCES users(id),
        seller_name VARCHAR(100) NOT NULL,
        item_id VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL,
        price_per_unit INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✓ market_listings table created');

    // 創建房間表
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        is_public BOOLEAN DEFAULT TRUE,
        password VARCHAR(100),
        host_id VARCHAR(50) NOT NULL,
        host_name VARCHAR(100) NOT NULL,
        max_players INTEGER DEFAULT 4,
        players JSONB DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'waiting',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✓ rooms table created');

    // 創建索引以提升性能
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_inventory_character_id ON inventory(character_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_market_status ON market_listings(status)`;
      console.log('✓ indexes created');
    } catch (e) {
      console.log('Index creation skipped (may already exist)');
    }

    return NextResponse.json({
      success: true,
      message: '數據庫表創建成功！',
      tables: ['users', 'characters', 'inventory', 'market_listings', 'rooms'],
      indexes: ['idx_characters_user_id', 'idx_inventory_character_id', 'idx_market_status']
    });

  } catch (error: any) {
    console.error('Database setup error:', error);
    return NextResponse.json({
      error: '數據庫設置失敗',
      details: error.message,
      hint: '請確認 DATABASE_URL 是否正確'
    }, { status: 500 });
  }
}
