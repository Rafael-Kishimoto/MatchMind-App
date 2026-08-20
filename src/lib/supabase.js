import { createClient } from '@supabase/supabase-js'

// These come from your .env file (see .env.example).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// True only once real values are filled in — lets the app run locally until then.
export const isSupabaseConfigured = Boolean(url && anonKey && url.startsWith('https://'))

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
