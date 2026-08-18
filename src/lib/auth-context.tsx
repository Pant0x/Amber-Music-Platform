'use client'

import { createBrowserClient } from '@supabase/ssr'
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

export interface AuthUser {
  id: string
  email?: string
  name?: string
  imageUrl?: string
}

interface AuthState {
  user: AuthUser | null
  isLoaded: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoaded: false,
  signOut: async () => {},
})

function mapUser(u: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null } | undefined | null): AuthUser | null {
  if (!u) return null
  const meta = (u.user_metadata || {}) as Record<string, unknown>
  return {
    id: u.id,
    email: u.email ?? undefined,
    name:
      typeof meta.full_name === 'string'
        ? meta.full_name
        : typeof meta.name === 'string'
          ? meta.name
          : u.email?.split('@')[0] ?? undefined,
    imageUrl:
      typeof meta.avatar_url === 'string'
        ? meta.avatar_url
        : typeof meta.picture === 'string'
          ? meta.picture
          : undefined,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return url && anonKey ? createBrowserClient(url, anonKey) : null
  }, [])

  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoaded, setIsLoaded] = useState(!supabase)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setUser(mapUser(data.session?.user))
      setIsLoaded(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user))
      setIsLoaded(true)
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
  }, [supabase])

  return <AuthContext.Provider value={{ user, isLoaded, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}