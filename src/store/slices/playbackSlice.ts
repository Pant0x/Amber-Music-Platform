import { createSlice, type StateCreator } from "zustand";
import type { Track, QueueItem } from "../types";

export interface PlaybackState {
  currentTrack: Track | null;
  queue: QueueItem[];
  queueIndex: number;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  crossfade: number;
  playbackRate: number;
  setCurrentTrack: (track: Track | null) => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track, position?: "next" | "end") => void;
  removeFromQueue: (queueId: string) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setQueueIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: "off" | "all" | "one") => void;
  setCrossfade: (crossfade: number) => void;
  setPlaybackRate: (rate: number) => void;
}

const createQueueItem = (track: Track): QueueItem => ({
  ...track,
  queueId: `${track.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  addedAt: Date.now(),
});

export const createPlaybackSlice: StateCreator<
  PlaybackState,
  [["zustand/immer", never]],
  [],
  PlaybackState
> = (set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  duration: 0,
  shuffle: false,
  repeat: "off",
  crossfade: 0,
  playbackRate: 1,

  setCurrentTrack: (track) => set({ currentTrack: track }),

  setQueue: (tracks, startIndex = 0) =>
    set({
      queue: tracks.map(createQueueItem),
      queueIndex: startIndex,
      currentTrack: tracks[startIndex] ?? null,
    }),

  addToQueue: (track, position = "end") =>
    set((state) => {
      const item = createQueueItem(track);
      if (position === "next") {
        const newQueue = [...state.queue];
        newQueue.splice(state.queueIndex + 1, 0, item);
        return { queue: newQueue };
      }
      return { queue: [...state.queue, item] };
    }),

  removeFromQueue: (queueId) =>
    set((state) => {
      const index = state.queue.findIndex((t) => t.queueId === queueId);
      if (index === -1) return state;
      const newQueue = state.queue.filter((t) => t.queueId !== queueId);
      let newIndex = state.queueIndex;
      if (index < state.queueIndex) newIndex--;
      else if (index === state.queueIndex && newQueue.length > 0) {
        newIndex = Math.min(newIndex, newQueue.length - 1);
      }
      return {
        queue: newQueue,
        queueIndex: newIndex,
        currentTrack: newQueue[newIndex] ?? null,
      };
    }),

  reorderQueue: (fromIndex, toIndex) =>
    set((state) => {
      const newQueue = [...state.queue];
      const [item] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, item);
      let newIndex = state.queueIndex;
      if (state.queueIndex === fromIndex) newIndex = toIndex;
      else if (fromIndex < state.queueIndex && toIndex >= state.queueIndex) newIndex--;
      else if (fromIndex > state.queueIndex && toIndex <= state.queueIndex) newIndex++;
      return { queue: newQueue, queueIndex: newIndex };
    }),

  clearQueue: () =>
    set({ queue: [], queueIndex: -1, currentTrack: null }),

  nextTrack: () =>
    set((state) => {
      if (state.queue.length === 0) return state;
      let nextIndex = state.queueIndex + 1;
      if (nextIndex >= state.queue.length) {
        if (state.repeat === "all") nextIndex = 0;
        else return { isPlaying: false };
      }
      return { queueIndex: nextIndex, currentTrack: state.queue[nextIndex], progress: 0 };
    }),

  prevTrack: () =>
    set((state) => {
      if (state.queue.length === 0) return state;
      let prevIndex = state.queueIndex - 1;
      if (prevIndex < 0) {
        if (state.repeat === "all") prevIndex = state.queue.length - 1;
        else return state;
      }
      return { queueIndex: prevIndex, currentTrack: state.queue[prevIndex], progress: 0 };
    }),

  setQueueIndex: (index) =>
    set((state) => {
      if (index < 0 || index >= state.queue.length) return state;
      return { queueIndex: index, currentTrack: state.queue[index], progress: 0 };
    }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),

  setShuffle: (shuffle) => set({ shuffle }),
  setRepeat: (repeat) => set({ repeat }),
  setCrossfade: (crossfade) => set({ crossfade }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
});