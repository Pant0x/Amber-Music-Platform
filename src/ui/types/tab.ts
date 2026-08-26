// Tab Types
export type TabView =
  | "home"
  | "explore"
  | "library"
  | "liked"
  | "playlists"
  | "artists"
  | "albums"
  | "files"
  | "search"
  | "settings"
  | "transfer"
  | "artistDashboard"
  | "album"
  | "artist"
  | "playlist"
  | "related"
  | "history";

export interface Tab {
  id: string;
  title: string;
  view: TabView;
  album?: any;
  artist?: any;
  playlist?: any;
  relatedTrack?: any;
  searchQuery?: string;
  searchResults?: any[];
  mixedSearchResults?: any[];
  searchLoading?: boolean;
  scrollPosition?: number;
  createdAt: number;
}

export interface TabViewState {
  title: string;
  view: TabView;
  album?: any;
  artist?: any;
  playlist?: any;
  relatedTrack?: any;
  searchQuery?: string;
  searchResults?: any[];
  mixedSearchResults?: any[];
  searchLoading?: boolean;
}

export const TAB_SHORTCUT_ACTIONS: string[] = [
  "tab1",
  "tab2",
  "tab3",
  "tab4",
  "tab5",
  "tab6",
  "tab7",
  "tab8",
  "tab9",
];

export const MAX_NAVIGATION_HISTORY = 50;