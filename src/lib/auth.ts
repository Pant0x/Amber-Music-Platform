import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase session resolver for server code (API routes, admin gate).
 * Drop-in replacement for the legacy `auth()` API — returns the same `{ userId }` shape.
 * The userId is the Supabase user UUID, which matches `auth.jwt() ->> 'sub'`
 * used by all RLS policies.
 */
export async function auth(): Promise<{ userId: string | null }> {
  const user = await getSupabaseUser()
  return { userId: user?.id ?? null }
}

/** Full Supabase user (id, email, user_metadata) for routes that need profile data. */
export async function getSupabaseUser(): Promise<{
  id: string
  email: string | null
  user_metadata: Record<string, unknown>
} | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // API routes never issue auth cookies (only the middleware does)
        },
      },
    })
    const { data } = await supabase.auth.getUser()
    const u = data.user
    if (!u) return null
    return {
      id: u.id,
      email: u.email ?? null,
      user_metadata: (u.user_metadata || {}) as Record<string, unknown>,
    }
  } catch {
    return null
  }
}