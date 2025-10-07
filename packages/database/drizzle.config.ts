import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/index.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
} satisfies Config;
