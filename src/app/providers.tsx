'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/context/ThemeContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ErrorBoundary>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </ErrorBoundary>
    </ClerkProvider>
  )
}