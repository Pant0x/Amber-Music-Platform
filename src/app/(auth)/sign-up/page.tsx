'use client'

import { SignUp } from '@clerk/nextjs'
import { Star } from 'lucide-react'

const clerkAppearance = {
  elements: {
    card: 'bg-zinc-900/90 shadow-2xl border border-white/8 rounded-3xl backdrop-blur-xl',
    headerTitle: 'text-white font-extrabold text-xl tracking-tight',
    headerSubtitle: 'text-zinc-400 text-sm',
    socialButtonsBlockButton:
      'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 rounded-xl font-semibold transition-all',
    socialButtonsBlockButtonText: 'text-white font-semibold',
    socialButtonsBlockButtonArrow: 'text-zinc-400',
    dividerLine: 'bg-white/8',
    dividerText: 'text-zinc-600 text-xs',
    formFieldLabel: 'text-zinc-400 text-[11px] font-bold uppercase tracking-wider',
    formFieldInput:
      'bg-zinc-800/80 border-white/10 text-white rounded-xl focus:border-[#E88EAC]/50 focus:ring-2 focus:ring-[#E88EAC]/10 placeholder-zinc-600 transition-all',
    formButtonPrimary:
      'bg-white text-black hover:bg-zinc-100 rounded-xl font-extrabold shadow-lg transition-all active:scale-[0.98]',
    footerActionLink: 'text-[#E88EAC] font-semibold hover:text-[#e27396]',
    footerActionText: 'text-zinc-500',
    identityPreviewText: 'text-white',
    identityPreviewEditButton: 'text-[#E88EAC] hover:text-[#e27396]',
    formResendCodeLink: 'text-[#E88EAC] hover:text-[#e27396]',
    otpCodeFieldInput: 'bg-zinc-800 border-white/10 text-white rounded-xl focus:border-[#E88EAC]/50',
    alternativeMethodsBlockButton: 'text-zinc-400 hover:text-white border-white/10',
  },
  layout: {
    socialButtonsPlacement: 'top' as const,
  },
}

export default function SignUpPage() {
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
        <span className="text-white font-extrabold text-2xl tracking-tight">Sonora</span>
      </div>

      {/* Heading */}
      <div className="relative z-10 text-center mb-6 space-y-1.5">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Join Sonora</h1>
        <p className="text-zinc-400 text-sm">Free music streaming · No subscription needed</p>
      </div>

      {/* Clerk card */}
      <div className="relative z-10 w-full max-w-sm">
        <SignUp appearance={clerkAppearance as any} />
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-[11px] text-zinc-700 text-center">
        Free forever · No credit card required
      </p>
    </div>
  )
}
