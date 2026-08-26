// Play History Settings
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

interface PlayHistorySettings {
  history: PlayHistoryItem[];
  addItem: (item: PlayHistoryItem) => void;
  clear: () => void;
}

export const usePlayHistorySettings = create<PlayHistorySettings>()(
  persist(
    (set, get) => ({
      history: [],
      addItem: (item) =>
        set((state) => ({
          history: [
            item,
            ...state.history.filter((h) => h.trackId !== item.trackId),
          ].slice(0, 500),
        })),
      clear: () => set({ history: [] }),
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