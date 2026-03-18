import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db-neon.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
