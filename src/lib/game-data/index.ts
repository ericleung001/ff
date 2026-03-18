// 內存數據存儲 - 用於 Vercel serverless 環境
import { items, itemsMap } from './items';
import { monsters, monstersMap } from './monsters';
import { dungeons, dungeonsMap } from './dungeons';
import { gatheringNodes, gatheringNodesMap } from './gathering';
import { recipes, recipesMap } from './recipes';

// ==================== 類型定義 ====================
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  gold: number;
}

export interface Character {
  id: string;
  userId: string;
  name: string;
  characterClass: 'WARRIOR' | 'MAGE' | 'ARCHER';
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  magic: number;
  speed: number;
  critical: number;
  currentArea: string;
}

export interface InventoryItem {
  id: string;
  characterId: string;
  itemId: string;
  quantity: number;
  equipped: boolean;
  slot: string | null;
}

export interface MarketListing {
  id: string;
  sellerId: string;
  sellerName: string;
  itemId: string;
  quantity: number;
  pricePerUnit: number;
  status: 'active' | 'sold' | 'cancelled';
}

// ==================== 內存存儲 ====================
// 使用 global 來在 serverless 環境中保持狀態
const globalForStore = global as unknown as {
  users: Map<string, User>;
  characters: Map<string, Character>;
  inventory: Map<string, InventoryItem>;
  marketListings: Map<string, MarketListing>;
  userEmailIndex: Map<string, string>; // email -> userId
  userCharactersIndex: Map<string, Set<string>>; // userId -> characterIds
  characterInventoryIndex: Map<string, Set<string>>; // characterId -> inventoryIds
};

// 初始化存儲
const users = globalForStore.users || new Map<string, User>();
const characters = globalForStore.characters || new Map<string, Character>();
const inventory = globalForStore.inventory || new Map<string, InventoryItem>();
const marketListings = globalForStore.marketListings || new Map<string, MarketListing>();
const userEmailIndex = globalForStore.userEmailIndex || new Map<string, string>();
const userCharactersIndex = globalForStore.userCharactersIndex || new Map<string, Set<string>>();
const characterInventoryIndex = globalForStore.characterInventoryIndex || new Map<string, Set<string>>();

// 保存到 global
if (process.env.NODE_ENV !== 'production') {
  globalForStore.users = users;
  globalForStore.characters = characters;
  globalForStore.inventory = inventory;
  globalForStore.marketListings = marketListings;
  globalForStore.userEmailIndex = userEmailIndex;
  globalForStore.userCharactersIndex = userCharactersIndex;
  globalForStore.characterInventoryIndex = characterInventoryIndex;
}

// ==================== 工具函數 ====================
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== 用戶操作 ====================
export function createUser(email: string, password: string, name: string): User {
  const id = generateId();
  const user: User = { id, email, password, name, gold: 1000 };
  users.set(id, user);
  userEmailIndex.set(email, id);
  userCharactersIndex.set(id, new Set());
  return user;
}

export function getUserById(id: string): User | null {
  return users.get(id) || null;
}

export function getUserByEmail(email: string): User | null {
  const userId = userEmailIndex.get(email);
  return userId ? users.get(userId) || null : null;
}

export function updateUserGold(userId: string, amount: number): void {
  const user = users.get(userId);
  if (user) {
    user.gold += amount;
    users.set(userId, user);
  }
}

// ==================== 角色操作 ====================
const classStats = {
  WARRIOR: { hp: 150, mp: 30, attack: 15, defense: 10, magic: 3, speed: 8, critical: 0.05 },
  MAGE: { hp: 80, mp: 100, attack: 5, defense: 3, magic: 18, speed: 6, critical: 0.03 },
  ARCHER: { hp: 100, mp: 50, attack: 12, defense: 5, magic: 5, speed: 15, critical: 0.1 },
};

export function createCharacter(userId: string, name: string, characterClass: 'WARRIOR' | 'MAGE' | 'ARCHER'): Character {
  const id = generateId();
  const stats = classStats[characterClass];
  
  const character: Character = {
    id,
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
  };
  
  characters.set(id, character);
  
  const userChars = userCharactersIndex.get(userId) || new Set();
  userChars.add(id);
  userCharactersIndex.set(userId, userChars);
  
  characterInventoryIndex.set(id, new Set());
  
  return character;
}

