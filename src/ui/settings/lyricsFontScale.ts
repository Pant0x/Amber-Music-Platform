// Lyrics Font Scale Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface LyricsFontScaleSettings {
  scale: number;
  setScale: (scale: number) => void;
}

export const useLyricsFontScaleSettings = create<LyricsFontScaleSettings>()(
  persist(
    (set) => ({
      scale: 1,
      setScale: (scale) => set({ scale }),
    }),
    {
      name: "amber-lyrics-font-scale",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydrateLyricsFontScale() {
  // Called on app startup
}