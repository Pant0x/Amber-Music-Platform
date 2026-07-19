import type { StateCreator } from 'zustand'
import type { Track } from '@/types/music-player'
import type { StoreState, PlaybackSlice } from '@/store/types'

export const createPlaybackSlice: StateCreator<StoreState, [], [], PlaybackSlice> = (set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 1,
  queue: [],
  history: [],
  repeatMode: 'none',
  setRepeatMode: (repeatMode) => set({ repeatMode }),
  contextQueue: [],
  playedSeconds: 0,
  duration: 0,
  seekTrigger: null,

  setPlayedSeconds: (playedSeconds) => set({ playedSeconds }),
  setDuration: (duration) => set({ duration }),
  setSeekTrigger: (seekTrigger) => set({ seekTrigger }),

  setYoutubeIdForCurrentTrack: (youtubeId) => {
    set((state) => {
      if (!state.currentTrack) return state;
      return {
        currentTrack: {
          ...state.currentTrack,
          youtubeId
        }
      };
    });
    get().fetchAutoplayQueue(youtubeId);
  },

  enrichCurrentTrack: (metadata) => set((state) => {
    if (!state.currentTrack) return state;
    return {
      currentTrack: {
        ...state.currentTrack,
        ...(metadata.title !== undefined && { title: metadata.title }),
        ...(metadata.channelTitle !== undefined && { channelTitle: metadata.channelTitle }),
        ...(metadata.isExplicit !== undefined && { isExplicit: metadata.isExplicit }),
        ...(metadata.thumbnailUrl && { thumbnailUrl: metadata.thumbnailUrl }),
        ...(metadata.albumName && { albumName: metadata.albumName }),
        ...(metadata.albumId && { albumId: metadata.albumId }),
        ...(metadata.duration && { duration: metadata.duration }),
        ...(metadata.type && { type: metadata.type }),
        isEnriched: true
      }
    };
  }),

  playTrack: (track, contextTracks = []) => {
    set((state) => {
      let newQueue: Track[] = state.queue;
      let newHistory = state.history;

      if (contextTracks.length > 0) {
        const idx = contextTracks.findIndex((t: Track) => t.id === track.id);
        if (idx !== -1) {
          newQueue = contextTracks.slice(idx + 1);
          const prevContextTracks = contextTracks.slice(0, idx).reverse();
          newHistory = [...prevContextTracks, ...state.history.filter(t => !contextTracks.some(ct => ct.id === t.id))].slice(0, 50);
        } else {
          newQueue = contextTracks;
        }
      } else {
        if (state.currentTrack) {
          newHistory = [state.currentTrack, ...state.history.filter(t => t.id !== state.currentTrack?.id)].slice(0, 50);
        }
      }

      return {
        currentTrack: track,
        isPlaying: true,
        history: newHistory,
        queue: newQueue,
        contextQueue: contextTracks.length > 0 ? contextTracks : state.contextQueue,
        seekTrigger: null
      };
    });

    const resolvedId = track.youtubeId || (track.origin === 'youtube' ? track.id : null);
    if (resolvedId) {
      get().fetchAutoplayQueue(resolvedId);
    }
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => set({ volume }),

  addToQueue: (track) => set((state) => ({
    queue: [...state.queue, track]
  })),

  removeFromQueue: (id) => set((state) => {
    const index = state.queue.findIndex(t => t.id === id);
    if (index === -1) return state;
    const newQueue = [...state.queue];
    newQueue.splice(index, 1);
    return { queue: newQueue };
  }),

  clearQueue: () => set({ queue: [] }),

  playNext: (track) => set((state) => {
    const filteredQueue = state.queue.filter(t => t.id !== track.id);
    return { queue: [track, ...filteredQueue] };
  }),

  nextTrack: () => {
    const state = get();
    if (state.queue.length > 0) {
      const next = state.queue[0];
      state.playTrack(next, state.queue);
    } else if (state.repeatMode === 'all' && state.contextQueue.length > 0) {
      const next = state.contextQueue[0];
      state.playTrack(next, state.contextQueue);
    } else if (state.isAutoplayEnabled && state.autoplayQueue.length > 0) {
      const next = state.autoplayQueue[0];
      const newAutoplay = state.autoplayQueue.slice(1);
      state.playTrack(next);
      set({
        autoplayQueue: newAutoplay,
        history: state.currentTrack
          ? [state.currentTrack, ...state.history.filter(t => t.id !== state.currentTrack?.id)].slice(0, 50)
          : state.history
      });
    } else {
      set({ isPlaying: false, playedSeconds: 0 });
    }
  },

  prevTrack: () => {
    const state = get();
    if (state.history.length > 0) {
      const prev = state.history[0];
      const newHistory = state.history.slice(1);
      set({
        currentTrack: prev,
        isPlaying: true,
        history: newHistory,
        queue: state.currentTrack ? [state.currentTrack, ...state.queue] : state.queue
      });
      const resolvedId = prev.youtubeId || (prev.origin === 'youtube' ? prev.id : null);
      if (resolvedId) {
        get().fetchAutoplayQueue(resolvedId);
      }
    }
  },
});
