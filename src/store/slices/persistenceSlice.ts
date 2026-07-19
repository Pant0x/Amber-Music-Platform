import type { StateCreator } from 'zustand'
import type { Track } from '@/types/music-player'
import type { StoreState, PersistenceSlice } from '@/store/types'

export const createPersistenceSlice: StateCreator<StoreState, [], [], PersistenceSlice> = (set, get) => ({
  _hasHydrated: false,
  autoplayQueue: [],
  isAutoplayEnabled: true,

  setHasHydrated: (state) => set({ _hasHydrated: state }),

  toggleAutoplay: () => set((state) => ({ isAutoplayEnabled: !state.isAutoplayEnabled })),
  setAutoplayQueue: (autoplayQueue) => set({ autoplayQueue }),

  fetchAutoplayQueue: async (videoId: string) => {
    try {
      const res = await fetch(`/api/youtube/next?videoId=${encodeURIComponent(videoId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          set({ autoplayQueue: data });
        }
      }
    } catch (err) {
      console.error('[Store Autoplay] Failed to fetch autoplay next tracks:', err);
    }
  },
});
