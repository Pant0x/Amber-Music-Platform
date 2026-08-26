// Player Controls Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface PlayerControlSettings {
  showVolume: boolean;
  showProgress: boolean;
  showTime: boolean;
  showShuffle: boolean;
  showRepeat: boolean;
  showLyrics: boolean;
  showQueue: boolean;
  setShowVolume: (show: boolean) => void;
  setShowProgress: (show: boolean) => void;
  setShowTime: (show: boolean) => void;
  setShowShuffle: (show: boolean) => void;
  setShowRepeat: (show: boolean) => void;
  setShowLyrics: (show: boolean) => void;
  setShowQueue: (show: boolean) => void;
}

export const usePlayerControlSettings = create<PlayerControlSettings>()(
  persist(
    (set) => ({
      showVolume: true,
      showProgress: true,
      showTime: true,
      showShuffle: true,
      showRepeat: true,
      showLyrics: true,
      showQueue: true,
      setShowVolume: (showVolume) => set({ showVolume }),
      setShowProgress: (showProgress) => set({ showProgress }),
      setShowTime: (showTime) => set({ showTime }),
      setShowShuffle: (showShuffle) => set({ showShuffle }),
      setShowRepeat: (showRepeat) => set({ showRepeat }),
      setShowLyrics: (showLyrics) => set({ showLyrics }),
      setShowQueue: (showQueue) => set({ showQueue }),
    }),
    {
      name: "amber-player-controls",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydratePlayerControlSettings() {
  // Called on app startup
}