import type { StateCreator } from 'zustand'
import type { Track } from '@/types/music-player'
import type { StoreState, PlaybackSlice } from '@/store/types'

export const createPlaybackSlice: StateCreator<StoreState, [], [], PlaybackSlice> = (set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.7,
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
      const previous = state.currentTrack;
      let newQueue: Track[] = state.queue;

      if (contextTracks.length > 0) {
        const idx = contextTracks.findIndex((t: Track) => t.id === track.id);
        if (idx !== -1) {
          newQueue = contextTracks.slice(idx + 1);
        } else {
          newQueue = contextTracks;
        }
      }

      // History = actually-played tracks only (never unplayed queue items).
      // The previous current track is pushed first, deduped against the new one.
      let newHistory = state.history;
      if (previous && previous.id !== track.id) {
        newHistory = [previous, ...state.history.filter(t => t.id !== previous.id && t.id !== track.id)].slice(0, 50);
      } else {
        newHistory = state.history.filter(t => t.id !== track.id).slice(0, 50);
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

  addToQueue: (track) => set((state) => {
    const dup = state.queue.some(t => t.id === track.id) || state.currentTrack?.id === track.id;
    if (dup) return state;
    return { queue: [...state.queue, track] };
  }),

  removeFromQueue: (id) => set((state) => {
    const index = state.queue.findIndex(t => t.id === id);
    if (index === -1) return state;
    const newQueue = [...state.queue];
    newQueue.splice(index, 1);
    return { queue: newQueue };
  }),

  clearQueue: () => set({ queue: [] }),

  playNext: (track) => set((state) => {
    const filteredQueue = state.queue.filter(t => t.id !== track.id && t.id !== state.currentTrack?.id);
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
      const newAutoplay = state.autoplayQueue.slice(1).filter(t => t.id !== next.id);
      state.playTrack(next);
      set({
        autoplayQueue: newAutoplay,
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
      const current = state.currentTrack;
      const queueWithoutCurrent = current
        ? state.queue.filter(t => t.id !== current.id)
        : state.queue;
      set({
        currentTrack: prev,
        isPlaying: true,
        history: newHistory,
        queue: queueWithoutCurrent
      });
      const resolvedId = prev.youtubeId || (prev.origin === 'youtube' ? prev.id : null);
      if (resolvedId) {
        get().fetchAutoplayQueue(resolvedId);
      }
    }
  },
});
