import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
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

export interface Item {
  id: string;
  name: string;
  description: string;
  itemType: string;
  rarity: number;
  attackBonus: number;
  defenseBonus: number;
  magicBonus: number;
  hpBonus: number;
  mpBonus: number;
  speedBonus: number;
  criticalBonus: number;
  basePrice: number;
  icon: string;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  item: Item;
  quantity: number;
  equipped: boolean;
  slot: string | null;
}

export interface Monster {
  id: string;
  name: string;
  description: string;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  magic: number;
  speed: number;
  expReward: number;
  goldReward: number;
  icon: string;
  area: string;
}

export interface Dungeon {
  id: string;
  name: string;
  description: string;
  levelRequired: number;
  floors: number;
  icon: string;
}

export interface Party {
  id: string;
  name: string;
  leaderId: string;
  members: string[];
  maxMembers: number;
  status: string;
}

export interface MarketListing {
  id: string;
  sellerId: string;
  sellerName: string;
  itemId: string;
  item: Item;
  quantity: number;
  pricePerUnit: number;
  status: string;
}

export interface CraftingRecipe {
  id: string;
  resultItem: Item;
  resultQuantity: number;
  requiredLevel: number;
  materials: { itemId: string; item: Item; quantity: number }[];
}

export interface GatheringNode {
  id: string;
  name: string;
  gatheringType: string;
  levelRequired: number;
  icon: string;
  area: string;
}

interface GameState {
  user: User | null;
  characters: Character[];
  currentCharacter: Character | null;
  inventory: InventoryItem[];
  monsters: Monster[];
  dungeons: Dungeon[];
  recipes: CraftingRecipe[];
  gatheringNodes: GatheringNode[];
  marketListings: MarketListing[];
  party: Party | null;
  
  setUser: (user: User | null) => void;
  setCharacters: (characters: Character[]) => void;
  setCurrentCharacter: (character: Character | null) => void;
  setInventory: (inventory: InventoryItem[]) => void;
  setMonsters: (monsters: Monster[]) => void;
  setDungeons: (dungeons: Dungeon[]) => void;
  setRecipes: (recipes: CraftingRecipe[]) => void;
  setGatheringNodes: (nodes: GatheringNode[]) => void;
  setMarketListings: (listings: MarketListing[]) => void;
  setParty: (party: Party | null) => void;
  updateCharacter: (updates: Partial<Character>) => void;
  addItemToInventory: (item: InventoryItem) => void;
  removeItemFromInventory: (itemId: string, quantity: number) => void;
  updateUserGold: (amount: number) => void;
  logout: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      user: null,
      characters: [],
      currentCharacter: null,
      inventory: [],
      monsters: [],
      dungeons: [],
      recipes: [],
      gatheringNodes: [],
      marketListings: [],
      party: null,
      
      setUser: (user) => set({ user }),
      setCharacters: (characters) => set({ characters }),
      setCurrentCharacter: (currentCharacter) => set({ currentCharacter }),
      setInventory: (inventory) => set({ inventory }),
      setMonsters: (monsters) => set({ monsters }),
      setDungeons: (dungeons) => set({ dungeons }),
      setRecipes: (recipes) => set({ recipes }),
      setGatheringNodes: (gatheringNodes) => set({ gatheringNodes }),
      setMarketListings: (marketListings) => set({ marketListings }),
      setParty: (party) => set({ party }),
      
      updateCharacter: (updates) => {
        const current = get().currentCharacter;
        if (current) {
          set({ currentCharacter: { ...current, ...updates } });
        }
      },
      
      addItemToInventory: (item) => {
        const inventory = get().inventory;
        const existing = inventory.find(i => i.itemId === item.itemId && !i.equipped);
        if (existing) {
          set({
            inventory: inventory.map(i => 
              i.id === existing.id 
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ inventory: [...inventory, item] });
        }
      },
      
      removeItemFromInventory: (itemId, quantity) => {
        const inventory = get().inventory;
        const item = inventory.find(i => i.itemId === itemId);
        if (item && item.quantity <= quantity) {
          set({ inventory: inventory.filter(i => i.itemId !== itemId) });
        } else if (item) {
          set({
            inventory: inventory.map(i =>
              i.itemId === itemId ? { ...i, quantity: i.quantity - quantity } : i
            ),
          });
        }
      },
      
      updateUserGold: (amount) => {
        const user = get().user;
        if (user) {
          set({ user: { ...user, gold: user.gold + amount } });
        }
      },
      
      logout: () => set({
        user: null,
        characters: [],
        currentCharacter: null,
        inventory: [],
        party: null,
      }),
    }),
    {
      name: 'game-storage',
      partialize: (state) => ({
        user: state.user,
        currentCharacter: state.currentCharacter,
      }),
    }
  )
);
