// Sidebar Mode Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SidebarSettings {
  collapsed: boolean;
  autoCollapse: boolean;
  showPlaylists: boolean;
  showArtists: boolean;
  showAlbums: boolean;
  setCollapsed: (collapsed: boolean) => void;
  setAutoCollapse: (autoCollapse: boolean) => void;
  setShowPlaylists: (show: boolean) => void;
  setShowArtists: (show: boolean) => void;
  setShowAlbums: (show: boolean) => void;
}

export const useSidebarSettings = create<SidebarSettings>()(
  persist(
    (set) => ({
      collapsed: false,
      autoCollapse: false,
      showPlaylists: true,
      showArtists: true,
      showAlbums: true,
      setCollapsed: (collapsed) => set({ collapsed }),
      setAutoCollapse: (autoCollapse) => set({ autoCollapse }),
      setShowPlaylists: (showPlaylists) => set({ showPlaylists }),
      setShowArtists: (showArtists) => set({ showArtists }),
      setShowAlbums: (showAlbums) => set({ showAlbums }),
    }),
    {
      name: "amber-sidebar",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function hydrateSidebarSettings() {
  // Called on app startup
}