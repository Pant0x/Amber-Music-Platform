import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StateCreator } from 'zustand'
import { createJSONStorage } from 'zustand/middleware'
import { Track, Playlist } from '@/types/music-player'

interface PlayerState {
  // Playback State
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  queue: Track[];
  history: Track[];

  // Navigation & Query State
  activeTab: 'home' | 'explore' | 'library' | 'playlist' | 'liked' | 'channel' | 'search';
  searchQuery: string;
  selectedMood: string; // 'none' | 'energize' | 'focus' | 'relax' | 'commute' | 'workout'
  currentPlaylistId: string | null;
  currentChannelId: string | null;

  // Navigation Stack State
  navHistory: { activeTab: any; currentPlaylistId: any; currentChannelId: any }[];
  navForward: { activeTab: any; currentPlaylistId: any; currentChannelId: any }[];
  pushNavState: (activeTab: any, currentPlaylistId: any, currentChannelId: any) => void;
  navigateBack: () => void;
  navigateForward: () => void;

  // Collection State
  playlists: Playlist[];
  likedTracks: Track[];
  searchHistory: string[];
  currentChannelDetails: any;
  subscribedChannels: string[];
  displayName: string;
  avatarUrl: string;
  shareTrack: Track | null;

  // Database / Sync Actions
  setDisplayName: (name: string) => void;
  setAvatarUrl: (url: string) => void;
  setShareTrack: (track: Track | null) => void;
  fetchDatabaseData: () => Promise<void>;

  // Playback Actions
  playTrack: (track: Track, contextTracks?: Track[]) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  addToQueue: (track: Track) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  
  // Navigation Actions
  setActiveTab: (tab: 'home' | 'explore' | 'library' | 'playlist' | 'liked' | 'channel' | 'search') => void;
  setSearchQuery: (query: string) => void;
  setSelectedMood: (mood: string) => void;
  setCurrentPlaylistId: (id: string | null) => void;
  setCurrentChannelId: (id: string | null) => void;

  // Search History Actions
  addSearchQueryToHistory: (query: string) => void;
  removeSearchQueryFromHistory: (query: string) => void;
  clearSearchHistory: () => void;

  // YouTube Channel Details Actions
  fetchChannelDetails: (idOrName: string, isName?: boolean) => Promise<void>;
  viewChannel: (channelTitle: string, channelId?: string) => Promise<void>;
  playArtistRadio: (artistIdOrName: string) => Promise<void>;

  // Collection Actions
  createPlaylist: (name: string) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  toggleLikeTrack: (track: Track) => void;
  toggleSubscribeChannel: (channelId: string) => void;

  // Safe Mode (Explicit Content Filter)
  hideExplicit: boolean;
  toggleHideExplicit: () => void;

  // Queue & Panel State
  showQueuePanel: boolean;
  toggleQueuePanel: () => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  playNext: (track: Track) => void;

  // Autoplay Recommendation System State
  autoplayQueue: Track[];
  isAutoplayEnabled: boolean;
  toggleAutoplay: () => void;
  setAutoplayQueue: (queue: Track[]) => void;
  fetchAutoplayQueue: (videoId: string) => Promise<void>;

  // Now Playing Panel State
  showNowPlaying: boolean;
  playbackMode: 'song' | 'video';
  nowPlayingTab: 'player' | 'upnext' | 'lyrics' | 'related';
  setShowNowPlaying: (show: boolean) => void;
  toggleNowPlaying: () => void;
  setPlaybackMode: (mode: 'song' | 'video') => void;
  setNowPlayingTab: (tab: 'player' | 'upnext' | 'lyrics' | 'related') => void;
  playedSeconds: number;
  duration: number;
  setPlayedSeconds: (seconds: number) => void;
  setDuration: (duration: number) => void;
  seekTrigger: number | null;
  setSeekTrigger: (seconds: number | null) => void;
  setYoutubeIdForCurrentTrack: (youtubeId: string) => void;
  enrichCurrentTrack: (metadata: { title: string; channelTitle: string; isExplicit: boolean }) => void;
  
  isMinimized: boolean;
  setIsMinimized: (isMinimized: boolean) => void;
  toggleMinimized: () => void;
  
