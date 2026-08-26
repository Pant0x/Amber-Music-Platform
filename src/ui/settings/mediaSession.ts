// Media Session Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface MediaSessionSettings {
  enabled: boolean;
  showArtwork: boolean;
  showControls: boolean;
  setEnabled: (enabled: boolean) => void;
  setShowArtwork: (show: boolean) => void;
  setShowControls: (show: boolean) => void;
}

export const useMediaSessionSettings = create<MediaSessionSettings>()(
  persist(
    (set) => ({
      enabled: true,
      showArtwork: true,
      showControls: true,
      setEnabled: (enabled) => set({ enabled }),
      setShowArtwork: (showArtwork) => set({ showArtwork }),
      setShowControls: (showControls) => set({ showControls }),
    }),
    {
      name: "amber-media-session",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useMediaSession() {
  const { enabled, showArtwork, showControls } = useMediaSessionSettings();

  return { enabled, showArtwork, showControls };
}

export function hydrateMediaSessionSettings() {
  // Called on app startup
}