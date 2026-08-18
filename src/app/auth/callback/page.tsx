'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Star, Loader2, CheckCircle2, XCircle } from 'lucide-react'

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const next = searchParams.get('redirectedFrom') || '/'
  const [state, setState] = useState<'exchanging' | 'success' | 'error'>('exchanging')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const paramsValid = !!(code && url && anonKey)

  useEffect(() => {
    if (!paramsValid) return
    const supabase = createBrowserClient(url!, anonKey!)
    supabase.auth
      .exchangeCodeForSession(code!)
      .then(({ error }) => {
        if (error) {
          setState('error')
        } else {
          setState('success')
          setTimeout(() => router.replace(next), 800)
        }
      })
      .catch(() => setState('error'))
  }, [code, url, anonKey, next, router, paramsValid])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="mb-8 flex items-center gap-2.5 select-none">
        <div className="w-9 h-9 rounded-xl bg-[#E88EAC] flex items-center justify-center shadow-lg shadow-[#E88EAC]/30">
          <Star className="w-5 h-5 text-white fill-current" />
        </div>
        <span className="text-white font-extrabold text-2xl tracking-tight">Amber Music</span>
      </div>

      <div className="bg-zinc-900/90 shadow-2xl border border-white/8 rounded-3xl backdrop-blur-xl p-8 flex flex-col items-center text-center gap-4 max-w-sm w-full">
        {(!paramsValid || state === 'error') ? (
          <>
            <XCircle className="w-8 h-8 text-red-400" />
            <p className="text-white font-semibold">Sign-in failed or expired</p>
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
            <p className="text-zinc-400 text-sm">Taking you to your music...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 text-[#E88EAC] animate-spin" />
            <p className="text-white font-semibold">Finishing your sign-in...</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackInner />
    </Suspense>
  )
}