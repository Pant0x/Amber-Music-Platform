// Local Playlists
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface LocalPlaylist {
  id: string;
  name: string;
  tracks: string[];
  createdAt: string;
  updatedAt: string;
}

interface LocalPlaylistState {
  playlists: LocalPlaylist[];
  create: (name: string) => string;
  rename: (id: string, name: string) => void;
  delete: (id: string) => void;
  addTrack: (playlistId: string, trackId: string) => void;
  removeTrack: (playlistId: string, trackId: string) => void;
  reorderTracks: (playlistId: string, fromIndex: number, toIndex: number) => void;
}

export const useLocalPlaylists = create<LocalPlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [],
      create: (name) => {
        const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        set((state) => ({
          playlists: [
            ...state.playlists,
            {
              id,
              name,
              tracks: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }));
        return id;
      },
      rename: (id, name) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
          ),
        })),
      delete: (id) =>
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== id),
        })),
      addTrack: (playlistId, trackId) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId && !p.tracks.includes(trackId)
              ? { ...p, tracks: [...p.tracks, trackId], updatedAt: new Date().toISOString() }
              : p
          ),
        })),
      removeTrack: (playlistId, trackId) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, tracks: p.tracks.filter((t) => t !== trackId), updatedAt: new Date().toISOString() }
              : p
          ),
        })),
      reorderTracks: (playlistId, fromIndex, toIndex) =>
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const tracks = [...p.tracks];
            const [track] = tracks.splice(fromIndex, 1);
            tracks.splice(toIndex, 0, track);
            return { ...p, tracks, updatedAt: new Date().toISOString() };
          }),
        })),
    }),
    {
      name: "amber-local-playlists",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function notifyLocalPlaylistsChanged() {
  // Notify UI of changes
  window.dispatchEvent(new CustomEvent("local-playlists-changed"));
}

export function syncLocalAudioWatcher() {
  // Sync with filesystem watcher
}