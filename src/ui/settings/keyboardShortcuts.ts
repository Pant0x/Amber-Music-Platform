// Keyboard Shortcuts Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type KeyboardShortcutAction =
  | "playPause"
  | "nextTrack"
  | "prevTrack"
  | "volumeUp"
  | "volumeDown"
  | "mute"
  | "seekForward"
  | "seekBackward"
  | "toggleShuffle"
  | "toggleRepeat"
  | "toggleLyrics"
  | "toggleQueue"
  | "toggleMiniPlayer"
  | "search"
  | "tab1"
  | "tab2"
  | "tab3"
  | "tab4"
  | "tab5"
  | "tab6"
  | "tab7"
  | "tab8"
  | "tab9";

interface KeyboardShortcut {
  action: KeyboardShortcutAction;
  keys: string;
}

interface KeyboardShortcutsState {
  shortcuts: Record<KeyboardShortcutAction, string>;
  enabled: boolean;
  setShortcut: (action: KeyboardShortcutAction, keys: string) => void;
  setEnabled: (enabled: boolean) => void;
}

const DEFAULT_SHORTCUTS: Record<KeyboardShortcutAction, string> = {
  playPause: "Space",
  nextTrack: "ArrowRight",
  prevTrack: "ArrowLeft",
  volumeUp: "ArrowUp",
  volumeDown: "ArrowDown",
  mute: "M",
  seekForward: "Shift+ArrowRight",
  seekBackward: "Shift+ArrowLeft",
  toggleShuffle: "S",
  toggleRepeat: "R",
  toggleLyrics: "L",
  toggleQueue: "Q",
  toggleMiniPlayer: "P",
  search: "Meta+K",
  tab1: "Meta+1",
  tab2: "Meta+2",
  tab3: "Meta+3",
  tab4: "Meta+4",
  tab5: "Meta+5",
  tab6: "Meta+6",
  tab7: "Meta+7",
  tab8: "Meta+8",
  tab9: "Meta+9",
};

export const useKeyboardShortcuts = create<KeyboardShortcutsState>()(
  persist(
    (set) => ({
      shortcuts: DEFAULT_SHORTCUTS,
      enabled: true,
      setShortcut: (action, keys) =>
        set((state) => ({
          shortcuts: { ...state.shortcuts, [action]: keys },
        })),
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: "amber-keyboard-shortcuts",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useKeyboardShortcutsState() {
  return useKeyboardShortcuts((s) => s.shortcuts);
}

export function eventMatchesShortcut(event: KeyboardEvent, action: KeyboardShortcutAction) {
  const shortcuts = useKeyboardShortcuts.getState().shortcuts;
  const keys = shortcuts[action];
  if (!keys) return false;

  const parts = keys.toLowerCase().split("+");
  const requiredModifiers = parts.filter((p) => ["meta", "ctrl", "alt", "shift"].includes(p));
  const requiredKey = parts.find((p) => !["meta", "ctrl", "alt", "shift"].includes(p));

  const modifierMatch = requiredModifiers.every((mod) => {
    switch (mod) {
      case "meta": return event.metaKey;
      case "ctrl": return event.ctrlKey;
      case "alt": return event.altKey;
      case "shift": return event.shiftKey;
      default: return false;
    }
  });

  const keyMatch = requiredKey ? event.key.toLowerCase() === requiredKey.toLowerCase() : true;

  return modifierMatch && keyMatch;
}