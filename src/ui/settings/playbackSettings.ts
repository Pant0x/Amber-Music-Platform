// Playback Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface PlaybackSettings {
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  crossfade: number;
  playbackRate: number;
  autoPlay: boolean;
  gapless: boolean;
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: "off" | "all" | "one") => void;
  setCrossfade: (crossfade: number) => void;
  setPlaybackRate: (rate: number) => void;
  setAutoPlay: (autoPlay: boolean) => void;
  setGapless: (gapless: boolean) => void;
}

export const usePlaybackSettings = create<PlaybackSettings>()(
  persist(
    (set) => ({
      shuffle: false,
      repeat: "off",
      crossfade: 0,
      playbackRate: 1,
      autoPlay: true,
      gapless: false,
      setShuffle: (shuffle) => set({ shuffle }),
      setRepeat: (repeat) => set({ repeat }),
      setCrossfade: (crossfade) => set({ crossfade }),
      setPlaybackRate: (playbackRate) => set({ playbackRate }),
      setAutoPlay: (autoPlay) => set({ autoPlay }),
      setGapless: (gapless) => set({ gapless }),
    }),
    {
      name: "amber-playback",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydratePlaybackSettings() {
  // Called on app startup
}