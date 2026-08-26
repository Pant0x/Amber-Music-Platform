// Theme Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface ThemeSettings {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeSettings = create<ThemeSettings>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "amber-theme",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydrateTheme() {
  // Called on app startup
}

export function applyTheme() {
  const theme = useThemeSettings.getState().theme;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme === "system") {
    root.classList.add(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  } else {
    root.classList.add(theme);
  }
}

export function watchSystemTheme() {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", () => {
    const theme = useThemeSettings.getState().theme;
    if (theme === "system") {
      applyTheme();
    }
  });
}