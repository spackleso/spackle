import { createClient, PostgrestError } from '@supabase/supabase-js'
import { Database } from './schema.gen'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

export const supabase = createClient<Database>(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs',
)

export class SupabaseError extends Error {
  error: PostgrestError

  constructor(error: PostgrestError) {
    super(error.message)
    this.error = error
  }
}
