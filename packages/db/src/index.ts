import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../drizzle/schema'

export const sql = postgres(
  process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:54322/postgres',
)
const db = drizzle(sql, { schema })

export * from '../drizzle/schema'

export default db
