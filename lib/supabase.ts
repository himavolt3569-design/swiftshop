import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDatabase = any

// Singleton pattern – one client shared across the frontend
let client: ReturnType<typeof createClient<AnyDatabase>> | null = null

export function getSupabaseClient() {
  if (!client) {
    client = createClient<AnyDatabase>(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  }
  return client
}

export const supabase = getSupabaseClient()
