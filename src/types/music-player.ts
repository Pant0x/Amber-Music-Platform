export interface Track {
  id: string; // YouTube Video ID or Channel ID
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  bpm?: number | null; // Database hydrated
  key?: string | null; // Database hydrated
  type?: 'music' | 'video' | 'channel' | 'artist'; // Dynamic search categorization
  origin?: 'spotify' | 'youtube';
  youtubeId?: string;
  artistId?: string;
  channelId?: string;
  views?: string;
  duration?: string;
  isExplicit?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: string;
}

export type ActiveTabType = 'home' | 'music' | 'video' | 'library' | 'analytics';

export interface PlaybackProgress {
  played: number;        // Fraction of track played (0 to 1)
  playedSeconds: number; // Seconds played
  loaded: number;        // Fraction of track preloaded (0 to 1)
  loadedSeconds: number; // Seconds preloaded
}

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;        // Between 0 and 1
  playbackHistory: Track[];
  activeTab: ActiveTabType;
  progress: PlaybackProgress;
  isMuted: boolean;
  
  // Scaled up properties
  playlists: Playlist[];
  queue: Track[];
  likedTracks: string[]; // List of track IDs
  showQueuePanel: boolean;
  currentPlaylistId: string | null; // Track currently selected playlist (active in library/details view)
}

export interface PlaybackContextType extends PlaybackState {
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  setPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setProgress: (progress: PlaybackProgress) => void;
  setActiveTab: (tab: ActiveTabType) => void;
  addToHistory: (track: Track) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (fraction: number) => void; // Used to trigger player seeking
  seekTrigger: number; // A incrementing key to signal react-player to seek
  seekFraction: number; // Expose actual fraction to seek to
  updateTrackMetadata: (id: string, metadata: { bpm?: number | null; key?: string | null }) => void;

  // Playlist controls
  createPlaylist: (name: string) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  
  // Likes controls
  toggleLikeTrack: (track: Track) => void;
  
  // Queue controls
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  toggleQueuePanel: () => void;
  
  // Active playlist navigation
  setCurrentPlaylistId: (id: string | null) => void;
}

export interface YouTubeSearchResponse {
  items: Track[];
  nextPageToken?: string;
  prevPageToken?: string;
  totalResults?: number;
}
