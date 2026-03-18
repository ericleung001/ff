// Neon Postgres 數據操作
import { neon } from '@neondatabase/serverless';
import { items, itemsMap } from './game-data/items';
import { monsters, monstersMap } from './game-data/monsters';
import { dungeons, dungeonsMap } from './game-data/dungeons';
import { gatheringNodes, gatheringNodesMap } from './game-data/gathering';
import { recipes, recipesMap } from './game-data/recipes';

// 導出遊戲靜態數據
export { items, itemsMap, monsters, monstersMap, dungeons, dungeonsMap, gatheringNodes, gatheringNodesMap, recipes, recipesMap };

// 數據庫連接
const getSql = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  return neon(databaseUrl);
};

// ==================== 工具函數 ====================
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== 用戶操作 ====================
export async function createUser(email: string, password: string, name: string) {
  const sql = getSql();
  const id = generateId();
  
  await sql`
    INSERT INTO users (id, email, password, name, gold)
    VALUES (${id}, ${email}, ${password}, ${name}, 1000)
  `;
  
  return { id, email, name, gold: 1000 };
}

export async function getUserById(id: string) {
  const sql = getSql();
  const result = await sql`SELECT * FROM users WHERE id = ${id}`;
  if (!result[0]) return null;
  
  const row = result[0];
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    name: row.name,
    gold: row.gold,
  };
}

export async function getUserByEmail(email: string) {
  const sql = getSql();
  const result = await sql`SELECT * FROM users WHERE email = ${email}`;
  if (!result[0]) return null;
  
  const row = result[0];
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    name: row.name,
    gold: row.gold,
  };
}

export async function updateUserGold(userId: string, amount: number) {
  const sql = getSql();
  await sql`UPDATE users SET gold = gold + ${amount} WHERE id = ${userId}`;
}

// ==================== 角色操作 ====================
const classStats = {
  WARRIOR: { hp: 150, mp: 30, attack: 15, defense: 10, magic: 3, speed: 8, critical: 5 },
  MAGE: { hp: 80, mp: 100, attack: 5, defense: 3, magic: 18, speed: 6, critical: 3 },
  ARCHER: { hp: 100, mp: 50, attack: 12, defense: 5, magic: 5, speed: 15, critical: 10 },
};

export async function createCharacter(userId: string, name: string, characterClass: 'WARRIOR' | 'MAGE' | 'ARCHER') {
  const sql = getSql();
  const id = generateId();
  const stats = classStats[characterClass];
  
  await sql`
    INSERT INTO characters (
      id, user_id, name, character_class, level, exp,
      hp, max_hp, mp, max_mp, attack, defense, magic, speed, critical, current_area
    ) VALUES (
      ${id}, ${userId}, ${name}, ${characterClass}, 1, 0,
      ${stats.hp}, ${stats.hp}, ${stats.mp}, ${stats.mp},
      ${stats.attack}, ${stats.defense}, ${stats.magic}, ${stats.speed}, ${stats.critical}, 'village'
    )
  `;
  
  return getCharacterById(id);
}

export async function getCharactersByUserId(userId: string) {
  const sql = getSql();
  const results = await sql`SELECT * FROM characters WHERE user_id = ${userId}`;
  
  return results.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    characterClass: row.character_class,
    level: row.level,
    exp: row.exp,
    hp: row.hp,
    maxHp: row.max_hp,
    mp: row.mp,
    maxMp: row.max_mp,
    attack: row.attack,
    defense: row.defense,
    magic: row.magic,
    speed: row.speed,
    critical: row.critical,
    currentArea: row.current_area,
  }));
}

export async function getCharacterById(id: string) {
  const sql = getSql();
  const result = await sql`SELECT * FROM characters WHERE id = ${id}`;
  
  if (!result[0]) return null;
  
  const row = result[0];
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    characterClass: row.character_class,
    level: row.level,
    exp: row.exp,
    hp: row.hp,
    maxHp: row.max_hp,
    mp: row.mp,
    maxMp: row.max_mp,
    attack: row.attack,
    defense: row.defense,
    magic: row.magic,
    speed: row.speed,
    critical: row.critical,
    currentArea: row.current_area,
  };
}

