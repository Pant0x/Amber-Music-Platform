import type { StateCreator } from 'zustand'
import type { Track, Playlist } from '@/types/music-player'
import type { StoreState, CollectionSlice } from '@/store/types'

export const createCollectionSlice: StateCreator<StoreState, [], [], CollectionSlice> = (set, get) => ({
  playlists: [],
  likedTracks: [],
  searchHistory: [],
  currentChannelDetails: null,
  nowPlayingChannelDetails: null,
  subscribedChannels: [],
  displayName: '',
  avatarUrl: '',
  onboardingCompleted: false,
  shareTrack: null,

  setDisplayName: (name) => set({ displayName: name }),
  setAvatarUrl: (url) => set({ avatarUrl: url }),
  setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
  setShareTrack: (track) => set({ shareTrack: track }),

  fetchDatabaseData: async () => {
    try {
      const res = await fetch('/api/user/sync');
      if (res.ok) {
        const data = await res.json();
        set({
          displayName: data.display_name || 'Anonymous Listener',
          avatarUrl: data.avatar_url || 'bg-gradient-to-tr from-blue-600 to-indigo-900',
          onboardingCompleted: data.onboarding_completed || false,
          likedTracks: data.liked_tracks || [],
          subscribedChannels: data.subscribed_channels || [],
          playlists: data.playlists || [],
          history: data.history || []
        });
      }
    } catch (err) {
      console.error('[Store] Failed to fetch database data:', err);
    }
  },

  createPlaylist: (name) => set((state) => {
    const newPlaylist: Playlist = {
      id: `pl_${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim() || `My Playlist #${state.playlists.length + 1}`,
      tracks: [],
      createdAt: new Date().toISOString()
    };
    return { playlists: [...state.playlists, newPlaylist] };
  }),

  deletePlaylist: (id) => set((state) => ({
    playlists: state.playlists.filter((p) => p.id !== id),
    currentPlaylistId: state.currentPlaylistId === id ? null : state.currentPlaylistId,
    activeTab: state.currentPlaylistId === id ? 'home' : state.activeTab
  })),

  addTrackToPlaylist: (playlistId, track) => set((state) => ({
    playlists: state.playlists.map((p) => {
      if (p.id === playlistId) {
        const exists = p.tracks.some((t) => t.id === track.id);
        if (!exists) {
          return { ...p, tracks: [...p.tracks, track] };
        }
      }
      return p;
    })
  })),

  removeTrackFromPlaylist: (playlistId, trackId) => set((state) => ({
    playlists: state.playlists.map((p) => {
      if (p.id === playlistId) {
        return { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) };
      }
      return p;
    })
  })),

  toggleLikeTrack: (track) => set((state) => {
    const isLiked = state.likedTracks.some(t => t.id === track.id);
    const newLiked = isLiked
      ? state.likedTracks.filter(t => t.id !== track.id)
      : [track, ...state.likedTracks];
    return { likedTracks: newLiked };
  }),

  toggleSubscribeChannel: (channelId) => set((state) => {
    const isSubscribed = state.subscribedChannels.includes(channelId);
    const updated = isSubscribed
      ? state.subscribedChannels.filter(id => id !== channelId)
      : [...state.subscribedChannels, channelId];
    return { subscribedChannels: updated };
  }),

  addSearchQueryToHistory: (query) => set((state) => {
    const trimmed = query.trim();
    if (!trimmed) return state;
    const filtered = state.searchHistory.filter((q) => q !== trimmed);
    const updated = [...filtered, trimmed].slice(-10);
    return { searchHistory: updated };
  }),

  removeSearchQueryFromHistory: (query) => set((state) => {
    return { searchHistory: state.searchHistory.filter((q) => q !== query) };
  }),

  clearSearchHistory: () => set({ searchHistory: [] }),
});
