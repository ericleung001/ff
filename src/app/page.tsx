'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sword, Wand2, ArrowRight, Heart, Droplets, Zap, Shield, 
  Package, ShoppingBag, Users, Map, Pickaxe, Hammer, 
  LogOut, Plus, Trash2, Coins, Star, Skull, Mountain,
  TreePine, Fish, Flower2, Anvil, Store, Send, Lock, Globe,
  UserPlus, Gamepad2, RefreshCw, X
} from 'lucide-react';

// ==================== 類型定義 ====================
interface User {
  id: string;
  email: string;
  name: string;
  gold: number;
}

interface Character {
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

interface Item {
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

interface InventoryItem {
  id: string;
  itemId: string;
  item: Item;
  quantity: number;
  equipped: boolean;
  slot: string | null;
}

interface Monster {
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

interface Dungeon {
  id: string;
  name: string;
  description: string;
  levelRequired: number;
  floors: number;
  icon: string;
}

interface GatheringNode {
  id: string;
  name: string;
  gatheringType: string;
  levelRequired: number;
  icon: string;
  area: string;
}

interface CraftingRecipe {
  id: string;
  resultItem: Item;
  resultQuantity: number;
  requiredLevel: number;
  materials: { itemId: string; item: Item; quantity: number }[];
}

interface MarketListing {
  id: string;
  sellerId: string;
  seller: { id: string; name: string };
  itemId: string;
  item: Item;
  quantity: number;
  pricePerUnit: number;
  status: string;
}

// 戰鬥狀態
interface BattleState {
  inBattle: boolean;
  isMultiplayer: boolean;
  monster: Monster | null;
  playerHp: number;
  playerMaxHp: number;
  monsterHp: number;
  monsterMaxHp: number;
  turn: number;
  logs: BattleLog[];
  lastDamage: number;
  lastMonsterDamage: number;
  playerTurn: boolean;
}

interface BattleLog {
  id: number;
  type: 'player_attack' | 'monster_attack' | 'info' | 'victory' | 'defeat' | 'level_up' | 'drop';
  message: string;
  damage?: number;
  healer?: string;
}

// 房間
interface Room {
  id: string;
  name: string;
  isPublic: boolean;
  password?: string;
  hostId: string;
  hostName: string;
  maxPlayers: number;
  players: { id: string; name: string; level: number; characterClass: string }[];
  status: 'waiting' | 'in_battle' | 'finished';
}

// ==================== 主應用 ====================
export default function GamePage() {
  // 狀態
  const [user, setUser] = useState<User | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [dungeons, setDungeons] = useState<Dungeon[]>([]);
  const [gatheringNodes, setGatheringNodes] = useState<GatheringNode[]>([]);
  const [recipes, setRecipes] = useState<CraftingRecipe[]>([]);
  const [marketListings, setMarketListings] = useState<MarketListing[]>([]);
  
  const [activeTab, setActiveTab] = useState('village');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  
  // 表單狀態
  const [loginForm, setLoginForm] = useState({ email: '', password: '', name: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [newCharacterForm, setNewCharacterForm] = useState({ name: '', characterClass: 'WARRIOR' });
  const [showCreateCharacter, setShowCreateCharacter] = useState(false);
  const [marketForm, setMarketForm] = useState({ itemId: '', quantity: 1, pricePerUnit: 100 });
  const [showSellDialog, setShowSellDialog] = useState(false);
  
  // 迷宮狀態
  const [currentDungeon, setCurrentDungeon] = useState<Dungeon | null>(null);
  const [currentFloor, setCurrentFloor] = useState(1);
  
  // 戰鬥狀態
  const [battleState, setBattleState] = useState<BattleState>({
    inBattle: false,
    isMultiplayer: false,
    monster: null,
    playerHp: 0,
    playerMaxHp: 0,
    monsterHp: 0,
    monsterMaxHp: 0,
    turn: 0,
    logs: [],
    lastDamage: 0,
    lastMonsterDamage: 0,
    playerTurn: true,
  });
  
  // 房間狀態
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({ name: '', isPublic: true, password: '' });
  const [joinRoomPassword, setJoinRoomPassword] = useState('');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  // 顯示通知
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // API 請求
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '請求失敗');
    return data;
  };

  // 從 localStorage 恢復用戶
  useEffect(() => {
    const savedUser = localStorage.getItem('game_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        loadCharacters(userData.id);
      } catch (e) {
        localStorage.removeItem('game_user');
      }
    }
    
    // 載入遊戲數據
    loadGameData();
  }, []);

