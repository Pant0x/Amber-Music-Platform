import type { StateCreator } from 'zustand'
import type { StoreState, NavStateSlice } from '@/store/types'
import type { Track } from '@/types/music-player'
import { seededShuffle } from '@/utils/random'

export const createNavigationSlice: StateCreator<StoreState, [], [], NavStateSlice> = (set, get) => ({
  activeTab: 'home',
  searchQuery: '',
  selectedMood: 'none',
  currentPlaylistId: null,
  currentChannelId: null,
  artistSubTab: 'overview',
  navHistory: [],
  navForward: [],

  setArtistSubTab: (artistSubTab) => set({ artistSubTab }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedMood: (selectedMood) => set({ selectedMood }),

  setActiveTab: (activeTab) => {
    get().pushNavState(activeTab, get().currentPlaylistId, get().currentChannelId);
    set({ activeTab, showNowPlaying: false });
  },

  setCurrentPlaylistId: (currentPlaylistId) => {
    get().pushNavState(get().activeTab, currentPlaylistId, get().currentChannelId);
    set({ currentPlaylistId, showNowPlaying: false });
  },

  setCurrentChannelId: (currentChannelId) => {
    get().pushNavState(get().activeTab, get().currentPlaylistId, currentChannelId);
    set({ currentChannelId, showNowPlaying: false });
  },

  pushNavState: (activeTab, currentPlaylistId, currentChannelId, artistSubTab) => {
    const state = get();
    const last = state.navHistory[state.navHistory.length - 1];
    const targetArtistSubTab = artistSubTab !== undefined ? artistSubTab : state.artistSubTab;

    if (!last || last.activeTab !== activeTab || last.currentPlaylistId !== currentPlaylistId || last.currentChannelId !== currentChannelId || last.artistSubTab !== targetArtistSubTab) {
      const prevStack = [...state.navHistory];
      if (prevStack.length >= 50) prevStack.shift();

      set({
        navHistory: [...prevStack, {
          activeTab: state.activeTab,
          currentPlaylistId: state.currentPlaylistId,
          currentChannelId: state.currentChannelId,
          artistSubTab: state.artistSubTab
        }],
        navForward: []
      });
    }
  },

  navigateBack: () => {
    const state = get();
    if (state.navHistory.length === 0) return;

    const prev = state.navHistory[state.navHistory.length - 1];
    const newHistory = state.navHistory.slice(0, -1);
    const current = {
      activeTab: state.activeTab,
      currentPlaylistId: state.currentPlaylistId,
      currentChannelId: state.currentChannelId,
      artistSubTab: state.artistSubTab
    };

    set({
      navHistory: newHistory,
      navForward: [current, ...state.navForward],
      activeTab: prev.activeTab,
      currentPlaylistId: prev.currentPlaylistId,
      currentChannelId: prev.currentChannelId,
      artistSubTab: prev.artistSubTab || 'overview'
    });
  },

  navigateForward: () => {
    const state = get();
    if (state.navForward.length === 0) return;

    const next = state.navForward[0];
    const newForward = state.navForward.slice(1);
    const current = {
      activeTab: state.activeTab,
      currentPlaylistId: state.currentPlaylistId,
      currentChannelId: state.currentChannelId,
      artistSubTab: state.artistSubTab
    };

    set({
      navHistory: [...state.navHistory, current],
      navForward: newForward,
      activeTab: next.activeTab,
      currentPlaylistId: next.currentPlaylistId,
      currentChannelId: next.currentChannelId,
      artistSubTab: next.artistSubTab || 'overview'
    });
  },

  fetchChannelDetails: async (idOrName, isName = false) => {
    await get().loadChannelDetails(idOrName, isName, 'currentChannelDetails');
  },

  fetchNowPlayingChannelDetails: async (idOrName, isName = false) => {
    await get().loadChannelDetails(idOrName, isName, 'nowPlayingChannelDetails');
  },

  loadChannelDetails: async (idOrName: string, isName: boolean, target: 'currentChannelDetails' | 'nowPlayingChannelDetails') => {
    try {
      const url = isName
        ? `/api/youtube/channel?name=${encodeURIComponent(idOrName)}`
        : `/api/youtube/channel/${encodeURIComponent(idOrName)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        set({ [target]: data } as Partial<StoreState>);
      }
    } catch (e) {
      console.error('Error fetching channel details:', e);
    }
  },

  viewChannel: async (channelTitle, channelId) => {
    const idOrName = channelTitle || channelId || '';
    const isName = !!channelTitle;
    get().pushNavState('channel', null, idOrName);
    set({ activeTab: 'channel', currentChannelDetails: null, currentChannelId: idOrName });

    await get().fetchChannelDetails(idOrName, isName);
  },

  playArtistRadio: async (artistIdOrName) => {
    try {
      const res = await fetch(`/api/youtube/channel/${encodeURIComponent(artistIdOrName)}`);
      if (res.ok) {
        const data = (await res.json()) as { topSongs?: Track[] };
        const topSongs = (data.topSongs || []).slice(0, 20);
        if (topSongs.length > 0) {
          const seedStr = artistIdOrName || 'default_seed';
          const shuffled = seededShuffle(topSongs, seedStr);
          const firstTrack = shuffled[0];
          const remaining = shuffled.slice(1);

          // Route through playTrack so history/context/autoplay stay consistent
          get().playTrack(firstTrack, remaining);
          set({ showNowPlaying: false });
        }
      }
    } catch (e) {
      console.error('Failed to play artist radio:', e);
    }
  },
});
