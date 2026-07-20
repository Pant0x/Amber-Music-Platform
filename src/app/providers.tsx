'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const clerkAppearance = {
  variables: {
    colorPrimary: '#E88EAC',
    colorBackground: '#0a0a0a',
    colorInputBackground: '#121212',
    colorText: '#ffffff',
    colorTextSecondary: '#a1a1aa',
    colorTextOnPrimaryBackground: '#ffffff',
  },
  elements: {
    card: 'bg-zinc-950 border border-white/5 rounded-3xl shadow-2xl backdrop-blur-xl',
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
      'bg-zinc-900 border-white/10 text-white rounded-xl focus:border-[#E88EAC]/50 focus:ring-2 focus:ring-[#E88EAC]/10 placeholder-zinc-600 transition-all',
    formButtonPrimary:
      'bg-white text-black hover:bg-zinc-100 rounded-xl font-extrabold shadow-lg transition-all active:scale-[0.98]',
    footerActionLink: 'text-[#E88EAC] font-semibold hover:text-[#e27396]',
    footerActionText: 'text-zinc-500',
    identityPreviewText: 'text-white',
    identityPreviewEditButton: 'text-[#E88EAC] hover:text-[#e27396]',
    formResendCodeLink: 'text-[#E88EAC] hover:text-[#e27396]',
    otpCodeFieldInput: 'bg-zinc-900 border-white/10 text-white rounded-xl focus:border-[#E88EAC]/50',
    alternativeMethodsBlockButton: 'text-zinc-400 hover:text-white border-white/10',
  },
  layout: {
    socialButtonsPlacement: 'top' as const,
  },
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance as any}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ClerkProvider>
  )
}
