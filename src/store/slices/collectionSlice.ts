import type { StateCreator } from "zustand";
import type { Playlist, Track, Artist } from "../types";

export interface CollectionState {
  playlists: Playlist[];
  likedTracks: Track[];
  followedArtists: Artist[];
  subscribedChannels: Artist[];
  localPlaylists: Playlist[];
  downloadedTracks: Set<string>;
  setPlaylists: (playlists: Playlist[]) => void;
  addPlaylist: (playlist: Playlist) => void;
  removePlaylist: (playlistId: string) => void;
  updatePlaylist: (playlistId: string, data: Partial<Playlist>) => void;
  toggleLikeTrack: (track: Track) => void;
  isTrackLiked: (trackId: string) => boolean;
  followArtist: (artist: Artist) => void;
  unfollowArtist: (artistId: string) => void;
  isArtistFollowed: (artistId: string) => boolean;
  subscribeChannel: (channel: Artist) => void;
  unsubscribeChannel: (channelId: string) => void;
  isChannelSubscribed: (channelId: string) => boolean;
  addLocalPlaylist: (playlist: Playlist) => void;
  removeLocalPlaylist: (playlistId: string) => void;
  toggleDownload: (trackId: string) => void;
  isTrackDownloaded: (trackId: string) => boolean;
}

export const createCollectionSlice: StateCreator<
  CollectionState,
  [],
  [],
  CollectionState
> = (set, get) => ({
  playlists: [],
  likedTracks: [],
  followedArtists: [],
  subscribedChannels: [],
  localPlaylists: [],
  downloadedTracks: new Set(),

  setPlaylists: (playlists) => set({ playlists }),
  addPlaylist: (playlist) =>
    set((state) => ({ playlists: [playlist, ...state.playlists] })),
  removePlaylist: (playlistId) =>
    set((state) => ({
      playlists: state.playlists.filter((p) => p.id !== playlistId),
    })),
  updatePlaylist: (playlistId, data) =>
    set((state) => ({
      playlists: state.playlists.map((p) =>
        p.id === playlistId ? { ...p, ...data } : p
      ),
    })),

  toggleLikeTrack: (track) =>
    set((state) => {
      const exists = state.likedTracks.some((t) => t.id === track.id);
      if (exists) {
        return { likedTracks: state.likedTracks.filter((t) => t.id !== track.id) };
      }
      return { likedTracks: [track, ...state.likedTracks] };
    }),

  isTrackLiked: (trackId) => get().likedTracks.some((t) => t.id === trackId),

  followArtist: (artist) =>
    set((state) => {
      if (state.followedArtists.some((a) => a.id === artist.id)) return state;
      return { followedArtists: [artist, ...state.followedArtists] };
    }),

  unfollowArtist: (artistId) =>
    set((state) => ({
      followedArtists: state.followedArtists.filter((a) => a.id !== artistId),
    })),

  isArtistFollowed: (artistId) =>
    get().followedArtists.some((a) => a.id === artistId),

  subscribeChannel: (channel) =>
    set((state) => {
      if (state.subscribedChannels.some((c) => c.id === channel.id)) return state;
      return { subscribedChannels: [channel, ...state.subscribedChannels] };
    }),

  unsubscribeChannel: (channelId) =>
    set((state) => ({
      subscribedChannels: state.subscribedChannels.filter((c) => c.id !== channelId),
    })),

  isChannelSubscribed: (channelId) =>
    get().subscribedChannels.some((c) => c.id === channelId),

  addLocalPlaylist: (playlist) =>
    set((state) => ({ localPlaylists: [playlist, ...state.localPlaylists] })),
  removeLocalPlaylist: (playlistId) =>
    set((state) => ({
      localPlaylists: state.localPlaylists.filter((p) => p.id !== playlistId),
    })),

  toggleDownload: (trackId) =>
    set((state) => {
      const newDownloaded = new Set(state.downloadedTracks);
      if (newDownloaded.has(trackId)) newDownloaded.delete(trackId);
      else newDownloaded.add(trackId);
      return { downloadedTracks: newDownloaded };
    }),

  isTrackDownloaded: (trackId) => get().downloadedTracks.has(trackId),
});