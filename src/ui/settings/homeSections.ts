// Home Sections Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface HomeSectionSettings {
  sections: string[];
  order: string[];
  setSections: (sections: string[]) => void;
  setOrder: (order: string[]) => void;
}

export const useHomeSectionSettings = create<HomeSectionSettings>()(
  persist(
    (set) => ({
      sections: ["hero", "quickActions", "recommendations", "recentlyPlayed"],
      order: ["hero", "quickActions", "recommendations", "recentlyPlayed"],
      setSections: (sections) => set({ sections }),
      setOrder: (order) => set({ order }),
    }),
    {
      name: "amber-home-sections",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydrateHomeSectionSettings() {
  // Called on app startup
}