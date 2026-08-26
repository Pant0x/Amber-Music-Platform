// Session Restore Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SessionRestoreSettings {
  enabled: boolean;
  restoreQueue: boolean;
  restorePosition: boolean;
  restoreVolume: boolean;
  setEnabled: (enabled: boolean) => void;
  setRestoreQueue: (restore: boolean) => void;
  setRestorePosition: (restore: boolean) => void;
  setRestoreVolume: (restore: boolean) => void;
}

export const useSessionRestoreSettings = create<SessionRestoreSettings>()(
  persist(
    (set) => ({
      enabled: true,
      restoreQueue: true,
      restorePosition: true,
      restoreVolume: true,
      setEnabled: (enabled) => set({ enabled }),
      setRestoreQueue: (restoreQueue) => set({ restoreQueue }),
      setRestorePosition: (restorePosition) => set({ restorePosition }),
      setRestoreVolume: (restoreVolume) => set({ restoreVolume }),
    }),
    {
      name: "amber-session-restore",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydrateSessionRestoreSetting() {
  // Called on app startup
}