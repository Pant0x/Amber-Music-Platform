// YouTube Account Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface YouTubeAccountSettings {
  signedIn: boolean;
  email: string;
  channelId: string;
  setSignedIn: (signedIn: boolean) => void;
  setEmail: (email: string) => void;
  setChannelId: (channelId: string) => void;
}

export const useYouTubeAccountSettings = create<YouTubeAccountSettings>()(
  persist(
    (set) => ({
      signedIn: false,
      email: "",
      channelId: "",
      setSignedIn: (signedIn) => set({ signedIn }),
      setEmail: (email) => set({ email }),
      setChannelId: (channelId) => set({ channelId }),
    }),
    {
      name: "amber-youtube-account",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydrateYouTubeAccountSettings() {
  // Called on app startup
}