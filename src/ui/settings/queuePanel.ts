// Queue Panel Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface QueuePanelSettings {
  collapsed: boolean;
  showArtwork: boolean;
  showDuration: boolean;
  showArtist: boolean;
  setCollapsed: (collapsed: boolean) => void;
  setShowArtwork: (show: boolean) => void;
  setShowDuration: (show: boolean) => void;
  setShowArtist: (show: boolean) => void;
}

export const useQueuePanelSettings = create<QueuePanelSettings>()(
  persist(
    (set) => ({
      collapsed: false,
      showArtwork: true,
      showDuration: true,
      showArtist: true,
      setCollapsed: (collapsed) => set({ collapsed }),
      setShowArtwork: (showArtwork) => set({ showArtwork }),
      setShowDuration: (showDuration) => set({ showDuration }),
      setShowArtist: (showArtist) => set({ showArtist }),
    }),
    {
      name: "amber-queue-panel",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useQueuePanelCollapsed() {
  return useQueuePanelSettings((s) => s.collapsed);
}