  // Repeat State
  repeatMode: 'none' | 'all' | 'one';
  setRepeatMode: (mode: 'none' | 'all' | 'one') => void;
  contextQueue: Track[];
  
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      // Playback Initial State
      currentTrack: null,
      isPlaying: false,
      volume: 1,
      queue: [],
      history: [],
      repeatMode: 'none',
      setRepeatMode: (repeatMode) => set({ repeatMode }),
      contextQueue: [],

      // Navigation & Query Initial State
      activeTab: 'home',
      searchQuery: '',
      selectedMood: 'none',
      currentPlaylistId: null,
      currentChannelId: null,

      // Navigation Stack State
      navHistory: [],
      navForward: [],

      pushNavState: (activeTab, currentPlaylistId, currentChannelId) => {
        const state = get();
        const last = state.navHistory[state.navHistory.length - 1];
        
        if (!last || last.activeTab !== activeTab || last.currentPlaylistId !== currentPlaylistId || last.currentChannelId !== currentChannelId) {
          const prevStack = [...state.navHistory];
          if (prevStack.length >= 50) prevStack.shift();
          
          set({
            navHistory: [...prevStack, { activeTab: state.activeTab, currentPlaylistId: state.currentPlaylistId, currentChannelId: state.currentChannelId }],
            navForward: []
          });
        }
      },

      navigateBack: () => {
        const state = get();
        if (state.navHistory.length === 0) return;
        
        const prev = state.navHistory[state.navHistory.length - 1];
        const newHistory = state.navHistory.slice(0, -1);
        const current = { activeTab: state.activeTab, currentPlaylistId: state.currentPlaylistId, currentChannelId: state.currentChannelId };
        
        set({
          navHistory: newHistory,
          navForward: [current, ...state.navForward],
          activeTab: prev.activeTab,
          currentPlaylistId: prev.currentPlaylistId,
          currentChannelId: prev.currentChannelId
        });
      },

      navigateForward: () => {
        const state = get();
        if (state.navForward.length === 0) return;
        
        const next = state.navForward[0];
        const newForward = state.navForward.slice(1);
        const current = { activeTab: state.activeTab, currentPlaylistId: state.currentPlaylistId, currentChannelId: state.currentChannelId };
        
        set({
          navHistory: [...state.navHistory, current],
          navForward: newForward,
          activeTab: next.activeTab,
          currentPlaylistId: next.currentPlaylistId,
          currentChannelId: next.currentChannelId
        });
      },

      // Collection Initial State
      playlists: [],
      likedTracks: [],
      searchHistory: [],
      currentChannelDetails: null,
      subscribedChannels: [],
      displayName: 'Anonymous Listener',
      avatarUrl: 'bg-gradient-to-tr from-blue-600 to-indigo-900',
      shareTrack: null,

      // Queue Panel Initial State
      showQueuePanel: false,
      toggleQueuePanel: () => set((state) => ({ showQueuePanel: !state.showQueuePanel })),
      removeFromQueue: (id) => set((state) => {
        const index = state.queue.findIndex(t => t.id === id);
        if (index === -1) return state;
        const newQueue = [...state.queue];
        newQueue.splice(index, 1);
        return { queue: newQueue };
      }),
      clearQueue: () => set({ queue: [] }),
      playNext: (track) => set((state) => {
        const filteredQueue = state.queue.filter(t => t.id !== track.id);
        return { queue: [track, ...filteredQueue] };
      }),

