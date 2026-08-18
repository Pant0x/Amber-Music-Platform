export interface AmberMusicBridge {
  isDesktop: boolean
  onAuthLink: (callback: (url: string) => void) => void
  openExternal: (url: string) => void
}

declare global {
  interface Window {
    amberMusic?: AmberMusicBridge
  }
}

export {}