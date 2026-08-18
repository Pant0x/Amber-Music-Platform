import type { StateCreator } from 'zustand'
import type { Track, Playlist } from '@/types/music-player'
import type { ArtistProfile, ChannelDetails } from '@/types/channel'

// Define the base state shape
export interface BaseState {
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  queue: Track[]
  history: Track[]
  repeatMode: 'none' | 'all' | 'one'
  playedSeconds: number
  duration: number
  seekTrigger: number | null
  isAutoplayEnabled: boolean
}

// Define slice types with proper typing
export interface PlaybackSlice extends Omit<BaseState, 'isAutoplayEnabled'> {
  setRepeatMode: (mode: 'none' | 'all' | 'one') => void
  contextQueue: Track[]
  setPlayedSeconds: (seconds: number) => void
  setDuration: (duration: number) => void
  setSeekTrigger: (seconds: number | null) => void
  setYoutubeIdForCurrentTrack: (youtubeId: string) => void
  enrichCurrentTrack: (metadata: PlaybackMetadata) => void
  playTrack: (track: Track, contextTracks?: Track[]) => void
  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (id: string) => void
  clearQueue: () => void
  playNext: (track: Track) => void
  nextTrack: () => void
  prevTrack: () => void
}

export interface NavStateSlice {
  activeTab: 'home' | 'explore' | 'library' | 'playlist' | 'liked' | 'channel' | 'search' | 'lyrics'
  searchQuery: string
  selectedMood: string
  currentPlaylistId: string | null
  currentChannelId: string | null
  artistSubTab: 'overview' | 'songs' | 'albums' | 'videos' | 'about'
  navHistory: { activeTab: NavStateSlice['activeTab']; currentPlaylistId: string | null; currentChannelId: string | null; artistSubTab?: NavStateSlice['artistSubTab'] }[]
  navForward: { activeTab: NavStateSlice['activeTab']; currentPlaylistId: string | null; currentChannelId: string | null; artistSubTab?: NavStateSlice['artistSubTab'] }[]
  setActiveTab: (tab: 'home' | 'explore' | 'library' | 'playlist' | 'liked' | 'channel' | 'search' | 'lyrics') => void
  setSearchQuery: (query: string) => void
  setSelectedMood: (mood: string) => void
  setCurrentPlaylistId: (id: string | null) => void
  setCurrentChannelId: (id: string | null) => void
  setArtistSubTab: (tab: 'overview' | 'songs' | 'albums' | 'videos' | 'about') => void
  pushNavState: (activeTab: NavStateSlice['activeTab'], currentPlaylistId: string | null, currentChannelId: string | null, artistSubTab?: NavStateSlice['artistSubTab']) => void
  navigateBack: () => void
  navigateForward: () => void
  fetchChannelDetails: (idOrName: string, isName?: boolean) => Promise<void>
  fetchNowPlayingChannelDetails: (idOrName: string, isName?: boolean) => Promise<void>
  loadChannelDetails: (idOrName: string, isName: boolean, target: 'currentChannelDetails' | 'nowPlayingChannelDetails') => Promise<void>
  viewChannel: (channelTitle: string, channelId?: string) => Promise<void>
  playArtistRadio: (artistIdOrName: string) => Promise<void>
}

export interface CollectionSlice {
  playlists: Playlist[]
  likedTracks: Track[]
  searchHistory: string[]
  currentChannelDetails: ChannelDetails | null
  nowPlayingChannelDetails: ChannelDetails | null
  subscribedChannels: string[]
  displayName: string
  avatarUrl: string
  onboardingCompleted: boolean
  isAdmin: boolean
  planTier: 'free' | 'plus'
  shareTrack: Track | null

  setDisplayName: (name: string) => void
  setAvatarUrl: (url: string) => void
  setOnboardingCompleted: (completed: boolean) => void
  setPlanTier: (tier: 'free' | 'plus') => void
  setShareTrack: (track: Track | null) => void
  fetchDatabaseData: () => Promise<void>
  createPlaylist: (name: string) => void
  deletePlaylist: (id: string) => void
  addTrackToPlaylist: (playlistId: string, track: Track) => void
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void
  reorderPlaylistTracks: (playlistId: string, fromIndex: number, toIndex: number) => void
  toggleLikeTrack: (track: Track) => void
  toggleSubscribeChannel: (channelId: string) => void
  addSearchQueryToHistory: (query: string) => void
  removeSearchQueryFromHistory: (query: string) => void
  clearSearchHistory: () => void
}

export interface UISlice {
  showQueuePanel: boolean
  rightSidebarView: 'now-playing' | 'queue' | 'connect'
  showNowPlaying: boolean
  nowPlayingTab: 'upnext' | 'lyrics' | 'related' | 'connect'
  isMinimized: boolean
  hideExplicit: boolean

  toggleQueuePanel: () => void
  setRightSidebarView: (view: 'now-playing' | 'queue' | 'connect') => void
  setShowNowPlaying: (show: boolean) => void
  toggleNowPlaying: () => void
  setNowPlayingTab: (tab: 'upnext' | 'lyrics' | 'related' | 'connect') => void
  setIsMinimized: (isMinimized: boolean) => void
  toggleMinimized: () => void
  toggleHideExplicit: () => void
}

export interface LyricsLine {
  text: string
  time: number
}

export interface LyricsSliceData {
  lyrics: string
  lines: LyricsLine[]
  isSynced?: boolean
}

export interface LyricsSlice {
  globalLyricsData: LyricsSliceData | null
  globalLyricsLoading: boolean
  setGlobalLyricsData: (data: LyricsSliceData | null) => void
  setGlobalLyricsLoading: (loading: boolean) => void
}

export interface PersistenceSlice {
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  autoplayQueue: Track[]
  isAutoplayEnabled: boolean
  toggleAutoplay: () => void
  setAutoplayQueue: (queue: Track[]) => void
  fetchAutoplayQueue: (videoId: string) => Promise<void>
}

export interface PlaybackMetadata {
  title?: string
  channelTitle?: string
  isExplicit?: boolean
  thumbnailUrl?: string
  albumName?: string
  albumId?: string
  duration?: string
  type?: Track['type']
}

export type StoreState = PlaybackSlice & NavStateSlice & CollectionSlice & UISlice & LyricsSlice & PersistenceSlice

// Re-export for convenience
export type { ArtistProfile, ChannelDetails }