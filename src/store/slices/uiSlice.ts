import type { StateCreator } from "zustand";

export interface UISliceState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  lyricsOpen: boolean;
  minimized: boolean;
  hideExplicit: boolean;
  theme: "light" | "dark" | "system";
  reducedMotion: boolean;
  compactMode: boolean;
  activeModal: string | null;
  modals: Record<string, boolean>;
  notifications: Array<{ id: string; message: string; type: "info" | "success" | "warning" | "error"; duration?: number }>;
  toggleLeftPanel: () => void;
  setLeftPanel: (open: boolean) => void;
  setLeftPanelOpen: (open: boolean) => void;
  toggleRightPanel: () => void;
  setRightPanel: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleLyrics: () => void;
  setLyricsOpen: (open: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  toggleMinimized: () => void;
  setHideExplicit: (hide: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setReducedMotion: (reduced: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  addNotification: (notification: Omit<UISliceState["notifications"][0], "id">) => void;
  removeNotification: (id: string) => void;
}

export const createUISlice: StateCreator<
  UISliceState,
  [],
  [],
  UISliceState
> = (set, get) => ({
  leftPanelOpen: true,
  rightPanelOpen: false,
  lyricsOpen: false,
  minimized: false,
  hideExplicit: false,
  theme: "system",
  reducedMotion: false,
  compactMode: false,
  activeModal: null,
  modals: {},
  notifications: [],

  toggleLeftPanel: () => set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  setLeftPanel: (leftPanelOpen) => set({ leftPanelOpen }),
  setLeftPanelOpen: (leftPanelOpen) => set({ leftPanelOpen }),

  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setRightPanel: (rightPanelOpen) => set({ rightPanelOpen }),
  setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),

  toggleLyrics: () => set((state) => ({ lyricsOpen: !state.lyricsOpen })),
  setLyricsOpen: (lyricsOpen) => set({ lyricsOpen }),

  setMinimized: (minimized) => set({ minimized }),
  toggleMinimized: () => set((state) => ({ minimized: !state.minimized })),

  setHideExplicit: (hideExplicit) => set({ hideExplicit }),

  setTheme: (theme) => set({ theme }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setCompactMode: (compactMode) => set({ compactMode }),

  openModal: (id) =>
    set((state) => ({
      activeModal: id,
      modals: { ...state.modals, [id]: true },
    })),

  closeModal: (id) =>
    set((state) => {
      const newModals = { ...state.modals };
      delete newModals[id];
      return {
        activeModal: state.activeModal === id ? null : state.activeModal,
        modals: newModals,
      };
    }),

  closeAllModals: () => set({ activeModal: null, modals: {} }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` },
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
});