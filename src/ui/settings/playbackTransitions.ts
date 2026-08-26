// Playback Transitions Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface PlaybackTransitionSettings {
  crossfade: number;
  gapless: boolean;
  setCrossfade: (crossfade: number) => void;
  setGapless: (gapless: boolean) => void;
}

export const usePlaybackTransitionSettings = create<PlaybackTransitionSettings>()(
  persist(
    (set) => ({
      crossfade: 0,
      gapless: false,
      setCrossfade: (crossfade) => set({ crossfade }),
      setGapless: (gapless) => set({ gapless }),
    }),
    {
      name: "amber-playback-transitions",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydratePlaybackTransitions() {
  // Called on app startup
}