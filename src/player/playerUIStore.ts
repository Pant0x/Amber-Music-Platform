// Player UI Store
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface PlayerUIState {
  expanded: boolean;
  showQueue: boolean;
  showLyrics: boolean;
  setExpanded: (expanded: boolean) => void;
  setShowQueue: (show: boolean) => void;
  setShowLyrics: (show: boolean) => void;
}

export const usePlayerUIStore = create<PlayerUIState>()(
  persist(
    (set) => ({
      expanded: false,
      showQueue: false,
      showLyrics: false,
      setExpanded: (expanded) => set({ expanded }),
      setShowQueue: (showQueue) => set({ showQueue }),
      setShowLyrics: (showLyrics) => set({ showLyrics }),
    }),
    {
      name: "amber-player-ui",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function usePlayerUIState() {
  return usePlayerUIStore((s) => ({
    expanded: s.expanded,
    showQueue: s.showQueue,
    showLyrics: s.showLyrics,
    setExpanded: s.setExpanded,
    setShowQueue: s.setShowQueue,
    setShowLyrics: s.setShowLyrics,
  }));
}