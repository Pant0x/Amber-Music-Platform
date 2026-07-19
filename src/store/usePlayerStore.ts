import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createJSONStorage } from 'zustand/middleware'
import type { StoreState } from '@/store/types'
import { createPlaybackSlice } from '@/store/slices/playbackSlice'
import { createNavigationSlice } from '@/store/slices/navigationSlice'
import { createCollectionSlice } from '@/store/slices/collectionSlice'
import { createUISlice } from '@/store/slices/uiSlice'
import { createLyricsSlice } from '@/store/slices/lyricsSlice'
import { createPersistenceSlice } from '@/store/slices/persistenceSlice'

export const usePlayerStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createPlaybackSlice(...a),
      ...createNavigationSlice(...a),
      ...createCollectionSlice(...a),
      ...createUISlice(...a),
      ...createLyricsSlice(...a),
      ...createPersistenceSlice(...a),
    }),
    {
      name: 'yt-music-storage-v1',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? sessionStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      } as any)),
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        isPlaying: state.isPlaying,
        volume: state.volume,
        queue: state.queue,
        history: state.history,
        playedSeconds: state.playedSeconds,
        playlists: state.playlists,
        likedTracks: state.likedTracks,
        searchHistory: state.searchHistory,
        subscribedChannels: state.subscribedChannels,
        displayName: state.displayName,
        avatarUrl: state.avatarUrl,
        isMinimized: state.isMinimized,
        hideExplicit: state.hideExplicit
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true)
          try {
            state.setPlaying(false);
            state.setPlayedSeconds(0);
            state.setSeekTrigger(0);
          } catch (e) {
            console.warn('Rehydrate error', e)
          }
        }
      }
    }
  )
)
