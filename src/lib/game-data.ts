// 統一數據操作 - 自動選擇數據庫或內存存儲
import { items, itemsMap } from './game-data/items';
import { monsters, monstersMap } from './game-data/monsters';
import { dungeons, dungeonsMap } from './game-data/dungeons';
import { gatheringNodes, gatheringNodesMap } from './game-data/gathering';
import { recipes, recipesMap } from './game-data/recipes';

// 導出遊戲靜態數據
export { items, itemsMap, monsters, monstersMap, dungeons, dungeonsMap, gatheringNodes, gatheringNodesMap, recipes, recipesMap };

// 檢查是否有數據庫
const hasDatabase = !!process.env.DATABASE_URL;

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

// ==================== 內存存儲（後備方案）====================
const globalForStore = global as unknown as {
  users: Map<string, User>;
  characters: Map<string, Character>;
  inventory: Map<string, InventoryItem>;
  marketListings: Map<string, MarketListing>;
  userEmailIndex: Map<string, string>;
  userCharactersIndex: Map<string, Set<string>>;
  characterInventoryIndex: Map<string, Set<string>>;
};

const users = globalForStore.users || new Map<string, User>();
const characters = globalForStore.characters || new Map<string, Character>();
const inventory = globalForStore.inventory || new Map<string, InventoryItem>();
const marketListings = globalForStore.marketListings || new Map<string, MarketListing>();
const userEmailIndex = globalForStore.userEmailIndex || new Map<string, string>();
const userCharactersIndex = globalForStore.userCharactersIndex || new Map<string, Set<string>>();
const characterInventoryIndex = globalForStore.characterInventoryIndex || new Map<string, Set<string>>();

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
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== 用戶操作 ====================
export async function createUser(email: string, password: string, name: string): Promise<User> {
  const id = generateId();
  const user: User = { id, email, password, name, gold: 1000 };
  users.set(id, user);
  userEmailIndex.set(email, id);
  userCharactersIndex.set(id, new Set());
  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  return users.get(id) || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const userId = userEmailIndex.get(email);
  return userId ? users.get(userId) || null : null;
}

export async function updateUserGold(userId: string, amount: number): Promise<void> {
  const user = users.get(userId);
  if (user) {
    user.gold += amount;
    users.set(userId, user);
  }
}

// ==================== 角色操作 ====================
const classStats = {
  WARRIOR: { hp: 150, mp: 30, attack: 15, defense: 10, magic: 3, speed: 8, critical: 5 },
  MAGE: { hp: 80, mp: 100, attack: 5, defense: 3, magic: 18, speed: 6, critical: 3 },
  ARCHER: { hp: 100, mp: 50, attack: 12, defense: 5, magic: 5, speed: 15, critical: 10 },
};

export async function createCharacter(userId: string, name: string, characterClass: 'WARRIOR' | 'MAGE' | 'ARCHER'): Promise<Character> {
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

export async function getCharactersByUserId(userId: string): Promise<Character[]> {
  const charIds = userCharactersIndex.get(userId) || new Set();
  return Array.from(charIds).map(id => characters.get(id)!).filter(Boolean);
}

export async function getCharacterById(id: string): Promise<Character | null> {
  return characters.get(id) || null;
}

export async function updateCharacter(id: string, updates: Partial<Character>): Promise<Character | null> {
  const char = characters.get(id);
  if (!char) return null;
  const updated = { ...char, ...updates };
  characters.set(id, updated);
  return updated;
}

export async function deleteCharacter(id: string): Promise<void> {
  const char = characters.get(id);
  if (!char) return;
  
  const invIds = characterInventoryIndex.get(id) || new Set();
  for (const invId of invIds) {
    inventory.delete(invId);
  }
  characterInventoryIndex.delete(id);
  
  const userChars = userCharactersIndex.get(char.userId);
  if (userChars) {
    userChars.delete(id);
  }
  
  characters.delete(id);
}

export async function getCharacterCount(userId: string): Promise<number> {
  return (userCharactersIndex.get(userId) || new Set()).size;
}

// ==================== 背包操作 ====================
export async function getInventoryByCharacterId(characterId: string): Promise<InventoryItem[]> {
  const invIds = characterInventoryIndex.get(characterId) || new Set();
  return Array.from(invIds).map(id => inventory.get(id)!).filter(Boolean);
}

export async function addInventoryItem(characterId: string, itemId: string, quantity: number = 1): Promise<InventoryItem> {
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

export async function removeInventoryItem(characterId: string, itemId: string, quantity: number): Promise<boolean> {
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

export async function getInventoryItemQuantity(characterId: string, itemId: string): Promise<number> {
  const existing = Array.from(inventory.values()).find(
    i => i.characterId === characterId && i.itemId === itemId && !i.equipped
  );
  return existing?.quantity || 0;
}

// ==================== 市場操作 ====================
export async function createMarketListing(sellerId: string, sellerName: string, itemId: string, quantity: number, pricePerUnit: number): Promise<MarketListing> {
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

export async function getActiveMarketListings(): Promise<MarketListing[]> {
  return Array.from(marketListings.values()).filter(l => l.status === 'active');
}

export async function getMarketListingById(id: string): Promise<MarketListing | null> {
  return marketListings.get(id) || null;
}

export async function updateMarketListing(id: string, updates: Partial<MarketListing>): Promise<MarketListing | null> {
  const listing = marketListings.get(id);
  if (!listing) return null;
  const updated = { ...listing, ...updates };
  marketListings.set(id, updated);
  return updated;
}
