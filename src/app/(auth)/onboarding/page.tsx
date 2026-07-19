'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { usePlayerStore } from '@/store/usePlayerStore'
import { Music, Loader2, Check, Camera, Upload } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const { isSignedIn, user, isLoaded } = useUser()
  const { setDisplayName, setAvatarUrl } = usePlayerStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(user?.fullName || user?.username || '')
  const [bio, setBio] = useState('')
  const [wantArtist, setWantArtist] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.imageUrl || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push('/sign-in')
  }, [isLoaded, isSignedIn, router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    setError('')
    try {
      let avatarUrl = user?.imageUrl || ''
      if (avatarFile) {
        const formData = new FormData()
        formData.append('file', avatarFile)
        const uploadRes = await fetch('/api/storage/upload', { method: 'POST', body: formData })
        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          avatarUrl = url
        }
      }

      setDisplayName(name || user?.username || 'User')
      if (avatarUrl) setAvatarUrl(avatarUrl)

      if (wantArtist) {
        await fetch('/api/artist/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: name, bio, avatarUrl }) })
      }

      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome!</h1>
          <p className="text-sm text-zinc-400 mt-1">Set up your profile</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">{error}</div>
        )}

        {/* Step 1: Profile Picture */}
        {step === 0 && (
          <div className="space-y-6 text-center">
            <p className="text-sm text-zinc-400">Choose a profile picture</p>
            <label className="relative inline-block cursor-pointer group">
              <div className="w-28 h-28 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-white/10 group-hover:border-white/30 transition-all">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-zinc-500" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all">Skip</button>
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all">Next</button>
            </div>
          </div>
        )}

        {/* Step 2: Display Name */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Display Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="Your name" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Bio (optional)</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} rows={3} placeholder="Tell the world about yourself..." className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 text-sm resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all">Back</button>
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all">Next</button>
            </div>
          </div>
        )}

        {/* Step 3: Artist? */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-4">
              <Music className="w-10 h-10 text-zinc-400 mx-auto" />
              <h2 className="text-lg font-bold text-white">Are you an artist?</h2>
              <p className="text-sm text-zinc-400">Upload your own music, get a verified profile, and share with the world.</p>
              <div className="flex gap-3">
                <button onClick={() => { setWantArtist(false); setStep(3) }} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all">Listener</button>
                <button onClick={() => { setWantArtist(true); setStep(3) }} className="flex-1 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all">I'm an Artist</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white">You're all set!</h2>
            <p className="text-sm text-zinc-400">
              {wantArtist ? 'Your artist profile is ready. Start uploading your music!' : 'Start exploring and listening to music.'}
            </p>
            <button onClick={handleFinish} disabled={loading} className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Setting up...' : 'Get Started'}
            </button>
          </div>
        )}

        {/* Step indicators */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${step === i ? 'bg-white w-6' : step > i ? 'bg-green-400' : 'bg-zinc-700'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
