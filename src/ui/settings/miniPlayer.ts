// Mini Player Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface MiniPlayerSettings {
  enabled: boolean;
  position: { x: number; y: number };
  setEnabled: (enabled: boolean) => void;
  setPosition: (position: { x: number; y: number }) => void;
}

export const useMiniPlayerSettings = create<MiniPlayerSettings>()(
  persist(
    (set) => ({
      enabled: true,
      position: { x: 100, y: 100 },
      setEnabled: (enabled) => set({ enabled }),
      setPosition: (position) => set({ position }),
    }),
    {
      name: "amber-mini-player",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useMiniPlayerEnabled() {
  return useMiniPlayerSettings((s) => s.enabled);
}

export function useMiniPlayerWindowLive() {
  return useMiniPlayerSettings((s) => s.enabled);
}

export function getSavedMiniPlayerPosition() {
  const settings = localStorage.getItem("amber-mini-player");
  if (settings) {
    try {
      return JSON.parse(settings).state.position;
    } catch {
      return { x: 100, y: 100 };
    }
  }
  return { x: 100, y: 100 };
}

export function saveMiniPlayerPosition(position: { x: number; y: number }) {
  const settings = localStorage.getItem("amber-mini-player");
  if (settings) {
    try {
      const parsed = JSON.parse(settings);
      parsed.state.position = position;
      localStorage.setItem("amber-mini-player", JSON.stringify(parsed));
    } catch {}
  }
}

export function ensureMiniPlayerWindow() {
  // Implemented in Tauri
}

export function destroyMiniPlayerWindow() {
  // Implemented in Tauri
}