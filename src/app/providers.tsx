'use client'

import { AuthProvider } from '@/lib/auth-context'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/context/ThemeContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </ErrorBoundary>
    </AuthProvider>
  )
}