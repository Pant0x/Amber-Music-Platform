// Play History
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface PlayHistoryItem {
  trackId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  playedAt: string;
  progress: number;
  duration: number;
}

interface PlayHistoryState {
  history: PlayHistoryItem[];
  addItem: (item: PlayHistoryItem) => void;
  clear: () => void;
  getRecent: (limit?: number) => PlayHistoryItem[];
}

export const usePlayHistoryStore = create<PlayHistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      addItem: (item) =>
        set((state) => ({
          history: [item, ...state.history.filter((h) => h.trackId !== item.trackId)].slice(0, 1000),
        })),
      clear: () => set({ history: [] }),
      getRecent: (limit = 50) => get().history.slice(0, limit),
    }),
    {
      name: "amber-play-history",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydratePlayHistory() {
  // Called on app startup
}