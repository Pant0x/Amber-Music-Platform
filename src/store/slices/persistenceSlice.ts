import type { StateCreator } from "zustand";
import type { Track, PlayHistoryItem } from "../types";

export interface PersistenceState {
  autoplayQueue: Track[];
  playHistory: PlayHistoryItem[];
  recentSearches: string[];
  lastVolume: number;
  lastQuality: string;
  lastOutputDevice: string | null;
  sessionRestored: boolean;
  setAutoplayQueue: (tracks: Track[]) => void;
  addToPlayHistory: (item: PlayHistoryItem) => void;
  clearPlayHistory: () => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setLastVolume: (volume: number) => void;
  setLastQuality: (quality: string) => void;
  setLastOutputDevice: (deviceId: string | null) => void;
  setSessionRestored: (restored: boolean) => void;
}

export const createPersistenceSlice: StateCreator<
  PersistenceState,
  [],
  [],
  PersistenceState
> = (set, get) => ({
  autoplayQueue: [],
  playHistory: [],
  recentSearches: [],
  lastVolume: 0.8,
  lastQuality: "high",
  lastOutputDevice: null,
  sessionRestored: false,

  setAutoplayQueue: (autoplayQueue) => set({ autoplayQueue }),

  addToPlayHistory: (item) =>
    set((state) => ({
      playHistory: [item, ...state.playHistory.filter((h) => h.track.id !== item.track.id)].slice(0, 100),
    })),

  clearPlayHistory: () => set({ playHistory: [] }),

  addRecentSearch: (query) =>
    set((state) => {
      const trimmed = query.trim();
      if (!trimmed) return state;
      return {
        recentSearches: [trimmed, ...state.recentSearches.filter((q) => q !== trimmed)].slice(0, 20),
      };
    }),

  clearRecentSearches: () => set({ recentSearches: [] }),

  setLastVolume: (lastVolume) => set({ lastVolume }),
  setLastQuality: (lastQuality) => set({ lastQuality }),
  setLastOutputDevice: (lastOutputDevice) => set({ lastOutputDevice }),
  setSessionRestored: (sessionRestored) => set({ sessionRestored }),
});