'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { usePlayerStore } from '@/store/usePlayerStore'
import { Loader2, ArrowRight, Check, Headphones, ListMusic, Zap, Music2 } from 'lucide-react'

// Mood/genre tiles for step 2
const VOICE_TAGS = [
  { label: 'Music Discovery', emoji: '🎵', color: 'from-pink-500/20 to-rose-600/20 border-pink-500/20' },
  { label: 'Playlist Builder', emoji: '📋', color: 'from-blue-500/20 to-cyan-600/20 border-blue-500/20' },
  { label: 'AI Radio', emoji: '🔮', color: 'from-purple-500/20 to-violet-600/20 border-purple-500/20' },
  { label: 'Lyrics Sync', emoji: '📝', color: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/20' },
  { label: 'Offline Mode', emoji: '📴', color: 'from-amber-500/20 to-yellow-600/20 border-amber-500/20' },
  { label: 'Social Features', emoji: '👥', color: 'from-indigo-500/20 to-purple-600/20 border-indigo-500/20' },
]

const PROBLEM_SOLUTIONS = [
  {
    icon: Headphones,
    problem: 'Finding music is hard',
    solution: 'Instant search across YouTube Music and Spotify',
    benefit: 'Millions of songs at your fingertips'
  },
  {
    icon: ListMusic,
    problem: 'Playlists scattered everywhere',
    solution: 'Your library follows you everywhere',
    benefit: 'Everything syncs automatically to the cloud'
  },
  {
    icon: Zap,
    problem: 'Tired of the same songs',
    solution: 'Infinite AI radio from any track',
    benefit: 'Never run out of new music'
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { setDisplayName, setOnboardingCompleted, setAvatarUrl } = usePlayerStore()
  
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [animatingOut, setAnimatingOut] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Auto-suggest display name
  useEffect(() => {
    const suggestedName = `Listener_${Math.floor(Math.random() * 1000)}`
    setName(suggestedName)
  }, [])

  const handleAvatarClick = () => avatarInputRef.current?.click()
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleAvatarUpload = async (): Promise<string | null> => {
    if (!avatarFile) return avatarPreview || null
    
    try {
      const formData = new FormData()
      formData.append('file', avatarFile)
      formData.append('bucket', 'avatars')
      formData.append('folder', 'onboarding')
      
      const uploadRes = await fetch('/api/storage/upload', { 
        method: 'POST', 
        body: formData 
      })
      
      if (uploadRes.ok) {
        const data = await uploadRes.json()
        return data.url
      }
    } catch (err) {
      console.error('Avatar upload failed:', err)
    }
    return null
  }

  const goToStep = (next: number) => {
    setAnimatingOut(true)
    setTimeout(() => {
      setStep(next)
      setAnimatingOut(false)
    }, 220)
  }

  const toggleFeature = (label: string) => {
    setSelectedFeatures(prev =>
      prev.includes(label) ? prev.filter(f => f !== label) : [...prev, label]
    )
  }

  const handleFinish = async () => {
    setLoading(true)
    setError('')
    
    try {
      const finalAvatarUrl = await handleAvatarUpload()
      const finalName = name.trim() || 'Music Listener'

      setDisplayName(finalName)
      if (finalAvatarUrl) setAvatarUrl(finalAvatarUrl)
      setOnboardingCompleted(true)

      await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: finalName,
          avatar_url: finalAvatarUrl,
          onboarding_completed: true,
        }),
      })

      router.push('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      setLoading(false)
    }
  }

  const initials = (name || 'LM').charAt(0).toUpperCase()

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(236,73,160,0.08) 0%, transparent 70%)',
            animation: 'breathe 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
            animation: 'breathe 10s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-12 flex items-center gap-3 select-none">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Music2 className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-extrabold text-xl tracking-tight">Sonora</span>
      </div>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md"
        style={{
          opacity: animatingOut ? 0 : 1,
          transform: animatingOut ? 'translateY(12px) scale(0.98)' : 'translateY(0) scale(1)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
        }}
      >

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="space-y-10 text-center">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <label 
                htmlFor="onboarding-avatar-input" 
                className="relative inline-block cursor-pointer group"
                onClick={handleAvatarClick}
              >
                <div className="w-28 h-28 rounded-full border-2 border-white/10 overflow-hidden bg-zinc-800 shadow-2xl shadow-black/60 group-hover:border-pink-500/50 transition-all flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                      {initials}
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                  id="onboarding-avatar-input" 
                  ref={avatarInputRef}
                />
              </label>

              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Welcome 👋
                </h1>
                <p className="text-zinc-400 text-sm mt-1.5">Pick a photo and tell us your name</p>
              </div>
            </div>

            {/* Name input */}
            <div className="space-y-2 text-left">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && name.trim() && goToStep(1)}
                maxLength={30}
                placeholder="Your name..."
                className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-base font-semibold placeholder-zinc-600 focus:outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/10 transition-all"
              />
            </div>

            {error && <p className="text-red-400 text-xs font-medium">{error}</p>}

            <button
              onClick={() => { if (name.trim()) goToStep(1) }}
              disabled={!name.trim()}
              className="w-full py-4 rounded-2xl bg-white text-black font-extrabold text-sm hover:bg-zinc-100 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 1: What matters to you? */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">What matters to you?</h2>
              <p className="text-zinc-400 text-sm">Pick features you care about. We'll personalize your experience.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {VOICE_TAGS.map(({ label, emoji, color }) => {
                const selected = selectedFeatures.includes(label)
                return (
                  <button
                    key={label}
                    onClick={() => toggleFeature(label)}
                    className={`relative flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border bg-gradient-to-br transition-all active:scale-95 cursor-pointer overflow-hidden ${color} ${
                      selected
                        ? 'border-pink-500 shadow-lg scale-[1.02]'
                        : 'hover:scale-[1.02] hover:border-white/20'
                    }`}
                  >
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
                className="flex-[2] py-3.5 rounded-2xl bg-pink-500 text-white text-sm font-extrabold hover:bg-pink-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Solved problems */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center">
                <div 
                  className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center"
                  style={{ animation: 'scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                >
                  <Check className="w-10 h-10 text-green-400" strokeWidth={2.5} />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Got it, {name.split(' ')[0]}!
              </h2>
              <p className="text-zinc-400 text-sm">Here's how Sonora solves the hard parts:</p>
            </div>

            {/* Problem-Solution list */}
            <div className="space-y-3">
              {PROBLEM_SOLUTIONS.map(({ icon: Icon, problem, solution, benefit }, i) => (
                <div
                  key={problem}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors"
                  style={{
                    animation: `fade-in-up 0.4s ${i * 80}ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-pink-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{problem}</p>
                    <p className="text-xs text-pink-300/70 mt-0.5">{solution} — {benefit}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleFinish}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-extrabold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Getting ready...
                </>
              ) : (
                <>
                  Let's Go Music 🎵
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Progress indicators */}
      <div className="relative z-10 mt-8 flex items-center gap-2 justify-center">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: step === i ? '32px' : '10px',
              background: step > i ? '#22c55e' : step === i ? '#ffffff' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>

      {/* Fine print */}
      <p className="relative z-10 mt-8 text-[11px] text-zinc-600 text-center max-w-xs">
        Free forever. No accounts needed to start listening.
      </p>
    </div>
  )
}