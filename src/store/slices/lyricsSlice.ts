import type { StateCreator } from 'zustand'
import type { StoreState, LyricsSlice } from '@/store/types'

export const createLyricsSlice: StateCreator<StoreState, [], [], LyricsSlice> = (set) => ({
  globalLyricsData: null,
  globalLyricsLoading: false,

  setGlobalLyricsData: (globalLyricsData) => set({ globalLyricsData }),
  setGlobalLyricsLoading: (globalLyricsLoading) => set({ globalLyricsLoading }),
});
