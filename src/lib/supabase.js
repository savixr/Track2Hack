/**
 * Supabase client — single-user mode
 *
 * All DB queries use a deterministic local user ID stored in localStorage
 * so data is always associated with the same "user" regardless of auth state.
 * The actual RLS on Supabase still enforces ownership server-side; we simply
 * pass our stable local ID as the user_id column value.
 *
 * For file uploads the Supabase anon key is used; the storage bucket policy
 * restricts access by the folder prefix (localUserId).
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars missing. Copy .env.example to .env and fill in your credentials.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Returns (and mints) a stable local user ID — stored in localStorage.
 * This replaces the Supabase auth.uid() concept for the single-user mode.
 */
export function getLocalUserId() {
  const KEY = 't2h_uid'
  let uid = localStorage.getItem(KEY)
  if (!uid) {
    uid = crypto.randomUUID()
    localStorage.setItem(KEY, uid)
  }
  return uid
}
