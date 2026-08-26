// Render Effects Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface RenderEffectsSettings {
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
}

export const useRenderEffectsSettings = create<RenderEffectsSettings>()(
  persist(
    (set) => ({
      reducedMotion: false,
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    }),
    {
      name: "amber-render-effects",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useReduceMotion() {
  return useRenderEffectsSettings((s) => s.reducedMotion);
}

export function hydrateRenderEffects() {
  // Called on app startup
}

export function applyRenderEffects() {
  const reduced = useRenderEffectsSettings.getState().reducedMotion;
  if (reduced) {
    document.documentElement.classList.add("reduce-motion");
  } else {
    document.documentElement.classList.remove("reduce-motion");
  }
}