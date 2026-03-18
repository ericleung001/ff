import { neon } from '@neondatabase/serverless';

async function setupDatabase() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log('Creating tables...');

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
      hp INTEGER NOT NULL,
      max_hp INTEGER NOT NULL,
      mp INTEGER NOT NULL,
      max_mp INTEGER NOT NULL,
      attack INTEGER NOT NULL,
      defense INTEGER NOT NULL,
      magic INTEGER NOT NULL,
      speed INTEGER NOT NULL,
      critical INTEGER NOT NULL,
      current_area VARCHAR(50) DEFAULT 'village',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('✓ characters table created');

  // 創建背包表
  await sql`
    CREATE TABLE IF NOT EXISTS inventory (
      id VARCHAR(50) PRIMARY KEY,
      character_id VARCHAR(50) NOT NULL REFERENCES characters(id),
      item_id VARCHAR(50) NOT NULL,
      quantity INTEGER DEFAULT 1 NOT NULL,
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

  console.log('\n✅ Database setup complete!');
}

setupDatabase().catch(console.error);
