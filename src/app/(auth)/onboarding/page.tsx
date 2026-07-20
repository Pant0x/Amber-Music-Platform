'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { usePlayerStore } from '@/store/usePlayerStore'
import { Loader2, ArrowRight, Check, Headphones, ListMusic, Zap, Music2 } from 'lucide-react'

// Genre/mood tiles for step 2
const MOODS = [
  { label: 'Hip-Hop', emoji: '🎤', color: 'from-yellow-500/20 to-orange-600/20 border-yellow-500/20' },
  { label: 'Pop', emoji: '✨', color: 'from-pink-500/20 to-purple-600/20 border-pink-500/20' },
  { label: 'Electronic', emoji: '⚡', color: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/20' },
  { label: 'Lo-Fi', emoji: '🌙', color: 'from-indigo-500/20 to-violet-600/20 border-indigo-500/20' },
  { label: 'Rock', emoji: '🎸', color: 'from-red-500/20 to-rose-700/20 border-red-500/20' },
  { label: 'R&B', emoji: '💜', color: 'from-purple-500/20 to-fuchsia-700/20 border-purple-500/20' },
]

const FEATURES = [
  { icon: Headphones, title: 'Stream millions of songs', desc: 'Powered by YouTube Music — the full catalog, free.' },
  { icon: ListMusic, title: 'Build & sync playlists', desc: 'Your library follows you. Saved to the cloud automatically.' },
  { icon: Zap, title: 'Instant AI radio', desc: 'Drop any song and get an infinite radio station from it.' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { isSignedIn, user, isLoaded } = useUser()
  const { setDisplayName, setAvatarUrl, setOnboardingCompleted } = usePlayerStore()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [selectedMoods, setSelectedMoods] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [animatingOut, setAnimatingOut] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  // Pre-fill name from Clerk once loaded
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
      return
    }
    if (user) {
      const clerkName = user.fullName || user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0] || ''
      setName(clerkName)
      if (user.imageUrl) setAvatarUrl(user.imageUrl)
    }
  }, [isLoaded, isSignedIn, user, router, setAvatarUrl])

  const goToStep = (next: number) => {
    setAnimatingOut(true)
    setTimeout(() => {
      setStep(next)
      setAnimatingOut(false)
    }, 220)
  }

  const toggleMood = (label: string) => {
    setSelectedMoods(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    )
  }

  const handleFinish = async () => {
    setLoading(true)
    setError('')
    try {
      const finalName = name.trim() || user?.username || 'Listener'
      const avatarUrl = user?.imageUrl || ''

      setDisplayName(finalName)
      if (avatarUrl) setAvatarUrl(avatarUrl)
      setOnboardingCompleted(true)

      await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: finalName,
          avatar_url: avatarUrl,
          onboarding_completed: true,
        }),
      })

      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
      </div>
    )
  }

  const avatarSrc = user?.imageUrl || ''
  const initials = (name || user?.username || '?').charAt(0).toUpperCase()

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden px-4">

      {/* ── Animated ambient background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Red orb top-left */}
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,0,0,0.12) 0%, transparent 70%)',
            animation: 'breathe 7s ease-in-out infinite',
          }}
        />
        {/* Indigo orb bottom-right */}
        <div
          className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
            animation: 'breathe 9s ease-in-out infinite reverse',
          }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* ── Top logo ── */}
      <div className="relative z-10 mb-12 flex items-center gap-2.5 select-none">
        <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
          <Music2 className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-extrabold text-xl tracking-tight">Pantooty</span>
      </div>

      {/* ── Card ── */}
      <div
        className="relative z-10 w-full max-w-md"
        style={{
          opacity: animatingOut ? 0 : 1,
          transform: animatingOut ? 'translateY(12px) scale(0.98)' : 'translateY(0) scale(1)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
        }}
      >

        {/* ───────────── STEP 0: Welcome / Name ───────────── */}
        {step === 0 && (
          <div className="space-y-8 text-center">
            {/* User avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-2 border-white/10 overflow-hidden bg-zinc-800 shadow-2xl shadow-black/60 ring-4 ring-red-600/20">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center text-white text-3xl font-bold">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 border-2 border-black flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
              </div>

              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Hey {user?.firstName || 'there'} 👋
                </h1>
                <p className="text-zinc-400 text-sm mt-1.5">Your music journey starts here. What should we call you?</p>
              </div>
            </div>

            {/* Name input */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Display Name</label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && name.trim() && goToStep(1)}
                maxLength={30}
                placeholder="Your name..."
                className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-base font-semibold placeholder-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-600/10 transition-all"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs font-medium">{error}</p>
            )}

            <button
              onClick={() => { if (name.trim()) goToStep(1) }}
              disabled={!name.trim()}
              className="w-full py-4 rounded-2xl bg-white text-black font-extrabold text-sm hover:bg-zinc-100 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ───────────── STEP 1: Mood / Genre ───────────── */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">What's your sound?</h2>
              <p className="text-zinc-400 text-sm">Pick the genres you vibe with. We'll personalize your explore page.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {MOODS.map(({ label, emoji, color }) => {
                const selected = selectedMoods.includes(label)
                return (
                  <button
                    key={label}
                    onClick={() => toggleMood(label)}
                    className={`relative flex flex-col items-center justify-center gap-1.5 py-5 rounded-2xl border bg-gradient-to-br transition-all active:scale-95 cursor-pointer overflow-hidden ${color} ${
                      selected
                        ? 'border-white/40 shadow-lg scale-[1.03]'
                        : 'hover:scale-[1.02] hover:border-white/20'
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center">
                        <Check className="w-3 h-3 text-black" strokeWidth={3} />
                      </div>
                    )}
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-xs font-bold text-white/90">{label}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => goToStep(0)}
                className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => goToStep(2)}
                className="flex-[2] py-3.5 rounded-2xl bg-white text-black text-sm font-extrabold hover:bg-zinc-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                {selectedMoods.length === 0 ? 'Skip' : `Continue (${selectedMoods.length} selected)`} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ───────────── STEP 2: You're in ───────────── */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              {/* Animated checkmark */}
              <div className="flex items-center justify-center">
                <div
                  className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center"
                  style={{ animation: 'scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                >
                  <Check className="w-10 h-10 text-green-400" strokeWidth={2.5} />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">You're in, {name.split(' ')[0]}!</h2>
              <p className="text-zinc-400 text-sm">Pantooty is ready. Here's what you've got:</p>
            </div>

            {/* Feature list */}
            <div className="space-y-3">
              {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                <div
                  key={title}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors"
                  style={{
                    animation: `fade-in-up 0.4s ${i * 80}ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleFinish}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 cursor-pointer disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Getting everything ready...' : 'Start Listening →'}
            </button>
          </div>
        )}
      </div>

      {/* ── Progress indicators ── */}
      <div className="relative z-10 mt-10 flex items-center gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: step === i ? '32px' : '8px',
              background: step > i ? '#22c55e' : step === i ? '#ffffff' : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>

      {/* ── Fine print ── */}
      <p className="relative z-10 mt-6 text-[10px] text-zinc-700 text-center max-w-xs">
        Free forever. No credit card required. Your data syncs securely via Clerk.
      </p>
    </div>
  )
}
