export interface Track {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration?: string;
  isExplicit?: boolean;
  artistId?: string;
  channelId?: string;
  albumName?: string;
  playbackMode?: "song" | "video";
  origin?: "youtube" | "spotify" | "local";
  videoId?: string;
}

export interface Artist {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelTitle?: string;
  subtitle?: string;
  channelId?: string;
  origin?: "youtube" | "spotify";
}

export interface Album {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  releaseType?: string;
  artistId?: string;
  tracks?: Track[];
  trackCount?: number;
  origin?: "youtube" | "spotify";
}

export interface Playlist {
  id: string;
  title: string;
  thumbnailUrl?: string;
  channelTitle?: string;
  tracks?: Track[];
  trackCount?: number;
  origin?: "youtube" | "spotify" | "local";
}

export interface LyricsData {
  lyrics: string;
  synced: boolean;
  source: string;
  translation?: string;
}

export interface Device {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "web";
  isActive: boolean;
  lastSeen: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  tier: "free" | "plus";
  providers: string[];
}

export interface QueueItem extends Track {
  queueId: string;
  addedAt: number;
}

export interface PlayHistoryItem {
  track: Track;
  playedAt: string;
  progress: number;
  source: string;
}