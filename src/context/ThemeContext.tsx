'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'sonora' | 'kiwi'

interface ThemeProviderProps {
  children: ReactNode
}

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('sonora')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && (savedTheme === 'sonora' || savedTheme === 'kiwi')) {
      setThemeState(savedTheme)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    
    if (theme === 'kiwi') {
      // Apply retro KIWI theme
      root.style.setProperty('--background', '#0A0A0A')
      root.style.setProperty('--foreground', '#FFFFFF')
      root.style.setProperty('--theme-primary', '#3DDC84')
      root.style.setProperty('--theme-accent', '#3DDC84')
      root.style.setProperty('--card-bg', '#1A1A1A')
      root.style.setProperty('--card-hover', '#252525')
      root.style.setProperty('--text-secondary', '#999999')
      
      // Add retro theme class
      root.classList.add('retro-theme')
      document.body.classList.add('retro-theme')
    } else {
      // Apply default Sonora theme
      root.style.setProperty('--background', '#000000')
      root.style.setProperty('--foreground', '#FFFFFF')
      root.style.setProperty('--theme-primary', '#9DD2E6')
      root.style.setProperty('--theme-accent', '#9DD2E6')
      root.style.setProperty('--card-bg', '#0A0A0A')
      root.style.setProperty('--card-hover', '#121212')
      root.style.setProperty('--text-secondary', '#bdbdbd')
      
      // Remove retro theme class
      root.classList.remove('retro-theme')
      document.body.classList.remove('retro-theme')
    }
    
    localStorage.setItem('theme', theme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setThemeState(prev => prev === 'sonora' ? 'kiwi' : 'sonora')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}