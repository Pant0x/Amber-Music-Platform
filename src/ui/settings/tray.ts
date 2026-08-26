// Tray Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface TraySettings {
  enabled: boolean;
  minimizeToTray: boolean;
  closeToTray: boolean;
  showNotifications: boolean;
  setEnabled: (enabled: boolean) => void;
  setMinimizeToTray: (minimize: boolean) => void;
  setCloseToTray: (close: boolean) => void;
  setShowNotifications: (show: boolean) => void;
}

export const useTraySettings = create<TraySettings>()(
  persist(
    (set) => ({
      enabled: true,
      minimizeToTray: true,
      closeToTray: false,
      showNotifications: true,
      setEnabled: (enabled) => set({ enabled }),
      setMinimizeToTray: (minimizeToTray) => set({ minimizeToTray }),
      setCloseToTray: (closeToTray) => set({ closeToTray }),
      setShowNotifications: (showNotifications) => set({ showNotifications }),
    }),
    {
      name: "amber-tray",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydrateTraySettings() {
  // Called on app startup
}