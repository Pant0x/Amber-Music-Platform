// Hidden Playlists Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface HiddenPlaylistsSettings {
  hiddenPlaylistIds: string[];
  addHidden: (playlistId: string) => void;
  removeHidden: (playlistId: string) => void;
  isHidden: (playlistId: string) => boolean;
}

export const useHiddenPlaylistsSettings = create<HiddenPlaylistsSettings>()(
  persist(
    (set, get) => ({
      hiddenPlaylistIds: [],
      addHidden: (playlistId) =>
        set((state) => ({
          hiddenPlaylistIds: [...state.hiddenPlaylistIds, playlistId],
        })),
      removeHidden: (playlistId) =>
        set((state) => ({
          hiddenPlaylistIds: state.hiddenPlaylistIds.filter((id) => id !== playlistId),
        })),
      isHidden: (playlistId) => get().hiddenPlaylistIds.includes(playlistId),
    }),
    {
      name: "amber-hidden-playlists",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydrateHiddenPlaylists() {
  // Called on app startup
}