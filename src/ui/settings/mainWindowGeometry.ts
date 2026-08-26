// Main Window Geometry Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface WindowGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  maximized: boolean;
  fullscreen: boolean;
}

interface WindowGeometryState {
  geometry: WindowGeometry;
  setGeometry: (geometry: Partial<WindowGeometry>) => void;
  restore: () => void;
}

const DEFAULT_GEOMETRY: WindowGeometry = {
  x: 100,
  y: 100,
  width: 1280,
  height: 900,
  maximized: false,
  fullscreen: false,
};

export const useWindowGeometry = create<WindowGeometryState>()(
  persist(
    (set) => ({
      geometry: DEFAULT_GEOMETRY,
      setGeometry: (geometry) =>
        set((state) => ({
          geometry: { ...state.geometry, ...geometry },
        })),
      restore: () => set({ geometry: DEFAULT_GEOMETRY }),
    }),
    {
      name: "amber-window-geometry",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydrateMainWindowGeometry() {
  // Called on app startup
  return Promise.resolve();
}

export function restoreMainWindowGeometry() {
  // Called after window is created
}

export function persistMainWindowGeometry() {
  // Called when window moves/resizes
}