// Playback Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface PlaybackSettingsState {
  crossfade: number;
  gapless: boolean;
  normalization: boolean;
  setCrossfade: (value: number) => void;
  setGapless: (value: boolean) => void;
  setNormalization: (value: boolean) => void;
}

export const usePlaybackSettingsStore = create<PlaybackSettingsState>()(
  persist(
    (set) => ({
      crossfade: 0,
      gapless: false,
      normalization: false,
      setCrossfade: (crossfade) => set({ crossfade }),
      setGapless: (gapless) => set({ gapless }),
      setNormalization: (normalization) => set({ normalization }),
    }),
    {
      name: "amber-playback-settings",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydratePlaybackSettings() {
  // Called on app startup
}