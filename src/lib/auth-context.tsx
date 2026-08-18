'use client'

import { createBrowserClient } from '@supabase/ssr'
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'

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

function mapUser(u: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null; identities?: { provider?: string }[] | null } | undefined | null): AuthUser | null {
  if (!u) return null
  const meta = (u.user_metadata || {}) as Record<string, unknown>
  const provider = u.identities?.[0]?.provider ?? 'email'

  let name: string | undefined
  if (typeof meta.full_name === 'string') name = meta.full_name
  else if (typeof meta.name === 'string') name = meta.name
  else if (provider === 'discord' && typeof meta.global_name === 'string') name = meta.global_name
  else if (provider === 'discord' && typeof meta.username === 'string') name = meta.username
  else name = u.email?.split('@')[0] ?? undefined

  let imageUrl: string | undefined
  if (typeof meta.avatar_url === 'string' && /^https?:\/\//.test(meta.avatar_url)) {
    imageUrl = meta.avatar_url
  } else if (typeof meta.picture === 'string' && /^https?:\/\//.test(meta.picture)) {
    imageUrl = meta.picture
  } else if (provider === 'discord' && typeof meta.avatar === 'string' && meta.avatar.length > 0) {
    imageUrl = `https://cdn.discordapp.com/avatars/${u.id}/${meta.avatar}.png?size=256`
  }

  return { id: u.id, email: u.email ?? undefined, name, imageUrl }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return url && anonKey ? createBrowserClient(url, anonKey) : null
  }, [])

  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoaded, setIsLoaded] = useState(!supabase)

  const handleAuthLink = useCallback(
    (rawUrl: string) => {
      if (!supabase) return
      let parsed: URL
      try {
        parsed = new URL(rawUrl)
      } catch {
        return
      }

      const oauthCode = parsed.searchParams.get('code')
      const oauthError = parsed.searchParams.get('error')
      if (oauthCode) {
        supabase.auth
          .exchangeCodeForSession(oauthCode)
          .then(({ error }) => {
            if (!error) router.push('/')
          })
        return
      }
      if (oauthError) {
        router.push('/sign-in')
        return
      }

      const tokenHash = parsed.searchParams.get('token_hash')
      const type = parsed.searchParams.get('type')
      const next = parsed.searchParams.get('next') || '/'
      if (!tokenHash || !type) return
      const otpTypes = ['magiclink', 'email', 'recovery', 'invite', 'sms'] as const
      if (!otpTypes.includes(type as (typeof otpTypes)[number])) return
      supabase.auth
        .verifyOtp({ token_hash: tokenHash, type: type as (typeof otpTypes)[number] })
        .then(({ error }) => {
          if (!error) router.push(type === 'recovery' ? '/auth/reset-password' : next)
        })
    },
    [supabase, router]
  )

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
    const bridge = typeof window !== 'undefined' ? window.amberMusic : undefined
    if (bridge?.onAuthLink) {
      bridge.onAuthLink(handleAuthLink)
    }
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [supabase, handleAuthLink])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
  }, [supabase])

  return <AuthContext.Provider value={{ user, isLoaded, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}