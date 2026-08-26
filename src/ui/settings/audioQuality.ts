// Audio Quality Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AudioQuality = "low" | "normal" | "high" | "lossless";

interface AudioQualitySettings {
  streaming: AudioQuality;
  download: AudioQuality;
  setStreaming: (quality: AudioQuality) => void;
  setDownload: (quality: AudioQuality) => void;
}

export const useAudioQualitySettings = create<AudioQualitySettings>()(
  persist(
    (set) => ({
      streaming: "high",
      download: "high",
      setStreaming: (streaming) => set({ streaming }),
      setDownload: (download) => set({ download }),
    }),
    {
      name: "amber-audio-quality",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydrateAudioQualitySettings() {
  // Called on app startup
}