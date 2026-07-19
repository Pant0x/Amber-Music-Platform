'use client'

import { SignUp } from '@clerk/nextjs'
import { Music } from 'lucide-react'

const appearance = {
  elements: {
    card: 'bg-zinc-900 shadow-none border border-white/10 rounded-xl',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton: 'bg-white/10 border-white/10 text-white hover:bg-white/20',
    socialButtonsBlockButtonText: 'text-white font-semibold',
    dividerLine: 'bg-white/10',
    dividerText: 'text-zinc-500',
    formFieldLabel: 'text-zinc-400 text-xs font-bold uppercase tracking-wider',
    formFieldInput: 'bg-zinc-900 border-white/10 text-white rounded-xl focus:border-white/30',
    formButtonPrimary: 'bg-white text-black hover:bg-zinc-200 rounded-xl font-bold',
    footerActionLink: 'text-white font-semibold',
    footerActionText: 'text-zinc-500',
  },
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="text-sm text-zinc-400 mt-1">Join the music platform</p>
        </div>
        <SignUp appearance={appearance as any} />
      </div>
    </div>
  )
}
