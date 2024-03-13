import * as schema from './schema'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

export type Database = PostgresJsDatabase<typeof schema>
