# 冒險者公會 - 網頁RPG遊戲

一個經典的網頁RPG遊戲，有職業選擇、戰鬥、採集、製作、迷宮冒險和市場交易功能。

## 功能特色

- 🎮 **三種職業**: 劍士、術士、弓箭手
- ⚔️ **戰鬥系統**: 單人/多人戰鬥，HP條和傷害數字顯示
- 🌿 **採集系統**: 採礦、草藥、釣魚、伐木
- 🔨 **製作系統**: 使用材料製作裝備和道具
- 🏰 **迷宮探險**: 挑戰不同難度的迷宮
- 🏪 **市場交易**: 與其他玩家買賣物品
- 💾 **Neon Postgres**: 數據永久保存

## 技術棧

- **前端**: Next.js 16 + React + TypeScript + Tailwind CSS + shadcn/ui
- **後端**: Next.js API Routes
- **數據庫**: Neon Postgres (Serverless PostgreSQL)

## 部署指南

### 1. 創建 Neon 數據庫

1. 前往 [neon.tech](https://neon.tech)
2. 註冊/登入帳號
3. 點擊 **Create a project**
4. 選擇區域（建議選擇離你最近的地區）
5. **複製連接字符串**（非常重要！）

連接字符串格式：
```
postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 2. 在 Vercel 設置環境變量

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇你的項目
3. 點擊 **Settings** → **Environment Variables**
4. 添加環境變量：
   - **Name**: `DATABASE_URL`
   - **Value**: 你的 Neon 連接字符串
5. 點擊 **Save**

### 3. 初始化數據庫表

在本地環境設置環境變量後運行：

```bash
DATABASE_URL="你的連接字符串" npm run db:setup
```

或者在 Vercel 部署後，第一次訪問 API 時會自動創建表。

### 4. 部署到 Vercel

1. Push 代碼到 GitHub
2. 在 Vercel 導入 GitHub 項目
3. 設置環境變量 `DATABASE_URL`
4. 點擊 **Deploy**

## 本地開發

```bash
# 安裝依賴
npm install

# 設置環境變量
export DATABASE_URL="你的Neon連接字符串"

# 初始化數據庫
npm run db:setup

# 啟動開發服務器
npm run dev
```

## 環境變量

| 變量名 | 描述 | 必需 |
|--------|------|------|
| `DATABASE_URL` | Neon Postgres 連接字符串 | ✅ |

## GitHub

https://github.com/ericleung001/ff
