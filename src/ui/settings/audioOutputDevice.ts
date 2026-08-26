// Audio Output Device Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AudioOutputDeviceSettings {
  deviceId: string | null;
  setDeviceId: (deviceId: string | null) => void;
}

export const useAudioOutputDeviceSettings = create<AudioOutputDeviceSettings>()(
  persist(
    (set) => ({
      deviceId: null,
      setDeviceId: (deviceId) => set({ deviceId }),
    }),
    {
      name: "amber-audio-output-device",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydrateAudioOutputDevice() {
  // Called on app startup
}