      // Autoplay System State
      autoplayQueue: [],
      isAutoplayEnabled: true,
      toggleAutoplay: () => set((state) => ({ isAutoplayEnabled: !state.isAutoplayEnabled })),
      setAutoplayQueue: (autoplayQueue) => set({ autoplayQueue }),
      fetchAutoplayQueue: async (videoId: string) => {
        try {
          const res = await fetch(`/api/youtube/next?videoId=${encodeURIComponent(videoId)}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              set({ autoplayQueue: data });
            }
          }
        } catch (err) {
          console.error('[Store Autoplay] Failed to fetch autoplay next tracks:', err);
        }
      },

      // Now Playing Initial State
      showNowPlaying: false,
      playbackMode: 'song',
      nowPlayingTab: 'player',
      isMinimized: false,
      setShowNowPlaying: (showNowPlaying) => set((state) => ({ showNowPlaying, isMinimized: showNowPlaying ? false : state.isMinimized })),
      toggleNowPlaying: () => set((state) => ({ showNowPlaying: !state.showNowPlaying })),
      setIsMinimized: (isMinimized: boolean) => set({ isMinimized }),
      toggleMinimized: () => set((state) => ({ isMinimized: !state.isMinimized })),
      setPlaybackMode: (playbackMode) => set({ playbackMode }),
      setNowPlayingTab: (nowPlayingTab) => set({ nowPlayingTab }),
      playedSeconds: 0,
      duration: 0,
      setPlayedSeconds: (playedSeconds) => set({ playedSeconds }),
      setDuration: (duration) => set({ duration }),
      seekTrigger: null,
      setSeekTrigger: (seekTrigger) => set({ seekTrigger }),
      setYoutubeIdForCurrentTrack: (youtubeId) => {
        set((state) => {
          if (!state.currentTrack) return state;
          return {
            currentTrack: {
              ...state.currentTrack,
              youtubeId
            }
          };
        });
        get().fetchAutoplayQueue(youtubeId);
      },
      enrichCurrentTrack: (metadata) => set((state) => {
        if (!state.currentTrack) return state;
        return {
          currentTrack: {
            ...state.currentTrack,
            title: metadata.title,
            channelTitle: metadata.channelTitle,
            isExplicit: metadata.isExplicit,
            isEnriched: true
          }
        };
      }),

      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      // Playback Actions
      playTrack: (track, contextTracks = []) => {
        set((state) => {
          const newHistory = state.currentTrack 
            ? [state.currentTrack, ...state.history.filter(t => t.id !== state.currentTrack?.id)].slice(0, 50)
            : state.history;

          let newQueue: Track[] = [];
          if (contextTracks.length > 0) {
            const idx = contextTracks.findIndex((t: Track) => t.id === track.id);
            if (idx !== -1) {
              newQueue = contextTracks.slice(idx + 1);
            } else {
              newQueue = contextTracks;
            }
          }

          return {
            currentTrack: track,
            isPlaying: true,
            history: newHistory,
            queue: newQueue,
            contextQueue: contextTracks.length > 0 ? contextTracks : state.contextQueue,
            seekTrigger: null // Reset seek on new track
          };
        });

        // Trigger autoplay queue fetch immediately if it's a YouTube track, or if it already has youtubeId
        const resolvedId = track.youtubeId || (track.origin === 'youtube' ? track.id : null);
        if (resolvedId) {
          get().fetchAutoplayQueue(resolvedId);
        }
      },

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setPlaying: (playing) => set({ isPlaying: playing }),
      setVolume: (volume) => set({ volume }),
      addToQueue: (track) => set((state) => ({
        queue: [...state.queue, track]
      })),

      nextTrack: () => {
        const state = get();
        if (state.queue.length > 0) {
          const next = state.queue[0];
          const newQueue = state.queue.slice(1);
          state.playTrack(next);
          set({
            queue: newQueue,
            history: state.currentTrack 
              ? [state.currentTrack, ...state.history.filter(t => t.id !== state.currentTrack?.id)].slice(0, 50) 
              : state.history
          });
        } else if (state.repeatMode === 'all' && state.contextQueue.length > 0) {
          const next = state.contextQueue[0];
          state.playTrack(next, state.contextQueue);
        } else if (state.isAutoplayEnabled && state.autoplayQueue.length > 0) {
          const next = state.autoplayQueue[0];
          const newAutoplay = state.autoplayQueue.slice(1);
          state.playTrack(next);
          set({
            autoplayQueue: newAutoplay,
            history: state.currentTrack 
              ? [state.currentTrack, ...state.history.filter(t => t.id !== state.currentTrack?.id)].slice(0, 50) 
              : state.history
          });
        } else {
          set({ isPlaying: false, playedSeconds: 0 });
        }
      },

      prevTrack: () => {
        const state = get();
        if (state.history.length > 0) {
          const prev = state.history[0];
          const newHistory = state.history.slice(1);
          set({
            currentTrack: prev,
            isPlaying: true,
            history: newHistory,
            queue: state.currentTrack ? [state.currentTrack, ...state.queue] : state.queue
          });
          const resolvedId = prev.youtubeId || (prev.origin === 'youtube' ? prev.id : null);
          if (resolvedId) {
            get().fetchAutoplayQueue(resolvedId);
          }
        }
      },

      // Navigation Actions
      setActiveTab: (activeTab) => {
        get().pushNavState(activeTab, get().currentPlaylistId, get().currentChannelId);
        set({ activeTab, showNowPlaying: false });
      },
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedMood: (selectedMood) => set({ selectedMood }),
      setCurrentPlaylistId: (currentPlaylistId) => {
        get().pushNavState(get().activeTab, currentPlaylistId, get().currentChannelId);
        set({ currentPlaylistId, showNowPlaying: false });
      },
      setCurrentChannelId: (currentChannelId) => {
        get().pushNavState(get().activeTab, get().currentPlaylistId, currentChannelId);
        set({ currentChannelId, showNowPlaying: false });
      },

      // Search History Actions
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

      // User Profile & DB Sync Actions
      setDisplayName: (name) => set({ displayName: name }),
      setAvatarUrl: (url) => set({ avatarUrl: url }),
      setShareTrack: (track) => set({ shareTrack: track }),
      fetchDatabaseData: async () => {
        try {
          const res = await fetch('/api/user/sync');
          if (res.ok) {
            const data = await res.json();
            set({
              displayName: data.display_name || 'Anonymous Listener',
              avatarUrl: data.avatar_url || 'bg-gradient-to-tr from-blue-600 to-indigo-900',
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

      // YouTube Channel Details Actions
      fetchChannelDetails: async (idOrName, isName = false) => {
        try {
          const res = await fetch(`/api/youtube/channel/${encodeURIComponent(idOrName)}`);
          if (res.ok) {
            const data = await res.json();
            set({ 
              currentChannelDetails: data,
              currentChannelId: data.profile?.id || null
            });
          }
        } catch (e) {
          console.error('Error fetching channel details:', e);
        }
      },

      viewChannel: async (channelTitle, channelId) => {
        const idOrName = channelId || channelTitle;
        const isName = !channelId;
        get().pushNavState('channel', null, idOrName);
        set({ activeTab: 'channel', currentChannelDetails: null, currentChannelId: idOrName });
        
        await get().fetchChannelDetails(idOrName, isName);
      },

      playArtistRadio: async (artistIdOrName) => {
        try {
          const res = await fetch(`/api/youtube/channel/${encodeURIComponent(artistIdOrName)}`);
          if (res.ok) {
            const data = await res.json();
            const topSongs = (data.topSongs || []).slice(0, 20);
            if (topSongs.length > 0) {
              // Deterministic seeded Fisher-Yates shuffle based on artistIdOrName
              const seedStr = artistIdOrName || 'default_seed';
              const shuffled = [...topSongs];

              // simple hash to uint32
              let h = 2166136261 >>> 0;
              for (let i = 0; i < seedStr.length; i++) {
                h ^= seedStr.charCodeAt(i);
                h = Math.imul(h, 16777619) >>> 0;
              }

              // mulberry32 PRNG
              const rand = () => {
                h += 0x6D2B79F5;
                let t = Math.imul(h ^ (h >>> 15), 1 | h);
                t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
              };

              for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(rand() * (i + 1));
                const temp = shuffled[i];
                shuffled[i] = shuffled[j];
                shuffled[j] = temp;
              }

              const firstTrack = shuffled[0];
              const remaining = shuffled.slice(1);

              set({
                currentTrack: firstTrack,
                isPlaying: true,
                queue: remaining,
                history: [],
                showNowPlaying: false
              });
            }
          }
        } catch (e) {
          console.error('Failed to play artist radio:', e);
        }
      },

      // Collection Actions
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

      // Safe Mode
      hideExplicit: false,
      toggleHideExplicit: () => set((state) => ({ hideExplicit: !state.hideExplicit }))
    }),
    {
      name: 'yt-music-storage-v1',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? sessionStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      } as any)),
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        isPlaying: state.isPlaying,
        volume: state.volume,
        queue: state.queue,
        history: state.history,
        playedSeconds: state.playedSeconds,
        playlists: state.playlists,
        likedTracks: state.likedTracks,
        searchHistory: state.searchHistory,
        subscribedChannels: state.subscribedChannels,
        displayName: state.displayName,
        avatarUrl: state.avatarUrl,
        isMinimized: state.isMinimized,
        hideExplicit: state.hideExplicit
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true)
          try {
            state.setPlaying(false);
            state.setPlayedSeconds(0);
            state.setSeekTrigger(0);
          } catch (e) {
            console.warn('Rehydrate error', e)
          }
        }
      }
    }
  )
)
