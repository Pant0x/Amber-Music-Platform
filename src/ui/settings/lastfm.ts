// Last.fm Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface LastFmSettings {
  enabled: boolean;
  username: string;
  password: string;
  scrobbling: boolean;
  nowPlaying: boolean;
  setEnabled: (enabled: boolean) => void;
  setCredentials: (username: string, password: string) => void;
  setScrobbling: (enabled: boolean) => void;
  setNowPlaying: (enabled: boolean) => void;
}

export const useLastFmSettings = create<LastFmSettings>()(
  persist(
    (set) => ({
      enabled: false,
      username: "",
      password: "",
      scrobbling: true,
      nowPlaying: true,
      setEnabled: (enabled) => set({ enabled }),
      setCredentials: (username, password) => set({ username, password }),
      setScrobbling: (scrobbling) => set({ scrobbling }),
      setNowPlaying: (nowPlaying) => set({ nowPlaying }),
    }),
    {
      name: "amber-lastfm",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useLastFmScrobblingEnabled() {
  return useLastFmSettings((s) => s.enabled && s.scrobbling);
}

export class LastFmService {
  private static instance: LastFmService;
  private apiKey = "your-api-key";
  private apiSecret = "your-api-secret";

  static getInstance() {
    if (!LastFmService.instance) {
      LastFmService.instance = new LastFmService();
    }
    return LastFmService.instance;
  }

  async scrobble(track: any) {
    const { enabled, username, scrobbling } = useLastFmSettings.getState();
    if (!enabled || !scrobbling || !username) return;

    // Implement Last.fm scrobbling
    console.log("Scrobbling:", track.title, track.channelTitle);
  }

  async updateNowPlaying(track: any) {
    const { enabled, username, nowPlaying } = useLastFmSettings.getState();
    if (!enabled || !nowPlaying || !username) return;

    // Implement Last.fm now playing
    console.log("Now playing:", track.title, track.channelTitle);
  }
}