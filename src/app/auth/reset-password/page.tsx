'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Star, Lock, Loader2, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const supabase = (() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return url && anonKey ? createBrowserClient(url, anonKey) : null
  })()

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/sign-in?reset=expired')
      }
    })
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      setError('Auth is not configured (missing Supabase keys)')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

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
        <div className="bg-zinc-900/90 shadow-2xl border border-white/8 rounded-3xl backdrop-blur-xl p-6">
          {done ? (
            <div className="flex flex-col items-center text-center gap-4 py-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">Password updated</h1>
                <p className="text-zinc-400 text-sm mt-1">Your new password is active.</p>
              </div>
              <button
                onClick={() => router.push('/sign-in')}
                className="w-full py-3.5 rounded-xl bg-white text-black hover:bg-zinc-100 font-extrabold text-sm shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E88EAC]/10 border border-[#E88EAC]/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-[#E88EAC]" />
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-white tracking-tight">Set a new password</h1>
                  <p className="text-zinc-500 text-xs">Pick something strong you haven&apos;t used before.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">New password</label>
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

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className="w-full bg-zinc-800/80 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 text-sm placeholder-zinc-600 focus:outline-none focus:border-[#E88EAC]/50 focus:ring-2 focus:ring-[#E88EAC]/10 transition-all"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-xs font-medium bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-white text-black hover:bg-zinc-100 font-extrabold text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating…
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}