  // 保存用戶到 localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('game_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('game_user');
    }
  }, [user]);

  // 載入遊戲數據
  const loadGameData = async () => {
    try {
      const [monstersData, dungeonsData, nodesData, recipesData, marketData] = await Promise.all([
        apiCall('/game-data?type=monsters').catch(() => []),
        apiCall('/game-data?type=dungeons').catch(() => []),
        apiCall('/game-data?type=gathering-nodes').catch(() => []),
        apiCall('/game-data?type=recipes').catch(() => []),
        apiCall('/market').catch(() => []),
      ]);
      setMonsters(monstersData);
      setDungeons(dungeonsData);
      setGatheringNodes(nodesData);
      setRecipes(recipesData);
      setMarketListings(marketData);
    } catch (error) {
      console.error('載入遊戲數據失敗', error);
    }
  };

  // 認證
  const handleAuth = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/auth', {
        method: 'POST',
        body: {
          action: isRegister ? 'register' : 'login',
          ...loginForm,
        },
      });
      setUser(data);
      const chars = await loadCharacters(data.id);
      // 自動選擇第一個角色
      if (chars && chars.length > 0) {
        await selectCharacter(chars[0]);
      }
    } catch (error: any) {
      showNotification(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 載入角色
  const loadCharacters = async (userId: string) => {
    try {
      const data = await apiCall(`/characters?userId=${userId}`);
      setCharacters(data);
      return data;
    } catch (error) {
      console.error('載入角色失敗', error);
      return [];
    }
  };

  // 選擇角色
  const selectCharacter = async (character: Character) => {
    setCurrentCharacter(character);
    try {
      const inv = await apiCall(`/game-data?type=inventory&characterId=${character.id}`);
      setInventory(inv);
    } catch (error) {
      console.error('載入背包失敗', error);
    }
  };

  // 創建角色
  const createCharacter = async () => {
    if (!user || !newCharacterForm.name) return;
    try {
      setLoading(true);
      const data = await apiCall('/characters', {
        method: 'POST',
        body: { userId: user.id, ...newCharacterForm },
      });
      const newChars = [...characters, data];
      setCharacters(newChars);
      // 自動選擇新創建的角色
      await selectCharacter(data);
      setShowCreateCharacter(false);
      setNewCharacterForm({ name: '', characterClass: 'WARRIOR' });
      showNotification('角色創建成功！');
    } catch (error: any) {
      showNotification(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 刪除角色
  const deleteCharacter = async (characterId: string) => {
    if (!confirm('確定要刪除此角色嗎？')) return;
    try {
      await apiCall(`/characters?characterId=${characterId}`, { method: 'DELETE' });
      const newCharacters = characters.filter(c => c.id !== characterId);
      setCharacters(newCharacters);
      if (currentCharacter?.id === characterId) {
        // 自動選擇第一個可用角色
        if (newCharacters.length > 0) {
          await selectCharacter(newCharacters[0]);
        } else {
          setCurrentCharacter(null);
        }
      }
      showNotification('角色已刪除');
    } catch (error: any) {
      showNotification(error.message);
    }
  };

  // 刷新角色完整數據
  const refreshCharacter = async () => {
    if (!currentCharacter || !user) return;
    try {
      const chars = await apiCall(`/characters?userId=${user.id}`);
      const updatedChar = chars.find((c: Character) => c.id === currentCharacter.id);
      if (updatedChar) {
        setCurrentCharacter(updatedChar);
        setCharacters(chars);
      }
      const inv = await apiCall(`/game-data?type=inventory&characterId=${currentCharacter.id}`);
      setInventory(inv);
      const userData = await apiCall(`/game-data?type=user&userId=${user.id}`);
      setUser(userData);
    } catch (error) {
      console.error('刷新數據失敗', error);
    }
  };

  // ==================== 戰鬥系統 ====================
  
  // 開始單人戰鬥
  const startBattle = async (monster: Monster) => {
    if (!currentCharacter) return;
    
    // 初始化戰鬥狀態
    setBattleState({
      inBattle: true,
      isMultiplayer: false,
      monster: monster,
      playerHp: currentCharacter.hp,
      playerMaxHp: currentCharacter.maxHp,
      monsterHp: monster.hp,
      monsterMaxHp: monster.hp,
      turn: 1,
      logs: [{ id: 0, type: 'info', message: `⚔️ 戰鬥開始！${currentCharacter.name} VS ${monster.icon} ${monster.name}` }],
      lastDamage: 0,
      lastMonsterDamage: 0,
      playerTurn: true,
    });
  };

  // 玩家攻擊
  const playerAttack = async () => {
    if (!currentCharacter || !battleState.monster || !battleState.playerTurn) return;
    
    const monster = battleState.monster;
    const damage = Math.max(1, currentCharacter.attack - monster.defense + Math.floor(Math.random() * 5));
    const newMonsterHp = Math.max(0, battleState.monsterHp - damage);
    
    const newLogs = [...battleState.logs, {
      id: battleState.logs.length,
      type: 'player_attack' as const,
      message: `${currentCharacter.name} 攻擊 ${monster.name}！`,
      damage: damage,
    }];
    
    // 檢查是否勝利
    if (newMonsterHp <= 0) {
      newLogs.push({
        id: newLogs.length,
        type: 'victory' as const,
        message: `🎉 ${monster.name} 被擊敗！`,
      });
      
      setBattleState(prev => ({
        ...prev,
        monsterHp: 0,
        lastDamage: damage,
        logs: newLogs,
        playerTurn: false,
      }));
      
      // 延遲處理勝利獎勵
      setTimeout(() => handleVictory(), 1000);
      return;
    }
    
    // 怪物反擊
    setTimeout(() => monsterAttack(newMonsterHp, newLogs, damage), 500);
    
    setBattleState(prev => ({
      ...prev,
      monsterHp: newMonsterHp,
      lastDamage: damage,
      logs: newLogs,
      playerTurn: false,
    }));
  };

  // 怪物攻擊
  const monsterAttack = (playerHp: number, logs: BattleLog[], lastPlayerDamage: number) => {
    if (!currentCharacter || !battleState.monster) return;
    
    const monster = battleState.monster;
    const damage = Math.max(1, monster.attack - currentCharacter.defense + Math.floor(Math.random() * 3));
    const newPlayerHp = Math.max(0, playerHp - damage);
    
    const newLogs = [...logs, {
      id: logs.length,
      type: 'monster_attack' as const,
      message: `${monster.icon} ${monster.name} 反擊！`,
      damage: damage,
    }];
    
    // 檢查是否戰敗
    if (newPlayerHp <= 0) {
      newLogs.push({
        id: newLogs.length,
        type: 'defeat' as const,
        message: `💀 ${currentCharacter.name} 被擊敗...`,
      });
      
      setBattleState(prev => ({
        ...prev,
        playerHp: 0,
        monsterHp: playerHp,
        lastMonsterDamage: damage,
        lastDamage: lastPlayerDamage,
        logs: newLogs,
        playerTurn: false,
      }));
      
      setTimeout(() => handleDefeat(), 1000);
      return;
    }
    
    setBattleState(prev => ({
      ...prev,
      playerHp: newPlayerHp,
      monsterHp: playerHp,
      lastMonsterDamage: damage,
      lastDamage: lastPlayerDamage,
      turn: prev.turn + 1,
      logs: newLogs,
      playerTurn: true,
    }));
  };

  // 處理勝利
  const handleVictory = async () => {
    if (!currentCharacter || !user || !battleState.monster) return;
    
    const monster = battleState.monster;
    
    try {
      const result = await apiCall('/battle', {
        method: 'POST',
        body: { characterId: currentCharacter.id, monsterId: monster.id },
      });
      
      // 添加獎勵日誌
      const rewardLogs = [...battleState.logs];
      rewardLogs.push({
        id: rewardLogs.length,
        type: 'info' as const,
        message: `💰 獲得 ${result.rewards.exp} 經驗、${result.rewards.gold} 金幣`,
      });
      
      if (result.rewards.drops && result.rewards.drops.length > 0) {
        const dropTexts = result.rewards.drops.map((d: any) => `${d.item.icon}${d.item.name} x${d.quantity}`);
        rewardLogs.push({
          id: rewardLogs.length,
          type: 'drop' as const,
          message: `📦 獲得物品：${dropTexts.join(', ')}`,
        });
      }
      
      if (result.rewards.levelUp) {
        rewardLogs.push({
          id: rewardLogs.length,
          type: 'level_up' as const,
          message: `🎊 升級！現在是 Lv.${result.rewards.newLevel}！`,
        });
      }
      
      setBattleState(prev => ({ ...prev, logs: rewardLogs }));
      
      // 刷新數據
      await refreshCharacter();
      
    } catch (error: any) {
      showNotification(error.message);
    }
  };

  // 處理戰敗
  const handleDefeat = async () => {
    if (!currentCharacter) return;
    
    try {
      await apiCall('/characters', {
        method: 'PUT',
        body: {
          characterId: currentCharacter.id,
          updates: { hp: Math.floor(currentCharacter.maxHp * 0.3) }
        }
      });
      
      await refreshCharacter();
      showNotification('戰敗了...HP已恢復30%');
    } catch (error: any) {
      showNotification(error.message);
    }
  };

  // 結束戰鬥
  const endBattle = () => {
    setBattleState({
      inBattle: false,
      isMultiplayer: false,
      monster: null,
      playerHp: 0,
      playerMaxHp: 0,
      monsterHp: 0,
      monsterMaxHp: 0,
      turn: 0,
      logs: [],
      lastDamage: 0,
      lastMonsterDamage: 0,
      playerTurn: true,
    });
  };

  // ==================== 房間系統 ====================
  
  // 創建房間
  const createRoom = () => {
    if (!currentCharacter) return;
    
    const room: Room = {
      id: `room_${Date.now()}`,
      name: newRoomForm.name || `${currentCharacter.name}的房間`,
      isPublic: newRoomForm.isPublic,
      password: newRoomForm.isPublic ? undefined : newRoomForm.password,
      hostId: currentCharacter.id,
      hostName: currentCharacter.name,
      maxPlayers: 4,
      players: [{
        id: currentCharacter.id,
        name: currentCharacter.name,
        level: currentCharacter.level,
        characterClass: currentCharacter.characterClass,
      }],
      status: 'waiting',
    };
    
    setRooms(prev => [...prev, room]);
    setCurrentRoom(room);
    setShowRoomDialog(false);
    setNewRoomForm({ name: '', isPublic: true, password: '' });
    showNotification('房間已創建！');
  };

  // 加入房間
  const joinRoom = (room: Room) => {
    if (!currentCharacter) return;
    
    if (!room.isPublic && room.password !== joinRoomPassword) {
      showNotification('密碼錯誤！');
      return;
    }
    
    if (room.players.length >= room.maxPlayers) {
      showNotification('房間已滿！');
      return;
    }
    
    const updatedRoom = {
      ...room,
      players: [...room.players, {
        id: currentCharacter.id,
        name: currentCharacter.name,
        level: currentCharacter.level,
        characterClass: currentCharacter.characterClass,
      }],
    };
    
    setRooms(prev => prev.map(r => r.id === room.id ? updatedRoom : r));
    setCurrentRoom(updatedRoom);
    setJoinRoomPassword('');
    showNotification('已加入房間！');
  };

  // 離開房間
  const leaveRoom = () => {
    if (!currentRoom || !currentCharacter) return;
    
    if (currentRoom.hostId === currentCharacter.id) {
      // 房主離開，刪除房間
      setRooms(prev => prev.filter(r => r.id !== currentRoom.id));
    } else {
      // 普通玩家離開
      const updatedRoom = {
        ...currentRoom,
        players: currentRoom.players.filter(p => p.id !== currentCharacter.id),
      };
      setRooms(prev => prev.map(r => r.id === currentRoom.id ? updatedRoom : r));
    }
    
    setCurrentRoom(null);
  };

  // 開始多人戰鬥
  const startMultiplayerBattle = (monster: Monster) => {
    if (!currentCharacter || !currentRoom) return;
    
    // 計算隊伍總屬性
    const totalAttack = currentCharacter.attack; // 簡化：實際應該計算所有隊員
    const totalDefense = currentCharacter.defense;
    
    setBattleState({
      inBattle: true,
      isMultiplayer: true,
      monster: monster,
      playerHp: currentCharacter.hp,
      playerMaxHp: currentCharacter.maxHp,
      monsterHp: monster.hp,
      monsterMaxHp: monster.hp,
      turn: 1,
      logs: [{ id: 0, type: 'info', message: `⚔️ 多人戰鬥開始！隊伍 VS ${monster.icon} ${monster.name}` }],
      lastDamage: 0,
      lastMonsterDamage: 0,
      playerTurn: true,
    });
    
    // 更新房間狀態
    const updatedRoom = { ...currentRoom, status: 'in_battle' as const };
    setRooms(prev => prev.map(r => r.id === currentRoom.id ? updatedRoom : r));
    setCurrentRoom(updatedRoom);
  };

  // ==================== 其他功能 ====================
  
  // 採集
  const doGathering = async (node: GatheringNode) => {
    if (!currentCharacter) return;
    try {
      setLoading(true);
      const result = await apiCall('/gathering', {
        method: 'POST',
        body: { characterId: currentCharacter.id, nodeId: node.id },
      });
      if (result.drops.length > 0) {
        const dropTexts = result.drops.map((d: any) => `${d.item.icon} ${d.item.name} x${d.quantity}`);
        showNotification(`獲得：${dropTexts.join(', ')}`);
      } else {
        showNotification('什麼都沒有找到...');
      }
      await refreshCharacter();
    } catch (error: any) {
      showNotification(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 製作
  const doCrafting = async (recipe: CraftingRecipe) => {
    if (!currentCharacter) return;
    try {
      setLoading(true);
      const result = await apiCall('/crafting', {
        method: 'POST',
        body: { characterId: currentCharacter.id, recipeId: recipe.id },
      });
      showNotification(`成功製作 ${result.crafted.item.icon} ${result.crafted.item.name} x${result.crafted.quantity}！`);
      await refreshCharacter();
    } catch (error: any) {
      showNotification(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 迷宮探險
  const exploreDungeon = async (dungeon: Dungeon) => {
    if (!currentCharacter) return;
    setCurrentDungeon(dungeon);
    setCurrentFloor(1);
    await progressDungeon(dungeon, 1);
  };

  const progressDungeon = async (dungeon: Dungeon, floor: number) => {
    if (!currentCharacter) return;
    try {
      setLoading(true);
      const result = await apiCall('/dungeon', {
        method: 'POST',
        body: { characterId: currentCharacter.id, dungeonId: dungeon.id, floor },
      });
      
      if (result.type === 'battle') {
        if (result.victory) {
          if (result.dungeonComplete) {
            showNotification(`恭喜！成功通關 ${dungeon.name}！`);
            setCurrentDungeon(null);
          } else {
            setCurrentFloor(floor + 1);
          }
        } else {
          showNotification('在迷宮中戰敗了...');
          setCurrentDungeon(null);
        }
      } else {
        if (result.dungeonComplete) {
          showNotification(`恭喜！成功通關 ${dungeon.name}！`);
          setCurrentDungeon(null);
        } else {
          setCurrentFloor(floor + 1);
        }
      }
      
      await refreshCharacter();
    } catch (error: any) {
      showNotification(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 市場 - 出售
  const sellItem = async () => {
    if (!user || !currentCharacter) return;
    try {
      setLoading(true);
      await apiCall('/market', {
        method: 'POST',
        body: {
          action: 'sell',
          userId: user.id,
          characterId: currentCharacter.id,
          itemId: marketForm.itemId,
          quantity: marketForm.quantity,
          pricePerUnit: marketForm.pricePerUnit,
        },
      });
      showNotification('物品已上架！');
      setShowSellDialog(false);
      await refreshCharacter();
      const market = await apiCall('/market');
      setMarketListings(market);
    } catch (error: any) {
      showNotification(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 市場 - 購買
  const buyItem = async (listing: MarketListing, quantity: number) => {
    if (!user || !currentCharacter) return;
    try {
      setLoading(true);
      const result = await apiCall('/market', {
        method: 'POST',
        body: {
          action: 'buy',
          userId: user.id,
          characterId: currentCharacter.id,
          listingId: listing.id,
          quantity,
        },
      });
      showNotification(`購買成功！花費 ${result.totalPrice} 金幣`);
      await refreshCharacter();
      const market = await apiCall('/market');
      setMarketListings(market);
    } catch (error: any) {
      showNotification(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 登出
  const logout = () => {
    setUser(null);
    setCharacters([]);
    setCurrentCharacter(null);
    setInventory([]);
    setLoginForm({ email: '', password: '', name: '' });
    localStorage.removeItem('game_user');
  };

  // 職業名稱
  const getClassName = (cls: string) => {
    switch (cls) {
      case 'WARRIOR': return '劍士';
      case 'MAGE': return '術士';
      case 'ARCHER': return '弓箭手';
      default: return cls;
    }
  };

  const getClassIcon = (cls: string) => {
    switch (cls) {
      case 'WARRIOR': return <Sword className="w-5 h-5" />;
      case 'MAGE': return <Wand2 className="w-5 h-5" />;
      case 'ARCHER': return <ArrowRight className="w-5 h-5" />;
      default: return null;
    }
  };

  const getGatheringIcon = (type: string) => {
    switch (type) {
      case 'MINING': return <Pickaxe className="w-5 h-5" />;
      case 'HERBALISM': return <Flower2 className="w-5 h-5" />;
      case 'FISHING': return <Fish className="w-5 h-5" />;
      case 'WOODCUTTING': return <TreePine className="w-5 h-5" />;
      default: return <Pickaxe className="w-5 h-5" />;
    }
  };

  // ==================== 登入頁面 ====================
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/90 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              🎮 冒險者公會
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isRegister ? '創建新帳號' : '登入您的帳號'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <Label className="text-slate-300">角色名稱</Label>
                <Input
                  value={loginForm.name}
                  onChange={e => setLoginForm({ ...loginForm, name: e.target.value })}
                  placeholder="輸入您的角色名稱"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-slate-300">電子郵件</Label>
              <Input
                type="email"
                value={loginForm.email}
                onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="輸入電子郵件"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">密碼</Label>
              <Input
                type="password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="輸入密碼"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              onClick={handleAuth}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {loading ? '處理中...' : (isRegister ? '註冊' : '登入')}
            </Button>
            <Button
              variant="link"
              onClick={() => setIsRegister(!isRegister)}
              className="text-slate-400"
            >
              {isRegister ? '已有帳號？登入' : '沒有帳號？註冊'}
            </Button>
          </CardFooter>
        </Card>
        {notification && (
          <div className="fixed top-4 right-4 z-50">
            <Alert className="bg-red-900/90 border-red-700 text-white">
              <AlertDescription>{notification}</AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    );
  }

  // ==================== 角色選擇頁面 ====================
  if (!currentCharacter && characters.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/90 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">創建您的第一個角色</CardTitle>
            <CardDescription className="text-slate-400">
              每個帳號最多可創建3個角色
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">角色名稱</Label>
              <Input
                value={newCharacterForm.name}
                onChange={e => setNewCharacterForm({ ...newCharacterForm, name: e.target.value })}
                placeholder="輸入角色名稱"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">選擇職業</Label>
              <Select
                value={newCharacterForm.characterClass}
                onValueChange={v => setNewCharacterForm({ ...newCharacterForm, characterClass: v })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="WARRIOR" className="text-white flex items-center gap-2">
                    <span className="flex items-center gap-2"><Sword className="w-4 h-4" /> 劍士 - 高血量高攻擊</span>
                  </SelectItem>
                  <SelectItem value="MAGE" className="text-white flex items-center gap-2">
                    <span className="flex items-center gap-2"><Wand2 className="w-4 h-4" /> 術士 - 高魔力高法傷</span>
                  </SelectItem>
                  <SelectItem value="ARCHER" className="text-white flex items-center gap-2">
                    <span className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> 弓箭手 - 高速度高暴擊</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={createCharacter}
              disabled={loading || !newCharacterForm.name}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500"
            >
              {loading ? '創建中...' : '創建角色'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ==================== 主遊戲介面 ====================
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* 頂部狀態欄 */}
      <div className="bg-slate-800/90 border-b border-slate-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-amber-400">🎮 冒險者公會</span>
            <div className="flex items-center gap-2 text-amber-300">
              <Coins className="w-5 h-5" />
              <span className="font-medium">{user.gold.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {currentCharacter && (
              <div className="flex items-center gap-3 bg-slate-700/50 px-3 py-1.5 rounded-lg">
                <span className="text-slate-400">{getClassName(currentCharacter.characterClass)}</span>
                <span className="text-white font-medium">{currentCharacter.name}</span>
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-300">
                  Lv.{currentCharacter.level}
                </Badge>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={logout} className="text-slate-400 hover:text-white">
              <LogOut className="w-4 h-4 mr-2" />
              登出
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 flex gap-4">
        {/* 左側：角色信息 */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* 角色選擇 */}
          <Card className="bg-slate-800/90 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white flex items-center justify-between">
                <span>我的角色</span>
                {characters.length < 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateCharacter(true)}
                    className="text-amber-400 hover:text-amber-300"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {characters.map(char => (
                <div
                  key={char.id}
                  onClick={() => selectCharacter(char)}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    currentCharacter?.id === char.id
                      ? 'bg-amber-500/20 border border-amber-500/50'
                      : 'bg-slate-700/50 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getClassIcon(char.characterClass)}
                      <span className="text-white font-medium">{char.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Lv.{char.level}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); deleteCharacter(char.id); }}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 當前角色屬性 */}
          {currentCharacter && (
            <Card className="bg-slate-800/90 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  {getClassIcon(currentCharacter.characterClass)}
                  {currentCharacter.name}
                </CardTitle>
                <div className="text-sm text-slate-400">
                  {getClassName(currentCharacter.characterClass)} · Lv.{currentCharacter.level}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* HP */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-red-400">
                      <Heart className="w-4 h-4" /> HP
                    </span>
                    <span className="text-white">{currentCharacter.hp} / {currentCharacter.maxHp}</span>
                  </div>
                  <Progress value={(currentCharacter.hp / currentCharacter.maxHp) * 100} className="h-2 bg-slate-700 [&>div]:bg-red-500" />
                </div>
                {/* MP */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-blue-400">
                      <Droplets className="w-4 h-4" /> MP
                    </span>
                    <span className="text-white">{currentCharacter.mp} / {currentCharacter.maxMp}</span>
                  </div>
                  <Progress value={(currentCharacter.mp / currentCharacter.maxMp) * 100} className="h-2 bg-slate-700 [&>div]:bg-blue-500" />
                </div>
                {/* EXP */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Zap className="w-4 h-4" /> EXP
                    </span>
                    <span className="text-white">{currentCharacter.exp} / {currentCharacter.level * 100}</span>
                  </div>
                  <Progress value={(currentCharacter.exp / (currentCharacter.level * 100)) * 100} className="h-2 bg-slate-700 [&>div]:bg-amber-500" />
                </div>
                <Separator className="bg-slate-700" />
                {/* 屬性 */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">攻擊</span>
                    <span className="text-white">{currentCharacter.attack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">防禦</span>
                    <span className="text-white">{currentCharacter.defense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">魔力</span>
                    <span className="text-white">{currentCharacter.magic}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">速度</span>
                    <span className="text-white">{currentCharacter.speed}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-slate-400">暴擊率</span>
                    <span className="text-white">{(currentCharacter.critical * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 背包 */}
          {currentCharacter && (
            <Card className="bg-slate-800/90 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="w-5 h-5" /> 背包
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSellDialog(true)}
                    className="text-amber-400 hover:text-amber-300"
                  >
                    出售
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-1">
                    {inventory.length === 0 ? (
                      <div className="text-slate-500 text-center py-4">背包是空的</div>
                    ) : (
                      inventory.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{inv.item.icon}</span>
                            <div>
                              <div className="text-white text-sm flex items-center gap-1">
                                {inv.item.name}
                                <span className="text-amber-400 text-xs">{'★'.repeat(inv.item.rarity)}</span>
                              </div>
                              <div className="text-slate-500 text-xs">{inv.item.itemType}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {inv.equipped && <Badge className="bg-green-500/20 text-green-300 text-xs">已裝備</Badge>}
                            <Badge variant="outline" className="text-xs">x{inv.quantity}</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 主內容區 */}
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-800/90 border border-slate-700 w-full justify-start">
              <TabsTrigger value="village" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                🏘️ 村莊
              </TabsTrigger>
              <TabsTrigger value="battle" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300">
                ⚔️ 戰鬥
              </TabsTrigger>
              <TabsTrigger value="rooms" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
                🏠 房間
              </TabsTrigger>
              <TabsTrigger value="dungeon" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300">
                🏰 迷宮
              </TabsTrigger>
              <TabsTrigger value="gathering" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300">
                🌿 採集
              </TabsTrigger>
              <TabsTrigger value="crafting" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300">
                🔨 製作
              </TabsTrigger>
              <TabsTrigger value="market" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
                🏪 市場
              </TabsTrigger>
            </TabsList>

            {/* 村莊 */}
            <TabsContent value="village" className="mt-4">
              <Card className="bg-slate-800/90 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-xl">🏘️ 冒險者村莊</CardTitle>
                  <CardDescription className="text-slate-400">
                    歡迎來到冒險者村莊！在這裡你可以休息、準備裝備，然後踏上冒險之旅。
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-slate-700/50 border-slate-600 hover:bg-red-500/20 hover:border-red-500/50"
                    onClick={() => setActiveTab('battle')}
                  >
                    <Skull className="w-8 h-8 text-red-400" />
                    <span className="text-white">單人戰鬥</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-slate-700/50 border-slate-600 hover:bg-purple-500/20 hover:border-purple-500/50"
                    onClick={() => setActiveTab('rooms')}
                  >
                    <Users className="w-8 h-8 text-purple-400" />
                    <span className="text-white">多人組隊</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-slate-700/50 border-slate-600 hover:bg-indigo-500/20 hover:border-indigo-500/50"
                    onClick={() => setActiveTab('dungeon')}
                  >
                    <Mountain className="w-8 h-8 text-indigo-400" />
                    <span className="text-white">探索迷宮</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-slate-700/50 border-slate-600 hover:bg-green-500/20 hover:border-green-500/50"
                    onClick={() => setActiveTab('gathering')}
                  >
                    <TreePine className="w-8 h-8 text-green-400" />
                    <span className="text-white">資源採集</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-slate-700/50 border-slate-600 hover:bg-orange-500/20 hover:border-orange-500/50"
                    onClick={() => setActiveTab('crafting')}
                  >
                    <Anvil className="w-8 h-8 text-orange-400" />
                    <span className="text-white">物品製作</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-slate-700/50 border-slate-600 hover:bg-amber-500/20 hover:border-amber-500/50"
                    onClick={async () => {
                      if (currentCharacter && user) {
                        try {
                          await apiCall('/characters', {
                            method: 'PUT',
                            body: {
                              characterId: currentCharacter.id,
                              updates: { hp: currentCharacter.maxHp, mp: currentCharacter.maxMp }
                            }
                          });
                          await refreshCharacter();
                          showNotification('HP和MP已完全恢復！');
                        } catch (error: any) {
                          showNotification(error.message);
                        }
                      }
                    }}
                  >
                    <Heart className="w-8 h-8 text-amber-400" />
                    <span className="text-white">休息恢復</span>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 戰鬥 */}
            <TabsContent value="battle" className="mt-4">
              {battleState.inBattle ? (
                // 戰鬥介面
                <Card className="bg-slate-800/90 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-xl flex items-center gap-2">
                      <Sword className="w-6 h-6" />
                      戰鬥中 - 回合 {battleState.turn}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 戰鬥區域 */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                      {/* 玩家 */}
                      <div className="text-center p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                        <div className="text-6xl mb-3">
                          {currentCharacter && getClassIcon(currentCharacter.characterClass)}
                        </div>
                        <div className="text-white font-bold text-xl">{currentCharacter?.name}</div>
                        <Badge className="bg-amber-500/20 text-amber-300 mt-1">Lv.{currentCharacter?.level}</Badge>
                        <div className="mt-4 space-y-2">
                          {/* HP 條 */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-red-400 flex items-center gap-1">
                                <Heart className="w-4 h-4" /> HP
                              </span>
                              <span className="text-white font-medium">
                                {battleState.playerHp} / {battleState.playerMaxHp}
                              </span>
                            </div>
                            <div className="relative h-4 bg-slate-600 rounded-full overflow-hidden">
                              <div 
                                className="absolute h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                                style={{ width: `${(battleState.playerHp / battleState.playerMaxHp) * 100}%` }}
                              />
                            </div>
                            {/* 傷害數字動畫 */}
                            {battleState.lastMonsterDamage > 0 && (
                              <div className="text-red-400 font-bold text-2xl animate-ping absolute -mt-12 ml-16">
                                -{battleState.lastMonsterDamage}
                              </div>
                            )}
                          </div>
                          {/* MP 條 */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-400 flex items-center gap-1">
                                <Droplets className="w-4 h-4" /> MP
                              </span>
                              <span className="text-white font-medium">
                                {currentCharacter?.mp} / {currentCharacter?.maxMp}
                              </span>
                            </div>
                            <div className="h-3 bg-slate-600 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
                                style={{ width: `${((currentCharacter?.mp || 0) / (currentCharacter?.maxMp || 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* VS */}
                      <div className="text-center">
                        <div className="text-5xl font-bold bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent animate-pulse">
                          VS
                        </div>
                        {battleState.playerTurn ? (
                          <div className="mt-2 text-green-400 text-sm font-medium">你的回合</div>
                        ) : (
                          <div className="mt-2 text-orange-400 text-sm font-medium animate-pulse">敵方行動中...</div>
                        )}
                      </div>
                      
                      {/* 怪物 */}
                      <div className="text-center p-4 bg-red-900/30 rounded-xl border border-red-800/50">
                        <div className="text-7xl mb-3 animate-bounce">{battleState.monster?.icon}</div>
                        <div className="text-white font-bold text-xl">{battleState.monster?.name}</div>
                        <Badge className="bg-red-500/20 text-red-300 mt-1">Lv.{battleState.monster?.level}</Badge>
                        <div className="mt-4 space-y-2">
                          {/* 怪物 HP 條 */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-red-400 flex items-center gap-1">
                                <Heart className="w-4 h-4" /> HP
                              </span>
                              <span className="text-white font-medium">
                                {battleState.monsterHp} / {battleState.monsterMaxHp}
                              </span>
                            </div>
                            <div className="relative h-4 bg-slate-600 rounded-full overflow-hidden">
                              <div 
                                className="absolute h-full bg-gradient-to-r from-orange-600 to-yellow-400 transition-all duration-500"
                                style={{ width: `${(battleState.monsterHp / battleState.monsterMaxHp) * 100}%` }}
                              />
                              {/* 傷害數字動畫 */}
                              {battleState.lastDamage > 0 && (
                                <div className="text-yellow-400 font-bold text-2xl absolute -mt-10 ml-20 animate-bounce">
                                  -{battleState.lastDamage} 💥
                                </div>
                              )}
                            </div>
                          </div>
                          {/* 怪物屬性 */}
                          <div className="grid grid-cols-2 gap-1 text-xs text-slate-400 mt-2">
                            <div>攻擊: {battleState.monster?.attack}</div>
                            <div>防禦: {battleState.monster?.defense}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 操作按鈕 */}
                    {battleState.playerTurn && battleState.playerHp > 0 && battleState.monsterHp > 0 && (
                      <div className="flex justify-center gap-4 mt-4">
                        <Button
                          onClick={playerAttack}
                          disabled={loading}
                          className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-10 py-8 text-xl font-bold shadow-lg shadow-red-500/30"
                        >
                          <Sword className="w-6 h-6 mr-2" />
                          攻擊
                        </Button>
                      </div>
                    )}
                    
                    {/* 戰鬥結束 */}
                    {(battleState.playerHp <= 0 || battleState.monsterHp <= 0) && (
                      <div className="text-center mt-4 space-y-4">
                        {battleState.monsterHp <= 0 && (
                          <div className="text-3xl font-bold text-green-400 animate-pulse">
                            🎉 勝利！🎉
                          </div>
                        )}
                        {battleState.playerHp <= 0 && (
                          <div className="text-3xl font-bold text-red-400">
                            💀 戰敗... 💀
                          </div>
                        )}
                        <Button
                          onClick={endBattle}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-10 py-4 text-lg"
                        >
                          結束戰鬥
                        </Button>
                      </div>
                    )}
                    
                    {/* 戰鬥日誌 */}
                    <Card className="bg-slate-700/50 border-slate-600 mt-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white text-sm">📜 戰鬥記錄</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-28">
                          <div className="space-y-1 font-mono text-sm">
                            {battleState.logs.slice(-8).map((log) => (
                              <div 
                                key={log.id} 
                                className={`${
                                  log.type === 'victory' ? 'text-green-400 font-bold' :
                                  log.type === 'defeat' ? 'text-red-400 font-bold' :
                                  log.type === 'level_up' ? 'text-amber-400 font-bold' :
                                  log.type === 'drop' ? 'text-purple-400' :
                                  log.type === 'player_attack' ? 'text-yellow-300' :
                                  log.type === 'monster_attack' ? 'text-orange-400' :
                                  'text-slate-300'
                                }`}
                              >
                                {log.message}
                                {log.damage && <span className="ml-2 text-amber-300">[{log.damage} 傷害]</span>}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              ) : (
                // 怪物選擇
                <Card className="bg-slate-800/90 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-xl">⚔️ 單人戰鬥</CardTitle>
                    <CardDescription className="text-slate-400">
                      選擇要挑戰的怪物，獲得經驗和戰利品！
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {monsters.map(monster => (
                        <Card key={monster.id} className="bg-slate-700/50 border-slate-600">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <span className="text-3xl">{monster.icon}</span>
                              <Badge className="bg-red-500/20 text-red-300">Lv.{monster.level}</Badge>
                            </div>
                            <CardTitle className="text-white text-lg">{monster.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-1">
                              <div className="text-slate-400">HP: <span className="text-white">{monster.hp}</span></div>
                              <div className="text-slate-400">攻擊: <span className="text-white">{monster.attack}</span></div>
                            </div>
                            <Separator className="bg-slate-600" />
                            <div className="flex justify-between text-xs">
                              <span className="text-amber-400">+{monster.expReward} EXP</span>
                              <span className="text-amber-300">+{monster.goldReward} 金幣</span>
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button
                              onClick={() => startBattle(monster)}
                              disabled={loading}
                              className="w-full bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/50"
                            >
                              {loading ? '載入中...' : '開始戰鬥'}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 房間 */}
            <TabsContent value="rooms" className="mt-4">
              <Card className="bg-slate-800/90 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    多人組隊
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    創建或加入房間，與其他玩家一起戰鬥！
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 當前房間 */}
                  {currentRoom ? (
                    <div className="space-y-4">
                      <Card className="bg-slate-700/50 border-slate-600">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-white flex items-center gap-2">
                              {currentRoom.isPublic ? <Globe className="w-5 h-5 text-green-400" /> : <Lock className="w-5 h-5 text-amber-400" />}
                              {currentRoom.name}
                            </CardTitle>
                            <Badge className={currentRoom.isPublic ? "bg-green-500/20 text-green-300" : "bg-amber-500/20 text-amber-300"}>
                              {currentRoom.isPublic ? '公開' : '私人'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-slate-400 text-sm mb-2">房主: {currentRoom.hostName}</div>
                          <div className="text-slate-400 text-sm mb-4">
                            玩家 ({currentRoom.players.length}/{currentRoom.maxPlayers}):
                          </div>
                          <div className="space-y-2">
                            {currentRoom.players.map(player => (
                              <div key={player.id} className="flex items-center justify-between p-2 bg-slate-600/50 rounded">
                                <span className="text-white">{player.name}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">Lv.{player.level}</Badge>
                                  <Badge variant="outline">{getClassName(player.characterClass)}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter className="gap-2">
                          {currentRoom.hostId === currentCharacter?.id && currentRoom.players.length >= 2 && (
                            <Button
                              onClick={() => {
                                const boss = monsters.find(m => m.level >= Math.max(...currentRoom.players.map(p => p.level)));
                                if (boss) startMultiplayerBattle(boss);
                              }}
                              className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/50"
                            >
                              <Gamepad2 className="w-4 h-4 mr-2" />
                              開始多人戰鬥
                            </Button>
                          )}
                          <Button
                            onClick={leaveRoom}
                            variant="outline"
                            className="border-slate-600 text-slate-400"
                          >
                            離開房間
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  ) : (
                    <>
                      {/* 創建房間按鈕 */}
                      <Button
                        onClick={() => setShowRoomDialog(true)}
                        className="w-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/50"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        創建新房間
                      </Button>
                      
                      {/* 房間列表 */}
                      <div className="space-y-2">
                        <h3 className="text-white font-medium">可用房間</h3>
                        {rooms.filter(r => r.status === 'waiting').length === 0 ? (
                          <div className="text-slate-500 text-center py-8">
                            目前沒有等待中的房間，創建一個吧！
                          </div>
                        ) : (
                          rooms.filter(r => r.status === 'waiting').map(room => (
                            <Card key={room.id} className="bg-slate-700/50 border-slate-600">
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {room.isPublic ? (
                                    <Globe className="w-5 h-5 text-green-400" />
                                  ) : (
                                    <Lock className="w-5 h-5 text-amber-400" />
                                  )}
                                  <div>
                                    <div className="text-white font-medium">{room.name}</div>
                                    <div className="text-slate-400 text-sm">
                                      房主: {room.hostName} · {room.players.length}/{room.maxPlayers} 人
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!room.isPublic && (
                                    <Input
                                      type="password"
                                      placeholder="密碼"
                                      value={joinRoomPassword}
                                      onChange={e => setJoinRoomPassword(e.target.value)}
                                      className="w-24 h-8 bg-slate-600 border-slate-500 text-white"
                                    />
                                  )}
                                  <Button
                                    onClick={() => joinRoom(room)}
                                    size="sm"
                                    className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                                  >
                                    加入
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 迷宮 */}
            <TabsContent value="dungeon" className="mt-4">
              <Card className="bg-slate-800/90 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-xl">🏰 迷宮探險</CardTitle>
                  <CardDescription className="text-slate-400">
                    深入迷宮，挑戰更強大的敵人！
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentDungeon ? (
                    <div className="space-y-4">
                      <div className="bg-slate-700/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl text-white">{currentDungeon.icon} {currentDungeon.name}</h3>
                          <Badge className="bg-indigo-500/20 text-indigo-300">
                            第 {currentFloor} / {currentDungeon.floors} 層
                          </Badge>
                        </div>
                        <Progress value={(currentFloor / currentDungeon.floors) * 100} className="h-3 bg-slate-600 [&>div]:bg-indigo-500" />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => progressDungeon(currentDungeon, currentFloor)}
                          disabled={loading}
                          className="flex-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/50"
                        >
                          {loading ? '探索中...' : '繼續前進'}
                        </Button>
                        <Button
                          onClick={() => { setCurrentDungeon(null); }}
                          variant="outline"
                          className="border-slate-600 text-slate-400"
                        >
                          放棄
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dungeons.map(dungeon => (
                        <Card key={dungeon.id} className="bg-slate-700/50 border-slate-600">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <span className="text-3xl">{dungeon.icon}</span>
                              <Badge className="bg-indigo-500/20 text-indigo-300">
                                需要 Lv.{dungeon.levelRequired}
                              </Badge>
                            </div>
                            <CardTitle className="text-white text-lg">{dungeon.name}</CardTitle>
                            <CardDescription className="text-slate-400 text-sm">{dungeon.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="text-sm">
                            <div className="flex items-center gap-2 text-slate-400">
                              <span>共 {dungeon.floors} 層</span>
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button
                              onClick={() => exploreDungeon(dungeon)}
                              disabled={loading || (currentCharacter?.level || 0) < dungeon.levelRequired}
                              className="w-full bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/50"
                            >
                              {loading ? '載入中...' : '開始探險'}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 採集 */}
            <TabsContent value="gathering" className="mt-4">
              <Card className="bg-slate-800/90 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-xl">🌿 資源採集</CardTitle>
                  <CardDescription className="text-slate-400">
                    採集各種資源用於製作裝備和物品。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gatheringNodes.map(node => (
                      <Card key={node.id} className="bg-slate-700/50 border-slate-600">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <span className="text-3xl">{node.icon}</span>
                            {node.levelRequired > 1 && (
                              <Badge className="bg-green-500/20 text-green-300">
                                需要 Lv.{node.levelRequired}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-white text-lg">{node.name}</CardTitle>
                          <CardDescription className="text-slate-400 flex items-center gap-1">
                            {getGatheringIcon(node.gatheringType)}
                            <span className="ml-1">{node.gatheringType}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardFooter>
                          <Button
                            onClick={() => doGathering(node)}
                            disabled={loading || (currentCharacter?.level || 0) < node.levelRequired}
                            className="w-full bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/50"
                          >
                            {loading ? '採集中...' : '開始採集'}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 製作 */}
            <TabsContent value="crafting" className="mt-4">
              <Card className="bg-slate-800/90 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-xl">🔨 物品製作</CardTitle>
                  <CardDescription className="text-slate-400">
                    使用收集的材料製作強大的裝備和物品。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recipes.map(recipe => {
                      const canCraft = currentCharacter && currentCharacter.level >= recipe.requiredLevel &&
                        recipe.materials.every(m => 
                          (inventory.find(i => i.itemId === m.itemId)?.quantity || 0) >= m.quantity
                        );
                      
                      return (
                        <Card key={recipe.id} className="bg-slate-700/50 border-slate-600">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{recipe.resultItem.icon}</span>
                                <div>
                                  <CardTitle className="text-white">{recipe.resultItem.name}</CardTitle>
                                  <div className="text-amber-400 text-xs">{'★'.repeat(recipe.resultItem.rarity)}</div>
                                </div>
                              </div>
                              {recipe.requiredLevel > 1 && (
                                <Badge className="bg-orange-500/20 text-orange-300">
                                  Lv.{recipe.requiredLevel}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="text-slate-400">產出: <span className="text-white">x{recipe.resultQuantity}</span></div>
                            <Separator className="bg-slate-600" />
                            <div className="text-slate-400">所需材料:</div>
                            <div className="space-y-1">
                              {recipe.materials.map(mat => {
                                const have = inventory.find(i => i.itemId === mat.itemId)?.quantity || 0;
                                const enough = have >= mat.quantity;
                                return (
                                  <div key={mat.itemId} className={`flex justify-between ${enough ? 'text-green-400' : 'text-red-400'}`}>
                                    <span>{mat.item.icon} {mat.item.name}</span>
                                    <span>{have} / {mat.quantity}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button
                              onClick={() => doCrafting(recipe)}
                              disabled={!canCraft || loading}
                              className="w-full bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/50"
                            >
                              {loading ? '製作中...' : '製作'}
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 市場 */}
            <TabsContent value="market" className="mt-4">
              <Card className="bg-slate-800/90 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-xl">🏪 交易市場</CardTitle>
                  <CardDescription className="text-slate-400">
                    與其他玩家交易物品，買賣裝備和材料。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {marketListings.map(listing => (
                      <Card key={listing.id} className="bg-slate-700/50 border-slate-600">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{listing.item.icon}</span>
                              <div>
                                <CardTitle className="text-white">{listing.item.name}</CardTitle>
                                <div className="text-amber-400 text-xs">{'★'.repeat(listing.item.rarity)}</div>
                              </div>
                            </div>
                            <Badge className="bg-blue-500/20 text-blue-300">x{listing.quantity}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between text-slate-400">
                            <span>賣家:</span>
                            <span className="text-white">{listing.seller.name}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>單價:</span>
                            <span className="text-amber-300">{listing.pricePerUnit} 金幣</span>
                          </div>
                        </CardContent>
                        <CardFooter className="gap-2">
                          <Button
                            onClick={() => buyItem(listing, 1)}
                            disabled={loading || user.gold < listing.pricePerUnit}
                            className="flex-1 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/50"
                          >
                            購買
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                    {marketListings.length === 0 && (
                      <div className="col-span-full text-center text-slate-500 py-8">
                        市場目前沒有商品
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 創建角色對話框 */}
      <Dialog open={showCreateCharacter} onOpenChange={setShowCreateCharacter}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">創建新角色</DialogTitle>
            <DialogDescription className="text-slate-400">
              你還可以創建 {3 - characters.length} 個角色
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">角色名稱</Label>
              <Input
                value={newCharacterForm.name}
                onChange={e => setNewCharacterForm({ ...newCharacterForm, name: e.target.value })}
                placeholder="輸入角色名稱"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">選擇職業</Label>
              <Select
                value={newCharacterForm.characterClass}
                onValueChange={v => setNewCharacterForm({ ...newCharacterForm, characterClass: v })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="WARRIOR">🗡️ 劍士 - 高血量高攻擊</SelectItem>
                  <SelectItem value="MAGE">🪄 術士 - 高魔力高法傷</SelectItem>
                  <SelectItem value="ARCHER">🏹 弓箭手 - 高速度高暴擊</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCharacter(false)} className="border-slate-600">
              取消
            </Button>
            <Button onClick={createCharacter} disabled={loading || !newCharacterForm.name} className="bg-amber-500 hover:bg-amber-600">
              創建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 創建房間對話框 */}
      <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">創建新房間</DialogTitle>
            <DialogDescription className="text-slate-400">
              創建一個房間邀請其他玩家一起戰鬥
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">房間名稱</Label>
              <Input
                value={newRoomForm.name}
                onChange={e => setNewRoomForm({ ...newRoomForm, name: e.target.value })}
                placeholder="輸入房間名稱"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">房間類型</Label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setNewRoomForm({ ...newRoomForm, isPublic: true })}
                  className={`flex-1 ${newRoomForm.isPublic ? 'bg-green-500/30 border-green-500' : 'bg-slate-700 border-slate-600'}`}
                  variant="outline"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  公開
                </Button>
                <Button
                  onClick={() => setNewRoomForm({ ...newRoomForm, isPublic: false })}
                  className={`flex-1 ${!newRoomForm.isPublic ? 'bg-amber-500/30 border-amber-500' : 'bg-slate-700 border-slate-600'}`}
                  variant="outline"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  私人
                </Button>
              </div>
            </div>
            {!newRoomForm.isPublic && (
              <div className="space-y-2">
                <Label className="text-slate-300">房間密碼</Label>
                <Input
                  type="password"
                  value={newRoomForm.password}
                  onChange={e => setNewRoomForm({ ...newRoomForm, password: e.target.value })}
                  placeholder="輸入密碼"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoomDialog(false)} className="border-slate-600">
              取消
            </Button>
            <Button onClick={createRoom} className="bg-purple-500 hover:bg-purple-600">
              創建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 出售物品對話框 */}
      <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">出售物品</DialogTitle>
            <DialogDescription className="text-slate-400">
              選擇要出售的物品和價格
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">選擇物品</Label>
              <Select value={marketForm.itemId} onValueChange={v => setMarketForm({ ...marketForm, itemId: v })}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="選擇物品" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {inventory.filter(i => !i.equipped && i.item).map(inv => (
                    <SelectItem key={inv.itemId} value={inv.itemId}>
                      {inv.item.icon} {inv.item.name} (x{inv.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">數量</Label>
              <Input
                type="number"
                min={1}
                value={marketForm.quantity}
                onChange={e => setMarketForm({ ...marketForm, quantity: parseInt(e.target.value) || 1 })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">單價（金幣）</Label>
              <Input
                type="number"
                min={1}
                value={marketForm.pricePerUnit}
                onChange={e => setMarketForm({ ...marketForm, pricePerUnit: parseInt(e.target.value) || 100 })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSellDialog(false)} className="border-slate-600">
              取消
            </Button>
            <Button onClick={sellItem} disabled={loading || !marketForm.itemId} className="bg-amber-500 hover:bg-amber-600">
              上架出售
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 通知 */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert className="bg-slate-800 border-amber-500 text-white max-w-md">
            <AlertDescription className="whitespace-pre-line">{notification}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
