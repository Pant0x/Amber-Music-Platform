'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Track, PlaybackState, PlaybackContextType, PlaybackProgress, ActiveTabType, Playlist } from '@/types/music-player';

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export const PlaybackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackHistory, setPlaybackHistory] = useState<Track[]>([]);
  const [activeTab, setActiveTabState] = useState<ActiveTabType>('home');
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [progress, setProgressState] = useState<PlaybackProgress>({
    played: 0,
    playedSeconds: 0,
    loaded: 0,
    loadedSeconds: 0,
  });
  
  // Track seek triggers
  const [seekTrigger, setSeekTrigger] = useState<number>(0);
  const [seekFraction, setSeekFraction] = useState<number>(0);

  // Scaled up states
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [queue, setQueue] = useState<Track[]>([]);
  const [likedTracks, setLikedTracks] = useState<string[]>([]);
  const [likedTracksDetails, setLikedTracksDetails] = useState<Track[]>([]);
  const [showQueuePanel, setShowQueuePanel] = useState<boolean>(false);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);

  // Read initial states from localStorage on client mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('yt_player_history');
    if (savedHistory) {
      try { setPlaybackHistory(JSON.parse(savedHistory)); } catch (e) {}
    }

    const savedVolume = localStorage.getItem('yt_player_volume');
    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      if (!isNaN(vol)) setVolumeState(vol);
    }

    const savedPlaylists = localStorage.getItem('yt_playlists');
    if (savedPlaylists) {
      try { setPlaylists(JSON.parse(savedPlaylists)); } catch (e) {}
    }

    const savedQueue = localStorage.getItem('yt_queue');
    if (savedQueue) {
      try { setQueue(JSON.parse(savedQueue)); } catch (e) {}
    }

    const savedLikes = localStorage.getItem('yt_liked_tracks');
    if (savedLikes) {
      try { setLikedTracks(JSON.parse(savedLikes)); } catch (e) {}
    }

    const savedLikesDetails = localStorage.getItem('yt_liked_tracks_details');
    if (savedLikesDetails) {
      try { setLikedTracksDetails(JSON.parse(savedLikesDetails)); } catch (e) {}
    }
  }, []);

  // Save history to localStorage on change
  const addToHistory = (track: Track) => {
    setPlaybackHistory((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 50); // limit history
      localStorage.setItem('yt_player_history', JSON.stringify(updated));
      return updated;
    });
  };

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    addToHistory(track);

    // Sync context playlist: make sure this track is loaded in current play context
    setPlaylist((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      if (!exists) {
        return [...prev, track];
      }
      return prev;
    });

    setProgressState({
      played: 0,
      playedSeconds: 0,
      loaded: 0,
      loadedSeconds: 0,
    });
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const setPlaying = (playing: boolean) => {
    setIsPlaying(playing);
  };

  const setVolume = (vol: number) => {
    const safeVol = Math.max(0, Math.min(1, vol));
    setVolumeState(safeVol);
    localStorage.setItem('yt_player_volume', safeVol.toString());
    if (safeVol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const setProgress = (prog: PlaybackProgress) => {
    setProgressState(prog);
  };

  const setActiveTab = (tab: ActiveTabType) => {
    setActiveTabState(tab);
    // If switching tabs, minimize playlist selection unless viewing library
    if (tab !== 'library') {
      setCurrentPlaylistId(null);
    }
  };

  const updateTrackMetadata = (id: string, metadata: { bpm?: number | null; key?: string | null }) => {
    // 1. Update active track in deck
    if (currentTrack && currentTrack.id === id) {
      setCurrentTrack((prev) => {
        if (!prev) return null;
        return { ...prev, ...metadata };
      });
    }

    // Helper updater logic for list collections
    const updateInList = (list: Track[]) => list.map((t) => (t.id === id ? { ...t, ...metadata } : t));

    setPlaybackHistory((prev) => {
      const updated = updateInList(prev);
      localStorage.setItem('yt_player_history', JSON.stringify(updated));
      return updated;
    });
    
    setPlaylist((prev) => updateInList(prev));

    setLikedTracksDetails((prev) => {
      const updated = updateInList(prev);
      localStorage.setItem('yt_liked_tracks_details', JSON.stringify(updated));
      return updated;
    });

    setQueue((prev) => {
      const updated = updateInList(prev);
      localStorage.setItem('yt_queue', JSON.stringify(updated));
      return updated;
    });

    setPlaylists((prev) => {
      const updated = prev.map((p) => ({
        ...p,
        tracks: updateInList(p.tracks),
      }));
      localStorage.setItem('yt_playlists', JSON.stringify(updated));
      return updated;
    });
  };

  // Playback navigation with active queue and circular lists
  const nextTrack = () => {
    // 1. Handle Play Queue first (FIFO)
    if (queue.length > 0) {
      const next = queue[0];
      setQueue((prev) => {
        const updated = prev.slice(1);
        localStorage.setItem('yt_queue', JSON.stringify(updated));
        return updated;
      });
      playTrack(next);
      return;
    }

    // 2. Circular playlist traversal
    if (playlist.length === 0 || !currentTrack) return;
    
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex === -1) {
      playTrack(playlist[0]);
      return;
    }

    const nextIndex = (currentIndex + 1) % playlist.length;
    playTrack(playlist[nextIndex]);
  };

  const prevTrack = () => {
    if (playlist.length === 0 || !currentTrack) return;

    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex === -1) {
      playTrack(playlist[0]);
      return;
    }

    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    playTrack(playlist[prevIndex]);
  };

  const seekTo = (fraction: number) => {
    setSeekFraction(fraction);
    setSeekTrigger((prev) => prev + 1);
  };

  // Playlists CRUD
  const createPlaylist = (name: string) => {
    const newPlaylist: Playlist = {
      id: `pl_${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim() || `Playlist #${playlists.length + 1}`,
      tracks: [],
      createdAt: new Date().toISOString(),
    };
    setPlaylists((prev) => {
      const updated = [...prev, newPlaylist];
      localStorage.setItem('yt_playlists', JSON.stringify(updated));
      return updated;
    });
  };

  const deletePlaylist = (id: string) => {
    setPlaylists((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem('yt_playlists', JSON.stringify(updated));
      return updated;
    });
    if (currentPlaylistId === id) {
      setCurrentPlaylistId(null);
    }
  };

  const addTrackToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists((prev) => {
      const updated = prev.map((p) => {
        if (p.id === playlistId) {
          const exists = p.tracks.some((t) => t.id === track.id);
          if (!exists) {
            return { ...p, tracks: [...p.tracks, track] };
          }
        }
        return p;
      });
      localStorage.setItem('yt_playlists', JSON.stringify(updated));
      return updated;
    });
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) => {
      const updated = prev.map((p) => {
        if (p.id === playlistId) {
          return { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) };
        }
        return p;
      });
      localStorage.setItem('yt_playlists', JSON.stringify(updated));
      return updated;
    });
  };

  // Liked Tracks CRUD
  const toggleLikeTrack = (track: Track) => {
    setLikedTracks((prev) => {
      const isLiked = prev.includes(track.id);
      let updatedIds: string[];
      
      if (isLiked) {
        updatedIds = prev.filter((id) => id !== track.id);
        setLikedTracksDetails((prevDetails) => {
          const updatedDetails = prevDetails.filter((t) => t.id !== track.id);
          localStorage.setItem('yt_liked_tracks_details', JSON.stringify(updatedDetails));
          return updatedDetails;
        });
      } else {
        updatedIds = [...prev, track.id];
        setLikedTracksDetails((prevDetails) => {
          const updatedDetails = [track, ...prevDetails];
          localStorage.setItem('yt_liked_tracks_details', JSON.stringify(updatedDetails));
          return updatedDetails;
        });
      }
      
      localStorage.setItem('yt_liked_tracks', JSON.stringify(updatedIds));
      return updatedIds;
    });
  };

  // Queue Operations
  const addToQueue = (track: Track) => {
    setQueue((prev) => {
      const updated = [...prev, track];
      localStorage.setItem('yt_queue', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromQueue = (trackId: string) => {
    setQueue((prev) => {
      const updated = prev.filter((t) => t.id !== trackId);
      localStorage.setItem('yt_queue', JSON.stringify(updated));
      return updated;
    });
  };

  const clearQueue = () => {
    setQueue([]);
    localStorage.removeItem('yt_queue');
  };

  const toggleQueuePanel = () => {
    setShowQueuePanel((prev) => !prev);
  };

  return (
    <PlaybackContext.Provider
      value={{
        currentTrack,
        isPlaying,
        volume,
        isMuted,
        playbackHistory,
        activeTab,
        progress,
        playTrack,
        togglePlay,
        setPlaying,
        setVolume,
        toggleMute,
        setProgress,
        setActiveTab,
        addToHistory,
        nextTrack,
        prevTrack,
        seekTo,
        seekTrigger,
        seekFraction,
        updateTrackMetadata,
        
        // Expose new scaled-up systems
        playlists,
        queue,
        likedTracks,
        showQueuePanel,
        currentPlaylistId,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        toggleLikeTrack,
        addToQueue,
        removeFromQueue,
        clearQueue,
        toggleQueuePanel,
        setCurrentPlaylistId,
        // Helper cast to satisfy type details mapping for library views
        ...({ likedTracksDetails, setPlaylist } as any),
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};

export const usePlayback = () => {
  const context = useContext(PlaybackContext);
  if (context === undefined) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
};