export function getCharactersByUserId(userId: string): Character[] {
  const charIds = userCharactersIndex.get(userId) || new Set();
  return Array.from(charIds).map(id => characters.get(id)!).filter(Boolean);
}

export function getCharacterById(id: string): Character | null {
  return characters.get(id) || null;
}

export function updateCharacter(id: string, updates: Partial<Character>): Character | null {
  const char = characters.get(id);
  if (!char) return null;
  const updated = { ...char, ...updates };
  characters.set(id, updated);
  return updated;
}

export function deleteCharacter(id: string): void {
  const char = characters.get(id);
  if (!char) return;
  
  // 刪除相關背包物品
  const invIds = characterInventoryIndex.get(id) || new Set();
  for (const invId of invIds) {
    inventory.delete(invId);
  }
  characterInventoryIndex.delete(id);
  
  // 從用戶索引中移除
  const userChars = userCharactersIndex.get(char.userId);
  if (userChars) {
    userChars.delete(id);
  }
  
  characters.delete(id);
}

export function getCharacterCount(userId: string): number {
  return (userCharactersIndex.get(userId) || new Set()).size;
}

// ==================== 背包操作 ====================
export function getInventoryByCharacterId(characterId: string): InventoryItem[] {
  const invIds = characterInventoryIndex.get(characterId) || new Set();
  return Array.from(invIds).map(id => inventory.get(id)!).filter(Boolean);
}

export function addInventoryItem(characterId: string, itemId: string, quantity: number = 1): InventoryItem {
  // 檢查是否已有相同物品
  const existing = Array.from(inventory.values()).find(
    i => i.characterId === characterId && i.itemId === itemId && !i.equipped
  );
  
  if (existing) {
    existing.quantity += quantity;
    inventory.set(existing.id, existing);
    return existing;
  }
  
  const id = generateId();
  const invItem: InventoryItem = {
    id,
    characterId,
    itemId,
    quantity,
    equipped: false,
    slot: null,
  };
  
  inventory.set(id, invItem);
  
  const charInv = characterInventoryIndex.get(characterId) || new Set();
  charInv.add(id);
  characterInventoryIndex.set(characterId, charInv);
  
  return invItem;
}

export function removeInventoryItem(characterId: string, itemId: string, quantity: number): boolean {
  const existing = Array.from(inventory.values()).find(
    i => i.characterId === characterId && i.itemId === itemId && !i.equipped
  );
  
  if (!existing || existing.quantity < quantity) return false;
  
  if (existing.quantity === quantity) {
    inventory.delete(existing.id);
    const charInv = characterInventoryIndex.get(characterId);
    if (charInv) {
      charInv.delete(existing.id);
    }
  } else {
    existing.quantity -= quantity;
    inventory.set(existing.id, existing);
  }
  
  return true;
}

export function getInventoryItemQuantity(characterId: string, itemId: string): number {
  const existing = Array.from(inventory.values()).find(
    i => i.characterId === characterId && i.itemId === itemId && !i.equipped
  );
  return existing?.quantity || 0;
}

// ==================== 市場操作 ====================
export function createMarketListing(sellerId: string, sellerName: string, itemId: string, quantity: number, pricePerUnit: number): MarketListing {
  const id = generateId();
  const listing: MarketListing = {
    id,
    sellerId,
    sellerName,
    itemId,
    quantity,
    pricePerUnit,
    status: 'active',
  };
  marketListings.set(id, listing);
  return listing;
}

export function getActiveMarketListings(): MarketListing[] {
  return Array.from(marketListings.values()).filter(l => l.status === 'active');
}

export function getMarketListingById(id: string): MarketListing | null {
  return marketListings.get(id) || null;
}

export function updateMarketListing(id: string, updates: Partial<MarketListing>): MarketListing | null {
  const listing = marketListings.get(id);
  if (!listing) return null;
  const updated = { ...listing, ...updates };
  marketListings.set(id, updated);
  return updated;
}

// ==================== 導出遊戲數據 ====================
export { items, itemsMap, monsters, monstersMap, dungeons, dungeonsMap, gatheringNodes, gatheringNodesMap, recipes, recipesMap };
