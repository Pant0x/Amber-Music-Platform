'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Mail, Lock, Loader2, ArrowRight, Sparkles, LogIn, UserPlus } from 'lucide-react'

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const supabase = (() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return url && anonKey ? createBrowserClient(url, anonKey) : null
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      setError('Auth is not configured (missing Supabase keys)')
      return
    }
    setError('')
    setLoading(true)
    try {
      if (mode === 'sign-in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          setError(signInError.message)
          return
        }
        router.push('/')
        router.refresh()
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() || email.split('@')[0] || 'Listener' },
          },
        })
        if (signUpError) {
          setError(signUpError.message)
          return
        }
        setInfo('Check your email to confirm your account, then sign in.')
        setPassword('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!supabase) {
      setError('Auth is not configured (missing Supabase keys)')
      return
    }
    if (!email.trim()) {
      setError('Enter your email first')
      return
    }
    setError('')
    setMagicLoading(true)
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({ email })
      if (otpError) {
        setError(otpError.message)
        return
      }
      setInfo(mode === 'sign-in' ? 'Magic link sent — check your email.' : 'Magic link sent — check your email to finish signing up.')
    } finally {
      setMagicLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {mode === 'sign-up' && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">Name</label>
          <div className="relative">
            <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="Your name"
              className="w-full bg-zinc-800/80 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-[#E88EAC]/50 focus:ring-2 focus:ring-[#E88EAC]/10 transition-all"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">Email</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full bg-zinc-800/80 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-[#E88EAC]/50 focus:ring-2 focus:ring-[#E88EAC]/10 transition-all"
          />
        </div>
      </div>

      {mode === 'sign-in' && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-zinc-800/80 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-[#E88EAC]/50 focus:ring-2 focus:ring-[#E88EAC]/10 transition-all"
            />
          </div>
        </div>
      )}

      {mode === 'sign-up' && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="w-full bg-zinc-800/80 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-[#E88EAC]/50 focus:ring-2 focus:ring-[#E88EAC]/10 transition-all"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs font-medium bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}
      {info && (
        <p className="text-emerald-400 text-xs font-medium bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">{info}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-white text-black hover:bg-zinc-100 font-extrabold text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Working…
          </>
        ) : mode === 'sign-in' ? (
          <>
            <LogIn className="w-4 h-4" /> Sign In
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" /> Create Account
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleMagicLink}
        disabled={magicLoading}
        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
      >
        {magicLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowRight className="w-4 h-4" />
        )}
        {mode === 'sign-in' ? 'Send me a magic link' : 'Continue with email link'}
      </button>

      <p className="text-center text-sm text-zinc-500 pt-2">
        {mode === 'sign-in' ? (
          <>
            No account?{' '}
            <a href="/sign-up" className="text-[#E88EAC] font-semibold hover:text-[#e27396]">Create one</a>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <a href="/sign-in" className="text-[#E88EAC] font-semibold hover:text-[#e27396]">Sign in</a>
          </>
        )}
      </p>
    </form>
  )
}