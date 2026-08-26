import { createSlice, type StateCreator } from "zustand";

export type ActiveTab = "home" | "explore" | "library" | "liked" | "playlists" | "artists" | "albums" | "files" | "search" | "settings" | "transfer";

export interface NavigationState {
  activeTab: ActiveTab;
  previousTab: ActiveTab | null;
  history: Array<{ tab: ActiveTab; params?: Record<string, string> }>;
  historyIndex: number;
  channelViewing: string | null;
  setActiveTab: (tab: ActiveTab) => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  setChannelViewing: (channelId: string | null) => void;
  navigateWithParams: (tab: ActiveTab, params?: Record<string, string>) => void;
}

export const createNavigationSlice: StateCreator<
  NavigationState,
  [["zustand/immer", never]],
  [],
  NavigationState
> = (set, get) => ({
  activeTab: "home",
  previousTab: null,
  history: [{ tab: "home" }],
  historyIndex: 0,
  channelViewing: null,

  setActiveTab: (tab) =>
    set((state) => {
      if (state.activeTab === tab) return state;
      return {
        previousTab: state.activeTab,
        activeTab: tab,
        history: state.history.slice(0, state.historyIndex + 1).concat({ tab }),
        historyIndex: state.historyIndex + 1,
      };
    }),

  navigateWithParams: (tab, params) =>
    set((state) => {
      if (state.activeTab === tab) return state;
      return {
        previousTab: state.activeTab,
        activeTab: tab,
        history: state.history.slice(0, state.historyIndex + 1).concat({ tab, params }),
        historyIndex: state.historyIndex + 1,
      };
    }),

  goBack: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        activeTab: state.history[newIndex].tab,
        historyIndex: newIndex,
      };
    }),

  goForward: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        activeTab: state.history[newIndex].tab,
        historyIndex: newIndex,
      };
    }),

  canGoBack: () => get().historyIndex > 0,
  canGoForward: () => get().historyIndex < get().history.length - 1,

  setChannelViewing: (channelId) => set({ channelViewing: channelId }),
});