// Player Store - Legacy compatibility layer
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Tab {
  id: string;
  title: string;
  view: string;
  // ... other tab properties
}

export interface TabViewState {
  title: string;
  view: string;
  album?: any;
  artist?: any;
  playlist?: any;
  relatedTrack?: any;
  searchQuery?: string;
  searchResults?: any[];
  mixedSearchResults?: any[];
  searchLoading?: boolean;
}

interface LibraryController {
  // Library management
}

interface PlayerController {
  // Playback control
}

interface SearchController {
  // Search functionality
}

interface TabManager {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (tab: Tab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
}

export const libraryController: LibraryController = {};
export const playerController: PlayerController = {};
export const searchController: SearchController = {};

export const tabManager: TabManager = {
  tabs: [],
  activeTabId: null,
  openTab: (tab) => {},
  closeTab: (tabId) => {},
  setActiveTab: (tabId) => {},
};

export function useLibraryState() {
  return { library: [] };
}

export function usePlayerSession() {
  return { session: null };
}

export function usePlayerSelector() {
  return { currentTrack: null, isPlaying: false };
}

export function shallowEqual<T>(a: T, b: T): boolean {
  return a === b;
}

export function clearAppSession() {
  localStorage.removeItem("amber-app-session");
}

export function loadAppSession() {
  try {
    const session = localStorage.getItem("amber-app-session");
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
}

export function saveAppSession(session: any) {
  localStorage.setItem("amber-app-session", JSON.stringify(session));
}

export const appSession = {
  clear: clearAppSession,
  load: loadAppSession,
  save: saveAppSession,
};