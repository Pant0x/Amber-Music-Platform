'use client'

// This layout completely replaces the root layout for all auth pages.
// It renders NOTHING except a full-screen branded shell — no sidebar, no player, no header.
// This fixes the broken UI where the main app chrome was visible during onboarding.

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-screen bg-black overflow-hidden">
      {children}
    </div>
  )
}
