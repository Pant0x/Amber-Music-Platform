// App Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AppSettingsState {
  settings: Record<string, any>;
  get: (key: string) => any;
  set: (key: string, value: any) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const useAppSettings = create<AppSettingsState>()(
  persist(
    (set, get) => ({
      settings: {},
      get: (key) => get().settings[key],
      set: (key, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        })),
      remove: (key) =>
        set((state) => {
          const newSettings = { ...state.settings };
          delete newSettings[key];
          return { settings: newSettings };
        }),
      clear: () => set({ settings: {} }),
    }),
    {
      name: "amber-app-settings",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function getAppSetting(key: string) {
  return useAppSettings.getState().settings[key];
}

export function setAppSetting(key: string, value: any) {
  useAppSettings.getState().set(key, value);
}

export function removeAppSetting(key: string) {
  useAppSettings.getState().remove(key);
}

export function clearAppSettings() {
  useAppSettings.getState().clear();
}