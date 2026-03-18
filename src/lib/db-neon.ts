import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, serial, varchar, integer, timestamp, boolean, text } from 'drizzle-orm/pg-core';

// 數據庫連接
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// ==================== Schema 定義 ====================

// 用戶表
export const users = pgTable('users', {
  id: varchar('id', { length: 50 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  gold: integer('gold').default(1000).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 角色表
export const characters = pgTable('characters', {
  id: varchar('id', { length: 50 }).primaryKey(),
  userId: varchar('user_id', { length: 50 }).notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  characterClass: varchar('character_class', { length: 20 }).notNull(),
  level: integer('level').default(1).notNull(),
  exp: integer('exp').default(0).notNull(),
  hp: integer('hp').notNull(),
  maxHp: integer('max_hp').notNull(),
  mp: integer('mp').notNull(),
  maxMp: integer('max_mp').notNull(),
  attack: integer('attack').notNull(),
  defense: integer('defense').notNull(),
  magic: integer('magic').notNull(),
  speed: integer('speed').notNull(),
  critical: integer('critical').notNull(), // 存為整數，使用時除以 100
  currentArea: varchar('current_area', { length: 50 }).default('village'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 背包表
export const inventory = pgTable('inventory', {
  id: varchar('id', { length: 50 }).primaryKey(),
  characterId: varchar('character_id', { length: 50 }).notNull().references(() => characters.id),
  itemId: varchar('item_id', { length: 50 }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  equipped: boolean('equipped').default(false),
  slot: varchar('slot', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// 市場列表表
export const marketListings = pgTable('market_listings', {
  id: varchar('id', { length: 50 }).primaryKey(),
  sellerId: varchar('seller_id', { length: 50 }).notNull().references(() => users.id),
  sellerName: varchar('seller_name', { length: 100 }).notNull(),
  itemId: varchar('item_id', { length: 50 }).notNull(),
  quantity: integer('quantity').notNull(),
  pricePerUnit: integer('price_per_unit').notNull(),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 類型導出
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type InventoryItem = typeof inventory.$inferSelect;
export type NewInventoryItem = typeof inventory.$inferInsert;
export type MarketListing = typeof marketListings.$inferSelect;
export type NewMarketListing = typeof marketListings.$inferInsert;