export async function updateCharacter(id: string, updates: Record<string, any>) {
  const sql = getSql();
  
  // 字段名映射 (駝峰 -> 蛇形)
  const fieldMap: Record<string, string> = {
    maxHp: 'max_hp',
    maxMp: 'max_mp',
    currentArea: 'current_area',
    characterClass: 'character_class',
    userId: 'user_id',
  };
  
  for (const [key, value] of Object.entries(updates)) {
    const dbKey = fieldMap[key] || key;
    try {
      // 使用條件語句來避免動態字段名問題
      if (dbKey === 'max_hp') {
        await sql`UPDATE characters SET max_hp = ${value} WHERE id = ${id}`;
      } else if (dbKey === 'max_mp') {
        await sql`UPDATE characters SET max_mp = ${value} WHERE id = ${id}`;
      } else if (dbKey === 'current_area') {
        await sql`UPDATE characters SET current_area = ${value} WHERE id = ${id}`;
      } else if (dbKey === 'hp') {
        await sql`UPDATE characters SET hp = ${value} WHERE id = ${id}`;
      } else if (dbKey === 'mp') {
        await sql`UPDATE characters SET mp = ${value} WHERE id = ${id}`;
      } else if (dbKey === 'exp') {
        await sql`UPDATE characters SET exp = ${value} WHERE id = ${id}`;
      } else if (dbKey === 'level') {
        await sql`UPDATE characters SET level = ${value} WHERE id = ${id}`;
      } else if (dbKey === 'attack') {
        await sql`UPDATE characters SET attack = ${value} WHERE id = ${id}`;
      } else if (dbKey === 'defense') {
        await sql`UPDATE characters SET defense = ${value} WHERE id = ${id}`;
      } else if (dbKey === 'magic') {
        await sql`UPDATE characters SET magic = ${value} WHERE id = ${id}`;
      } else if (dbKey === 'speed') {
        await sql`UPDATE characters SET speed = ${value} WHERE id = ${id}`;
      } else if (dbKey === 'critical') {
        await sql`UPDATE characters SET critical = ${value} WHERE id = ${id}`;
      } else if (dbKey === 'name') {
        await sql`UPDATE characters SET name = ${value} WHERE id = ${id}`;
      } else {
        console.warn(`Unknown field to update: ${dbKey}`);
      }
    } catch (e) {
      console.error(`Failed to update ${dbKey}:`, e);
    }
  }
  
  return getCharacterById(id);
}

export async function deleteCharacter(id: string) {
  const sql = getSql();
  
  // 先刪除相關背包物品
  await sql`DELETE FROM inventory WHERE character_id = ${id}`;
  
  // 再刪除角色
  await sql`DELETE FROM characters WHERE id = ${id}`;
}

export async function getCharacterCount(userId: string) {
  const sql = getSql();
  const result = await sql`SELECT COUNT(*) as count FROM characters WHERE user_id = ${userId}`;
  return parseInt(result[0]?.count || '0');
}

// ==================== 背包操作 ====================
export async function getInventoryByCharacterId(characterId: string) {
  const sql = getSql();
  const results = await sql`SELECT * FROM inventory WHERE character_id = ${characterId}`;
  
  return results.map((row: any) => ({
    id: row.id,
    characterId: row.character_id,
    itemId: row.item_id,
    quantity: row.quantity,
    equipped: row.equipped,
    slot: row.slot,
  }));
}

export async function addInventoryItem(characterId: string, itemId: string, quantity: number = 1) {
  const sql = getSql();
  
  // 檢查是否已有相同物品
  const existing = await sql`
    SELECT * FROM inventory 
    WHERE character_id = ${characterId} AND item_id = ${itemId} AND equipped = false
  `;
  
  if (existing.length > 0) {
    const item = existing[0];
    const newQty = item.quantity + quantity;
    await sql`UPDATE inventory SET quantity = ${newQty} WHERE id = ${item.id}`;
    return {
      id: item.id,
      characterId,
      itemId,
      quantity: newQty,
      equipped: false,
    };
  }
  
  const id = generateId();
  await sql`
    INSERT INTO inventory (id, character_id, item_id, quantity, equipped)
    VALUES (${id}, ${characterId}, ${itemId}, ${quantity}, false)
  `;
  
  return { id, characterId, itemId, quantity, equipped: false };
}

