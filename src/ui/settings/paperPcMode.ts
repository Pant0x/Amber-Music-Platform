// Paper PC Mode Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface PaperPcModeSettings {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const usePaperPcModeSettings = create<PaperPcModeSettings>()(
  persist(
    (set) => ({
      enabled: false,
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: "amber-paper-pc-mode",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydratePaperPcMode() {
  // Called on app startup
}

export function applyPaperPcMode() {
  const enabled = usePaperPcModeSettings.getState().enabled;
  if (enabled) {
    document.documentElement.classList.add("paper-pc-mode");
  } else {
    document.documentElement.classList.remove("paper-pc-mode");
  }
}