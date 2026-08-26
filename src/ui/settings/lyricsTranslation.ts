// Lyrics Translation Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface LyricsTranslationSettings {
  language: string;
  showTranslation: boolean;
  setLanguage: (language: string) => void;
  setShowTranslation: (show: boolean) => void;
}

export const useLyricsTranslationSettings = create<LyricsTranslationSettings>()(
  persist(
    (set) => ({
      language: "en",
      showTranslation: false,
      setLanguage: (language) => set({ language }),
      setShowTranslation: (showTranslation) => set({ showTranslation }),
    }),
    {
      name: "amber-lyrics-translation",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydrateLyricsTranslation() {
  // Called on app startup
}