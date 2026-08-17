'use client'

import { useTheme } from '@/context/ThemeContext'
import { Monitor, Frame } from 'lucide-react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-sm transition-all cursor-pointer"
      title={`Switch to ${theme === 'sonora' ? 'Retro KIWI' : 'Sonora'} theme`}
    >
      {theme === 'sonora' ? (
        <>
          <Frame className="w-4 h-4" />
          <span>KIWI Mode</span>
        </>
      ) : (
        <>
          <Monitor className="w-4 h-4" />
          <span>Sonora Mode</span>
        </>
      )}
    </button>
  )
}