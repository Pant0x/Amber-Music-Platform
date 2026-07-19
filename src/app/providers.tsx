'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ClerkProvider>
  )
}
