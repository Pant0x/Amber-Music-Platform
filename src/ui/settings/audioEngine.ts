// Audio Engine Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AudioEngineSettings {
  engine: "web" | "rust";
  bitrate: number;
  sampleRate: number;
  bufferSize: number;
  setEngine: (engine: "web" | "rust") => void;
  setBitrate: (bitrate: number) => void;
  setSampleRate: (sampleRate: number) => void;
  setBufferSize: (bufferSize: number) => void;
}

export const useAudioEngineSettings = create<AudioEngineSettings>()(
  persist(
    (set) => ({
      engine: "web",
      bitrate: 320,
      sampleRate: 48000,
      bufferSize: 4096,
      setEngine: (engine) => set({ engine }),
      setBitrate: (bitrate) => set({ bitrate }),
      setSampleRate: (sampleRate) => set({ sampleRate }),
      setBufferSize: (bufferSize) => set({ bufferSize }),
    }),
    {
      name: "amber-audio-engine",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydrateAudioEngineMode() {
  // Called on app startup
}

export const AUDIO_ENGINE_MODE_CHANGE_EVENT = "audio-engine-mode-change";

export function usesNativeAudioEngine(): boolean {
  return false;
}

export function usesRustAudioEngine(): boolean {
  return false;
}

export function getAudioEngineMode(): string {
  return "web";
}