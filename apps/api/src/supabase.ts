import { createClient, PostgrestError } from '@supabase/supabase-js'
import { Database } from './schema.gen'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export class SupabaseError extends Error {
  error: PostgrestError

  constructor(error: PostgrestError) {
    super(error.message)
    this.error = error
  }
}