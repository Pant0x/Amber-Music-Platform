'use client'

// Route-group layout for auth pages. The app chrome (sidebar, player, header)
// is hidden via AppLayoutWrapper's auth-page detection, so this shell stays minimal.

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-screen bg-black overflow-hidden">
      {children}
    </div>
  )
}