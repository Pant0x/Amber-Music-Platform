// Lyrics Offset Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface LyricsOffsetSettings {
  offset: number;
  setOffset: (offset: number) => void;
}

export const useLyricsOffsetSettings = create<LyricsOffsetSettings>()(
  persist(
    (set) => ({
      offset: 0,
      setOffset: (offset) => set({ offset }),
    }),
    {
      name: "amber-lyrics-offset",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydrateLyricsOffset() {
  // Called on app startup
}