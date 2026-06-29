import { createClient } from '@supabase/supabase-js';

/**
 * Create a server-side Supabase client using the service role key.
 * This should only be used in server code (API routes, server components).
 */
export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE configuration (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export default createSupabaseServerClient;