export async function removeInventoryItem(characterId: string, itemId: string, quantity: number) {
  const sql = getSql();
  
  const existing = await sql`
    SELECT * FROM inventory 
    WHERE character_id = ${characterId} AND item_id = ${itemId} AND equipped = false
  `;
  
  if (existing.length === 0 || existing[0].quantity < quantity) return false;
  
  const item = existing[0];
  
  if (item.quantity === quantity) {
    await sql`DELETE FROM inventory WHERE id = ${item.id}`;
  } else {
    const newQty = item.quantity - quantity;
    await sql`UPDATE inventory SET quantity = ${newQty} WHERE id = ${item.id}`;
  }
  
  return true;
}

export async function getInventoryItemQuantity(characterId: string, itemId: string) {
  const sql = getSql();
  
  const existing = await sql`
    SELECT * FROM inventory 
    WHERE character_id = ${characterId} AND item_id = ${itemId} AND equipped = false
  `;
  
  return existing[0]?.quantity || 0;
}

// ==================== 市場操作 ====================
export async function createMarketListing(sellerId: string, sellerName: string, itemId: string, quantity: number, pricePerUnit: number) {
  const sql = getSql();
  const id = generateId();
  
  await sql`
    INSERT INTO market_listings (id, seller_id, seller_name, item_id, quantity, price_per_unit, status)
    VALUES (${id}, ${sellerId}, ${sellerName}, ${itemId}, ${quantity}, ${pricePerUnit}, 'active')
  `;
  
  return { 
    id, 
    sellerId, 
    sellerName, 
    itemId, 
    quantity, 
    pricePerUnit, 
    status: 'active' 
  };
}

export async function getActiveMarketListings() {
  const sql = getSql();
  const results = await sql`SELECT * FROM market_listings WHERE status = 'active'`;
  
  return results.map((row: any) => ({
    id: row.id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    itemId: row.item_id,
    quantity: row.quantity,
    pricePerUnit: row.price_per_unit,
    status: row.status,
  }));
}

export async function getMarketListingById(id: string) {
  const sql = getSql();
  const result = await sql`SELECT * FROM market_listings WHERE id = ${id}`;
  
  if (!result[0]) return null;
  
  const row = result[0];
  return {
    id: row.id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    itemId: row.item_id,
    quantity: row.quantity,
    pricePerUnit: row.price_per_unit,
    status: row.status,
  };
}

export async function updateMarketListing(id: string, updates: Record<string, any>) {
  const sql = getSql();
  
  const fieldMap: Record<string, string> = {
    sellerId: 'seller_id',
    sellerName: 'seller_name',
    itemId: 'item_id',
    pricePerUnit: 'price_per_unit',
  };
  
  for (const [key, value] of Object.entries(updates)) {
    const dbKey = fieldMap[key] || key;
    // 使用條件語句來避免動態字段名問題
    if (dbKey === 'seller_id') {
      await sql`UPDATE market_listings SET seller_id = ${value} WHERE id = ${id}`;
    } else if (dbKey === 'seller_name') {
      await sql`UPDATE market_listings SET seller_name = ${value} WHERE id = ${id}`;
    } else if (dbKey === 'item_id') {
      await sql`UPDATE market_listings SET item_id = ${value} WHERE id = ${id}`;
    } else if (dbKey === 'price_per_unit') {
      await sql`UPDATE market_listings SET price_per_unit = ${value} WHERE id = ${id}`;
    } else if (dbKey === 'quantity') {
      await sql`UPDATE market_listings SET quantity = ${value} WHERE id = ${id}`;
    } else if (dbKey === 'status') {
      await sql`UPDATE market_listings SET status = ${value} WHERE id = ${id}`;
    } else {
      console.warn(`Unknown field to update: ${dbKey}`);
    }
  }
  
  return getMarketListingById(id);
}
