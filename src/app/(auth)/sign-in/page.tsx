'use client'

import { AuthForm } from '@/components/auth/AuthForm'
import { Star } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,142,172,0.08) 0%, transparent 70%)', animation: 'breathe 7s ease-in-out infinite' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', animation: 'breathe 9s ease-in-out infinite reverse' }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8 flex items-center gap-2.5 select-none">
        <div className="w-9 h-9 rounded-xl bg-[#E88EAC] flex items-center justify-center shadow-lg shadow-[#E88EAC]/30">
          <Star className="w-5 h-5 text-white fill-current" />
        </div>
        <span className="text-white font-extrabold text-2xl tracking-tight">Amber Music</span>
      </div>

      {/* Heading */}
      <div className="relative z-10 text-center mb-6 space-y-1.5">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome back</h1>
        <p className="text-zinc-400 text-sm">Sign in to continue your music journey</p>
      </div>

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-zinc-900/90 shadow-2xl border border-white/8 rounded-3xl backdrop-blur-xl p-6">
          <AuthForm mode="sign-in" />
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-[11px] text-zinc-700 text-center">
        Free forever · No credit card required
      </p>
    </div>
  )
}