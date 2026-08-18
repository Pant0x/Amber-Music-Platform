'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Mail, Lock, Loader2, ArrowRight, Sparkles, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react'

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const supabase = (() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return url && anonKey ? createBrowserClient(url, anonKey) : null
  })()

  const getRedirectTo = () => {
    if (typeof window === 'undefined') return undefined
    return window.amberMusic
      ? 'ambermusic://auth/confirm'
      : `${window.location.origin}/auth/confirm`
  }

  const getNext = () => {
    if (typeof window === 'undefined') return '/'
    const params = new URLSearchParams(window.location.search)
    return params.get('redirectedFrom') || '/'
  }

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
        router.push(getNext())
        router.refresh()
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() || email.split('@')[0] || 'Listener' },
            emailRedirectTo: getRedirectTo(),
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
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: getRedirectTo() },
      })
      if (otpError) {
        setError(otpError.message)
        return
      }
      setInfo(mode === 'sign-in' ? 'Magic link sent — check your email.' : 'Magic link sent — check your email to finish signing up.')
    } finally {
      setMagicLoading(false)
    }
  }

  const handleGoogle = async () => {
    if (!supabase) {
      setError('Auth is not configured (missing Supabase keys)')
      return
    }
    setError('')
    setGoogleLoading(true)
    try {
      const redirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (oauthError) setError(oauthError.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!supabase) {
      setError('Auth is not configured (missing Supabase keys)')
      return
    }
    if (!email.trim()) {
      setError('Enter your email first')
      return
    }
    setError('')
    setResetLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getRedirectTo(),
      })
      if (resetError) {
        setError(resetError.message)
        return
      }
      setInfo('Password reset link sent — check your email.')
    } finally {
      setResetLoading(false)
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
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">Password</label>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="text-[11px] font-semibold text-zinc-500 hover:text-[#E88EAC] transition-colors disabled:opacity-60"
            >
              {resetLoading ? 'Sending…' : 'Forgot password?'}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-zinc-800/80 border border-white/10 text-white rounded-xl pl-10 pr-11 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-[#E88EAC]/50 focus:ring-2 focus:ring-[#E88EAC]/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {mode === 'sign-up' && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="w-full bg-zinc-800/80 border border-white/10 text-white rounded-xl pl-10 pr-11 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-[#E88EAC]/50 focus:ring-2 focus:ring-[#E88EAC]/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
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

      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2.5 cursor-pointer"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        Continue with Google
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