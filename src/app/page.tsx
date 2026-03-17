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
import { 
  Sword, Wand2, ArrowRight, Heart, Droplets, Zap, Shield, 
  Package, ShoppingBag, Users, Map, Pickaxe, Hammer, 
  LogOut, Plus, Trash2, Coins, Star, Skull, Mountain,
  TreePine, Fish, Flower2, Anvil, Store, Send
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
  const [battleLog, setBattleLog] = useState<string[]>([]);
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
      await loadCharacters(data.id);
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
      if (data.length > 0 && !currentCharacter) {
        selectCharacter(data[0]);
      }
    } catch (error) {
      console.error('載入角色失敗', error);
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
      setCharacters([...characters, data]);
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
        setCurrentCharacter(newCharacters[0] || null);
      }
      showNotification('角色已刪除');
    } catch (error: any) {
      showNotification(error.message);
    }
  };

  // 載入遊戲數據
  useEffect(() => {
    const loadGameData = async () => {
      try {
        const [monstersData, dungeonsData, nodesData, recipesData, marketData] = await Promise.all([
          apiCall('/game-data?type=monsters'),
          apiCall('/game-data?type=dungeons'),
          apiCall('/game-data?type=gathering-nodes'),
          apiCall('/game-data?type=recipes'),
          apiCall('/market'),
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
    loadGameData();
  }, []);

  // 戰鬥
  const startBattle = async (monster: Monster) => {
    if (!currentCharacter) return;
    try {
      setLoading(true);
      setBattleLog([]);
      const result = await apiCall('/battle', {
        method: 'POST',
        body: { characterId: currentCharacter.id, monsterId: monster.id },
      });
      setBattleLog(result.battleLog);
      if (result.victory) {
        showNotification(`勝利！獲得 ${result.rewards.exp} 經驗、${result.rewards.gold} 金幣`);
        if (result.rewards.levelUp) {
          showNotification(`升級！現在是 Lv.${result.rewards.newLevel}`);
        }
      } else {
        showNotification('戰敗了...HP已恢復30%');
      }
      // 刷新角色和背包
      await selectCharacter({ ...currentCharacter, hp: result.characterHp });
      const userData = await apiCall(`/game-data?type=user&userId=${user!.id}`);
      setUser(userData);
      const inv = await apiCall(`/game-data?type=inventory&characterId=${currentCharacter.id}`);
      setInventory(inv);
    } catch (error: any) {
      showNotification(error.message);
    } finally {
      setLoading(false);
    }
  };

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
      // 刷新背包
      const inv = await apiCall(`/game-data?type=inventory&characterId=${currentCharacter.id}`);
      setInventory(inv);
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
      // 刷新背包
      const inv = await apiCall(`/game-data?type=inventory&characterId=${currentCharacter.id}`);
      setInventory(inv);
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
    setBattleLog([]);
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
        setBattleLog(result.battleLog);
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
        setBattleLog([result.message]);
        if (result.dungeonComplete) {
          showNotification(`恭喜！成功通關 ${dungeon.name}！`);
          setCurrentDungeon(null);
        } else {
          setCurrentFloor(floor + 1);
        }
      }
      
      // 刷新數據
      const inv = await apiCall(`/game-data?type=inventory&characterId=${currentCharacter.id}`);
      setInventory(inv);
      const userData = await apiCall(`/game-data?type=user&userId=${user!.id}`);
      setUser(userData);
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
      // 刷新
      const inv = await apiCall(`/game-data?type=inventory&characterId=${currentCharacter.id}`);
      setInventory(inv);
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
      // 刷新
      const inv = await apiCall(`/game-data?type=inventory&characterId=${currentCharacter.id}`);
      setInventory(inv);
      const userData = await apiCall(`/game-data?type=user&userId=${user.id}`);
      setUser(userData);
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
              <TabsTrigger value="dungeon" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
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
                    <span className="text-white">前往戰鬥</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-slate-700/50 border-slate-600 hover:bg-purple-500/20 hover:border-purple-500/50"
                    onClick={() => setActiveTab('dungeon')}
                  >
                    <Mountain className="w-8 h-8 text-purple-400" />
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
                    className="h-24 flex flex-col gap-2 bg-slate-700/50 border-slate-600 hover:bg-blue-500/20 hover:border-blue-500/50"
                    onClick={() => setActiveTab('market')}
                  >
                    <Store className="w-8 h-8 text-blue-400" />
                    <span className="text-white">交易市場</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 bg-slate-700/50 border-slate-600 hover:bg-amber-500/20 hover:border-amber-500/50"
                    onClick={() => {
                      if (currentCharacter) {
                        selectCharacter({ ...currentCharacter, hp: currentCharacter.maxHp, mp: currentCharacter.maxMp });
                        showNotification('HP和MP已完全恢復！');
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
              <Card className="bg-slate-800/90 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-xl">⚔️ 戰鬥區域</CardTitle>
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
                          <CardDescription className="text-slate-400 text-sm">{monster.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-1">
                            <div className="text-slate-400">HP: <span className="text-white">{monster.hp}</span></div>
                            <div className="text-slate-400">攻擊: <span className="text-white">{monster.attack}</span></div>
                            <div className="text-slate-400">防禦: <span className="text-white">{monster.defense}</span></div>
                            <div className="text-slate-400">速度: <span className="text-white">{monster.speed}</span></div>
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
                            {loading ? '戰鬥中...' : '開始戰鬥'}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                  
                  {battleLog.length > 0 && (
                    <Card className="mt-4 bg-slate-700/50 border-slate-600">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white">📜 戰鬥記錄</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48">
                          <div className="space-y-1 font-mono text-sm">
                            {battleLog.map((log, i) => (
                              <div key={i} className="text-slate-300">{log}</div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
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
                    深入迷宮，挑戰更強大的敵人！組隊可獲得額外加成。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentDungeon ? (
                    <div className="space-y-4">
                      <div className="bg-slate-700/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl text-white">{currentDungeon.icon} {currentDungeon.name}</h3>
                          <Badge className="bg-purple-500/20 text-purple-300">
                            第 {currentFloor} / {currentDungeon.floors} 層
                          </Badge>
                        </div>
                        <Progress value={(currentFloor / currentDungeon.floors) * 100} className="h-3 bg-slate-600 [&>div]:bg-purple-500" />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => progressDungeon(currentDungeon, currentFloor)}
                          disabled={loading}
                          className="flex-1 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/50"
                        >
                          {loading ? '探索中...' : '繼續前進'}
                        </Button>
                        <Button
                          onClick={() => { setCurrentDungeon(null); setBattleLog([]); }}
                          variant="outline"
                          className="border-slate-600 text-slate-400"
                        >
                          放棄探險
                        </Button>
                      </div>
                      {battleLog.length > 0 && (
                        <Card className="bg-slate-700/50 border-slate-600">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-white">📜 探險記錄</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ScrollArea className="h-32">
                              <div className="space-y-1 font-mono text-sm">
                                {battleLog.map((log, i) => (
                                  <div key={i} className="text-slate-300">{log}</div>
                                ))}
                              </div>
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dungeons.map(dungeon => (
                        <Card key={dungeon.id} className="bg-slate-700/50 border-slate-600">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <span className="text-3xl">{dungeon.icon}</span>
                              <Badge className="bg-purple-500/20 text-purple-300">
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
                              className="w-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/50"
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
                    {recipes.map(recipe => (
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
                          <div className="text-slate-400">產出數量: <span className="text-white">x{recipe.resultQuantity}</span></div>
                          <Separator className="bg-slate-600" />
                          <div className="text-slate-400">所需材料:</div>
                          <div className="space-y-1">
                            {recipe.materials.map(mat => {
                              const invItem = inventory.find(i => i.itemId === mat.itemId);
                              const hasEnough = (invItem?.quantity || 0) >= mat.quantity;
                              return (
                                <div key={mat.itemId} className={`flex justify-between ${hasEnough ? 'text-green-400' : 'text-red-400'}`}>
                                  <span>{mat.item.icon} {mat.item.name}</span>
                                  <span>{invItem?.quantity || 0} / {mat.quantity}</span>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button
                            onClick={() => doCrafting(recipe)}
                            disabled={loading || (currentCharacter?.level || 0) < recipe.requiredLevel}
                            className="w-full bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/50"
                          >
                            {loading ? '製作中...' : '製作'}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
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
                          <div className="flex justify-between text-slate-400">
                            <span>總價:</span>
                            <span className="text-amber-300">{listing.pricePerUnit * listing.quantity} 金幣</span>
                          </div>
                        </CardContent>
                        <CardFooter className="gap-2">
                          <Button
                            onClick={() => buyItem(listing, 1)}
                            disabled={loading || user.gold < listing.pricePerUnit}
                            className="flex-1 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/50"
                          >
                            購買 1 個
                          </Button>
                          <Button
                            onClick={() => buyItem(listing, listing.quantity)}
                            disabled={loading || user.gold < listing.pricePerUnit * listing.quantity}
                            className="flex-1 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/50"
                          >
                            全部購買
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
                  {inventory.filter(i => !i.equipped).map(inv => (
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
          <Alert className="bg-slate-800 border-amber-500 text-white">
            <AlertDescription>{notification}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
