'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Star, Loader2, CheckCircle2, XCircle } from 'lucide-react'

function AuthConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as
    | 'magiclink'
    | 'email'
    | 'recovery'
    | 'invite'
    | 'sms'
    | null
  const next = searchParams.get('next') || '/'
  const [state, setState] = useState<'verifying' | 'success' | 'error'>('verifying')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const paramsValid = !!(tokenHash && type && url && anonKey)

  useEffect(() => {
    if (!paramsValid) return

    const supabase = createBrowserClient(url!, anonKey!)
    supabase.auth
      .verifyOtp({ token_hash: tokenHash!, type: type as 'magiclink' | 'email' | 'recovery' | 'invite' | 'sms' })
      .then(({ error }) => {
        if (error) {
          setState('error')
        } else {
          setState('success')
          setTimeout(() => router.push(next), 1200)
        }
      })
      .catch(() => setState('error'))
  }, [tokenHash, type, url, anonKey, next, router, paramsValid])

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,142,172,0.08) 0%, transparent 70%)', animation: 'breathe 7s ease-in-out infinite' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', animation: 'breathe 9s ease-in-out infinite reverse' }}
        />
      </div>

      <div className="relative z-10 mb-8 flex items-center gap-2.5 select-none">
        <div className="w-9 h-9 rounded-xl bg-[#E88EAC] flex items-center justify-center shadow-lg shadow-[#E88EAC]/30">
          <Star className="w-5 h-5 text-white fill-current" />
        </div>
        <span className="text-white font-extrabold text-2xl tracking-tight">Amber Music</span>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-zinc-900/90 shadow-2xl border border-white/8 rounded-3xl backdrop-blur-xl p-8 flex flex-col items-center text-center gap-4">
          {(!paramsValid || state === 'error') ? (
            <>
              <XCircle className="w-8 h-8 text-red-400" />
              <p className="text-white font-semibold">This link is invalid or expired</p>
              <button
                onClick={() => router.push('/sign-in')}
                className="mt-1 px-5 py-2.5 rounded-full bg-[#E88EAC] hover:bg-[#d97d9d] text-white text-sm font-semibold transition-all"
              >
                Back to Sign In
              </button>
            </>
          ) : state === 'success' ? (
            <>
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <p className="text-white font-semibold">Signed in!</p>
              <p className="text-zinc-400 text-sm">Redirecting you to your music...</p>
            </>
          ) : (
            <>
              <Loader2 className="w-8 h-8 text-[#E88EAC] animate-spin" />
              <p className="text-white font-semibold">Confirming your link...</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={null}>
      <AuthConfirmInner />
    </Suspense>
  )
}