import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../drizzle/schema'
import { sql } from 'drizzle-orm'
import { PgBigSerial53 } from 'drizzle-orm/pg-core'

export const conn = postgres(
  process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:54322/postgres',
)
const db = drizzle(conn, { schema })

export const DB_PK_SALT = process.env.DB_PK_SALT ?? 'db_pk_salt'

export const encodePk = (id: PgBigSerial53<any>) => {
  return sql`id_encode(${id}, ${DB_PK_SALT}, 8)`
}

export const decodePk = (field: PgBigSerial53<any>, id: string) => {
  return sql`${field} = (id_decode(${id}, ${DB_PK_SALT}, 8))[1]`
}

export * from '../drizzle/schema'

export default db
