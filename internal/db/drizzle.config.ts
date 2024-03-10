import type { Config } from 'drizzle-kit'

export default {
  schema: './src/schema/*',
  out: './src',
  driver: 'pg',
  dbCredentials: {
    connectionString:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:54322/postgres',
  },
} satisfies Config
