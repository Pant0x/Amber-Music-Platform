import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type {
  PlaybackState,
  NavigationState,
  CollectionState,
  UISliceState,
  LyricsState,
  PersistenceState,
} from "./slices";

import { createPlaybackSlice } from "./slices/playbackSlice";
import { createNavigationSlice } from "./slices/navigationSlice";
import { createCollectionSlice } from "./slices/collectionSlice";
import { createUISlice } from "./slices/uiSlice";
import { createLyricsSlice } from "./slices/lyricsSlice";
import { createPersistenceSlice } from "./slices/persistenceSlice";

type AppState = PlaybackState &
  NavigationState &
  CollectionState &
  UISliceState &
  LyricsState &
  PersistenceState;

export const usePlayerStore = create<AppState>()(
  persist(
    (...args) => ({
      ...createPlaybackSlice(...args),
      ...createNavigationSlice(...args),
      ...createCollectionSlice(...args),
      ...createUISlice(...args),
      ...createLyricsSlice(...args),
      ...createPersistenceSlice(...args),
    }),
    {
      name: "amber-music-storage-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        queue: state.queue,
        queueIndex: state.queueIndex,
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat,
        crossfade: state.crossfade,
        playbackRate: state.playbackRate,
        playlists: state.playlists,
        likedTracks: state.likedTracks,
        followedArtists: state.followedArtists,
        subscribedChannels: state.subscribedChannels,
        localPlaylists: state.localPlaylists,
        downloadedTracks: Array.from(state.downloadedTracks),
        hideExplicit: state.hideExplicit,
        theme: state.theme,
        reducedMotion: state.reducedMotion,
        compactMode: state.compactMode,
        offset: state.offset,
        fontScale: state.fontScale,
        translationLanguage: state.translationLanguage,
        showTranslation: state.showTranslation,
        autoplayQueue: state.autoplayQueue,
        playHistory: state.playHistory,
        recentSearches: state.recentSearches,
        lastVolume: state.lastVolume,
        lastQuality: state.lastQuality,
        lastOutputDevice: state.lastOutputDevice,
        sessionRestored: state.sessionRestored,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.downloadedTracks = new Set(state.downloadedTracks);
          state.sessionRestored = true;
        }
      },
    }
  )
);

export const usePlaybackStore = () =>
  usePlayerStore(
    useShallow((s) => ({
      currentTrack: s.currentTrack,
      queue: s.queue,
      queueIndex: s.queueIndex,
      isPlaying: s.isPlaying,
      volume: s.volume,
      progress: s.progress,
      duration: s.duration,
      shuffle: s.shuffle,
      repeat: s.repeat,
      crossfade: s.crossfade,
      playbackRate: s.playbackRate,
      setCurrentTrack: s.setCurrentTrack,
      setQueue: s.setQueue,
      addToQueue: s.addToQueue,
      removeFromQueue: s.removeFromQueue,
      reorderQueue: s.reorderQueue,
      clearQueue: s.clearQueue,
      nextTrack: s.nextTrack,
      prevTrack: s.prevTrack,
      setQueueIndex: s.setQueueIndex,
      setIsPlaying: s.setIsPlaying,
      togglePlay: s.togglePlay,
      setVolume: s.setVolume,
      setProgress: s.setProgress,
      setDuration: s.setDuration,
      setShuffle: s.setShuffle,
      setRepeat: s.setRepeat,
      setCrossfade: s.setCrossfade,
      setPlaybackRate: s.setPlaybackRate,
    }))
  );

export const useNavigationStore = () =>
  usePlayerStore(
    useShallow((s) => ({
      activeTab: s.activeTab,
      previousTab: s.previousTab,
      history: s.history,
      historyIndex: s.historyIndex,
      channelViewing: s.channelViewing,
      setActiveTab: s.setActiveTab,
      goBack: s.goBack,
      goForward: s.goForward,
      canGoBack: s.canGoBack,
      canGoForward: s.canGoForward,
      setChannelViewing: s.setChannelViewing,
      navigateWithParams: s.navigateWithParams,
    }))
  );

