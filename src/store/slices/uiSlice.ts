import type { StateCreator } from 'zustand'
import type { StoreState, UISlice } from '@/store/types'

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (set, get) => ({
  showQueuePanel: false,
  rightSidebarView: 'now-playing',
  showNowPlaying: false,
  nowPlayingTab: 'upnext',
  isMinimized: false,
  hideExplicit: false,

  toggleQueuePanel: () => set((state) => ({ showQueuePanel: !state.showQueuePanel })),
  setRightSidebarView: (view) => set({ rightSidebarView: view }),

  setShowNowPlaying: (showNowPlaying) => set((state) => ({
    showNowPlaying,
    isMinimized: showNowPlaying ? false : state.isMinimized
  })),

  toggleNowPlaying: () => set((state) => ({ showNowPlaying: !state.showNowPlaying })),

  setNowPlayingTab: (nowPlayingTab) => set({ nowPlayingTab }),
  setIsMinimized: (isMinimized) => set({ isMinimized }),
  toggleMinimized: () => set((state) => ({ isMinimized: !state.isMinimized })),
  toggleHideExplicit: () => set((state) => ({ hideExplicit: !state.hideExplicit })),
});
