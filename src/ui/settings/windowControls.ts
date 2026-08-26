// Window Controls Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface WindowControlSettings {
  nativeControls: boolean;
  trafficLightsPosition: "left" | "right";
  setNativeControls: (enabled: boolean) => void;
  setTrafficLightsPosition: (position: "left" | "right") => void;
}

export const useWindowControlSettings = create<WindowControlSettings>()(
  persist(
    (set) => ({
      nativeControls: true,
      trafficLightsPosition: "left",
      setNativeControls: (nativeControls) => set({ nativeControls }),
      setTrafficLightsPosition: (trafficLightsPosition) => set({ trafficLightsPosition }),
    }),
    {
      name: "amber-window-controls",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useNativeWindowControls() {
  return useWindowControlSettings((s) => s.nativeControls);
}

export function hydrateWindowControlSettings() {
  // Called on app startup
}

export function applyNativeWindowControls() {
  // Called on app startup
}