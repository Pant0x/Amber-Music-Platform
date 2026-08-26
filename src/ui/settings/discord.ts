// Discord Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface DiscordSettings {
  enabled: boolean;
  showPlayback: boolean;
  showTimestamps: boolean;
  setEnabled: (enabled: boolean) => void;
  setShowPlayback: (show: boolean) => void;
  setShowTimestamps: (show: boolean) => void;
}

export const useDiscordSettings = create<DiscordSettings>()(
  persist(
    (set) => ({
      enabled: true,
      showPlayback: true,
      showTimestamps: true,
      setEnabled: (enabled) => set({ enabled }),
      setShowPlayback: (showPlayback) => set({ showPlayback }),
      setShowTimestamps: (showTimestamps) => set({ showTimestamps }),
    }),
    {
      name: "amber-discord",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export class DiscordRpcService {
  private static instance: DiscordRpcService;
  private clientId = "your-discord-client-id";
  private connected = false;

  static getInstance() {
    if (!DiscordRpcService.instance) {
      DiscordRpcService.instance = new DiscordRpcService();
    }
    return DiscordRpcService.instance;
  }

  static async init() {
    const { enabled } = useDiscordSettings.getState();
    if (!enabled) return;

    // Initialize Discord RPC
    console.log("Discord RPC initialized");
  }

  static async setActivity(
    state?: string,
    details?: string,
    largeImage?: string,
    largeText?: string,
    smallImage?: string,
    smallText?: string,
    startTimestamp?: number,
    endTimestamp?: number
  ) {
    const { enabled, showPlayback, showTimestamps } = useDiscordSettings.getState();
    if (!enabled) return;

    console.log("Setting Discord activity:", details, state);
  }

  static async clearActivity() {
    console.log("Clearing Discord activity");
  }

  static status() {
    return { connected: false };
  }
}