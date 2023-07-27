import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

export * from '../drizzle/schema'

const client = postgres(
  process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:54322/postgres',
)
const db = drizzle(client)

export default db
