import type { Track, Playlist } from '@/types/music-player'

export interface PlaybackSlice {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  queue: Track[];
  history: Track[];
  repeatMode: 'none' | 'all' | 'one';
  setRepeatMode: (mode: 'none' | 'all' | 'one') => void;
  contextQueue: Track[];
  playedSeconds: number;
  duration: number;
  seekTrigger: number | null;

  playTrack: (track: Track, contextTracks?: Track[]) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  playNext: (track: Track) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setPlayedSeconds: (seconds: number) => void;
  setDuration: (duration: number) => void;
  setSeekTrigger: (seconds: number | null) => void;
  setYoutubeIdForCurrentTrack: (youtubeId: string) => void;
  enrichCurrentTrack: (metadata: {
    title?: string;
    channelTitle?: string;
    isExplicit?: boolean;
    thumbnailUrl?: string;
    albumName?: string;
    albumId?: string;
    duration?: string;
    type?: Track['type'];
  }) => void;
}

export interface NavigationSlice {
  activeTab: 'home' | 'explore' | 'library' | 'playlist' | 'liked' | 'channel' | 'search' | 'lyrics';
  searchQuery: string;
  selectedMood: string;
  currentPlaylistId: string | null;
  currentChannelId: string | null;
  artistSubTab: 'overview' | 'songs' | 'albums' | 'videos' | 'about';
  navHistory: { activeTab: any; currentPlaylistId: any; currentChannelId: any; artistSubTab?: any }[];
  navForward: { activeTab: any; currentPlaylistId: any; currentChannelId: any; artistSubTab?: any }[];

  setActiveTab: (tab: 'home' | 'explore' | 'library' | 'playlist' | 'liked' | 'channel' | 'search' | 'lyrics') => void;
  setSearchQuery: (query: string) => void;
  setSelectedMood: (mood: string) => void;
  setCurrentPlaylistId: (id: string | null) => void;
  setCurrentChannelId: (id: string | null) => void;
  setArtistSubTab: (tab: 'overview' | 'songs' | 'albums' | 'videos' | 'about') => void;
  pushNavState: (activeTab: any, currentPlaylistId: any, currentChannelId: any, artistSubTab?: any) => void;
  navigateBack: () => void;
  navigateForward: () => void;
  fetchChannelDetails: (idOrName: string, isName?: boolean) => Promise<void>;
  fetchNowPlayingChannelDetails: (idOrName: string, isName?: boolean) => Promise<void>;
  viewChannel: (channelTitle: string, channelId?: string) => Promise<void>;
  playArtistRadio: (artistIdOrName: string) => Promise<void>;
}

export interface CollectionSlice {
  playlists: Playlist[];
  likedTracks: Track[];
  searchHistory: string[];
  currentChannelDetails: any;
  nowPlayingChannelDetails: any;
  subscribedChannels: string[];
  displayName: string;
  avatarUrl: string;
  onboardingCompleted: boolean;
  shareTrack: Track | null;

  setDisplayName: (name: string) => void;
  setAvatarUrl: (url: string) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setShareTrack: (track: Track | null) => void;
  fetchDatabaseData: () => Promise<void>;
  createPlaylist: (name: string) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylistTracks: (playlistId: string, fromIndex: number, toIndex: number) => void;
  toggleLikeTrack: (track: Track) => void;
  toggleSubscribeChannel: (channelId: string) => void;
  addSearchQueryToHistory: (query: string) => void;
  removeSearchQueryFromHistory: (query: string) => void;
  clearSearchHistory: () => void;
}

export interface UISlice {
  showQueuePanel: boolean;
  rightSidebarView: 'now-playing' | 'queue' | 'connect';
  showNowPlaying: boolean;
  playbackMode: 'song' | 'video';
  nowPlayingTab: 'player' | 'upnext' | 'lyrics' | 'related';
  isMinimized: boolean;
  hideExplicit: boolean;

  toggleQueuePanel: () => void;
  setRightSidebarView: (view: 'now-playing' | 'queue' | 'connect') => void;
  setShowNowPlaying: (show: boolean) => void;
  toggleNowPlaying: () => void;
  setPlaybackMode: (mode: 'song' | 'video') => void;
  setNowPlayingTab: (tab: 'player' | 'upnext' | 'lyrics' | 'related') => void;
  setIsMinimized: (isMinimized: boolean) => void;
  toggleMinimized: () => void;
  toggleHideExplicit: () => void;
}

export interface LyricsSlice {
  globalLyricsData: { lyrics: string; lines: { text: string; time: number }[]; isSynced?: boolean } | null;
  globalLyricsLoading: boolean;
  setGlobalLyricsData: (data: any) => void;
  setGlobalLyricsLoading: (loading: boolean) => void;
}

export interface PersistenceSlice {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  autoplayQueue: Track[];
  isAutoplayEnabled: boolean;
  toggleAutoplay: () => void;
  setAutoplayQueue: (queue: Track[]) => void;
  fetchAutoplayQueue: (videoId: string) => Promise<void>;
}

export type StoreState = PlaybackSlice & NavigationSlice & CollectionSlice & UISlice & LyricsSlice & PersistenceSlice;