export const useCollectionStore = () =>
  usePlayerStore(
    useShallow((s) => ({
      playlists: s.playlists,
      likedTracks: s.likedTracks,
      followedArtists: s.followedArtists,
      subscribedChannels: s.subscribedChannels,
      localPlaylists: s.localPlaylists,
      downloadedTracks: s.downloadedTracks,
      setPlaylists: s.setPlaylists,
      addPlaylist: s.addPlaylist,
      removePlaylist: s.removePlaylist,
      updatePlaylist: s.updatePlaylist,
      toggleLikeTrack: s.toggleLikeTrack,
      isTrackLiked: s.isTrackLiked,
      followArtist: s.followArtist,
      unfollowArtist: s.unfollowArtist,
      isArtistFollowed: s.isArtistFollowed,
      subscribeChannel: s.subscribeChannel,
      unsubscribeChannel: s.unsubscribeChannel,
      isChannelSubscribed: s.isChannelSubscribed,
      addLocalPlaylist: s.addLocalPlaylist,
      removeLocalPlaylist: s.removeLocalPlaylist,
      toggleDownload: s.toggleDownload,
      isTrackDownloaded: s.isTrackDownloaded,
    }))
  );

export const useUIStore = () =>
  usePlayerStore(
    useShallow((s) => ({
      leftPanelOpen: s.leftPanelOpen,
      rightPanelOpen: s.rightPanelOpen,
      lyricsOpen: s.lyricsOpen,
      minimized: s.minimized,
      hideExplicit: s.hideExplicit,
      theme: s.theme,
      reducedMotion: s.reducedMotion,
      compactMode: s.compactMode,
      activeModal: s.activeModal,
      modals: s.modals,
      notifications: s.notifications,
      toggleLeftPanel: s.toggleLeftPanel,
      setLeftPanel: s.setLeftPanel,
      setLeftPanelOpen: s.setLeftPanelOpen,
      toggleRightPanel: s.toggleRightPanel,
      setRightPanel: s.setRightPanel,
      setRightPanelOpen: s.setRightPanelOpen,
      toggleLyrics: s.toggleLyrics,
      setLyricsOpen: s.setLyricsOpen,
      setMinimized: s.setMinimized,
      toggleMinimized: s.toggleMinimized,
      setHideExplicit: s.setHideExplicit,
      setTheme: s.setTheme,
      setReducedMotion: s.setReducedMotion,
      setCompactMode: s.setCompactMode,
      openModal: s.openModal,
      closeModal: s.closeModal,
      closeAllModals: s.closeAllModals,
      addNotification: s.addNotification,
      removeNotification: s.removeNotification,
    }))
  );

export const useLyricsStore = () =>
  usePlayerStore(
    useShallow((s) => ({
      currentLyrics: s.currentLyrics,
      loading: s.loading,
      error: s.error,
      offset: s.offset,
      fontScale: s.fontScale,
      translationLanguage: s.translationLanguage,
      showTranslation: s.showTranslation,
      setLyrics: s.setLyrics,
      setLoading: s.setLoading,
      setError: s.setError,
      setOffset: s.setOffset,
      setFontScale: s.setFontScale,
      setTranslationLanguage: s.setTranslationLanguage,
      setShowTranslation: s.setShowTranslation,
      clearLyrics: s.clearLyrics,
    }))
  );

export const usePersistenceStore = () =>
  usePlayerStore(
    useShallow((s) => ({
      autoplayQueue: s.autoplayQueue,
      playHistory: s.playHistory,
      recentSearches: s.recentSearches,
      lastVolume: s.lastVolume,
      lastQuality: s.lastQuality,
      lastOutputDevice: s.lastOutputDevice,
      sessionRestored: s.sessionRestored,
      setAutoplayQueue: s.setAutoplayQueue,
      addToPlayHistory: s.addToPlayHistory,
      clearPlayHistory: s.clearPlayHistory,
      addRecentSearch: s.addRecentSearch,
      clearRecentSearches: s.clearRecentSearches,
      setLastVolume: s.setLastVolume,
      setLastQuality: s.setLastQuality,
      setLastOutputDevice: s.setLastOutputDevice,
      setSessionRestored: s.setSessionRestored,
    }))
  );