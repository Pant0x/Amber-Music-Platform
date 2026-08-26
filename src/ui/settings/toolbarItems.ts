// Toolbar Items Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ToolbarItemSettings {
  items: string[];
  setItems: (items: string[]) => void;
}

export const useToolbarItemSettings = create<ToolbarItemSettings>()(
  persist(
    (set) => ({
      items: ["play", "pause", "next", "previous", "shuffle", "repeat", "lyrics", "queue"],
      setItems: (items) => set({ items }),
    }),
    {
      name: "amber-toolbar-items",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydrateToolbarItemSettings() {
  // Called on app startup
}