'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { parseFeaturedArtists } from '@/utils/text';
import { ExplicitBadge } from './pages/shared';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  ListMusic,
  Maximize2,
  Mic2
} from 'lucide-react';
import { PlusCircle, Check, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

const upgradeThumbnailUrl = (url: string | undefined, youtubeId?: string): string => {
  if (!url) {
    if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    return '';
  }
  if (youtubeId && (url.includes('googleusercontent.com') || url.includes('ggpht.com'))) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }
  if (url.includes('googleusercontent.com')) {
    return url
      .replace(/=w\d+-h\d+.*$/, '=w544-h544-l90-rj')
      .replace(/=s\d+.*$/, '=w544-h544-l90-rj');
  }
  if (url.includes('i.ytimg.com/vi/') || url.includes('img.youtube.com/vi/')) {
    const cleanUrl = url.split('?')[0];
    return cleanUrl.replace(
      /\/(default|mqdefault|sddefault|hqdefault|maxresdefault)\.jpg/,
      '/hqdefault.jpg'
    );
  }
  return url;
};

const formatTime = (secs: number) => {
  if (isNaN(secs) || secs === null) return '0:00';
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const BottomPlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    likedTracks,
    toggleLikeTrack,
    nextTrack,
    prevTrack,
    togglePlay,
    playedSeconds,
    duration,
    setSeekTrigger,
    repeatMode,
    setRepeatMode,
    volume,
    setVolume,
    rightSidebarView,
    setRightSidebarView,
    playlists,
    createPlaylist,
    setGlobalLyricsData,
    setGlobalLyricsLoading,
    queue,
    showNowPlaying,
    nowPlayingTab,
    setShowNowPlaying,
    setNowPlayingTab
  } = usePlayerStore();

  const router = useRouter();
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  const [hoverVolume, setHoverVolume] = useState<number | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<'timeline' | 'volume' | null>(null);

  const lyricsCache = React.useRef(new Map<string, any>());
  const lyricsAbortRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    if (!currentTrack) return;

    const cacheKey = `${currentTrack.id}_${currentTrack.title}_${currentTrack.channelTitle}_${currentTrack.youtubeId || ''}`;

    if (lyricsAbortRef.current) {
      lyricsAbortRef.current.abort();
    }

    if (lyricsCache.current.has(cacheKey)) {
      setGlobalLyricsData(lyricsCache.current.get(cacheKey));
      setGlobalLyricsLoading(false);
      return;
    }

    setGlobalLyricsLoading(true);

    const controller = new AbortController();
    lyricsAbortRef.current = controller;

    const queryVideoId = currentTrack.youtubeId || currentTrack.id;
    fetch(`/api/lyrics?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.channelTitle)}&duration=${encodeURIComponent(currentTrack.duration || '3:00')}&videoId=${encodeURIComponent(queryVideoId)}`, {
      signal: controller.signal
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (controller.signal.aborted) return;
        if (data?.lyrics) {
          lyricsCache.current.set(cacheKey, data);
          setGlobalLyricsData(data);
        } else {
          lyricsCache.current.set(cacheKey, null);
          setGlobalLyricsData(null);
        }
      })
      .catch(err => {
        if (err?.name === 'AbortError') return;
        console.error('Failed to load lyrics:', err);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setGlobalLyricsLoading(false);
        }
      });

    return () => controller.abort();
  }, [currentTrack?.id, currentTrack?.title, currentTrack?.channelTitle, currentTrack?.youtubeId]);

  if (!currentTrack) return null;

  const isLiked = likedTracks.some((t) => t.id === currentTrack.id);
  const parsed = parseFeaturedArtists(currentTrack.title);

  const handleScrub = (value: number, isDragging: boolean = true) => {
    if (isDragging && isDraggingRef.current === 'timeline') {
      setHoverProgress(value);
    } else if (!isDragging) {
      setSeekTrigger(value * duration);
      setHoverProgress(null);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume || 0.5);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (vol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Navigate to artist/channel page
  const navigateToTrackPage = () => {
    if (currentTrack.channelId) {
      router.push(`/artist/${encodeURIComponent(currentTrack.channelId)}`);
    }
  };

  // Click handler for the entire dock
  const handleDockClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // If clicking on buttons, inputs, or slider, don't close
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('.yt-deck-slider') ||
      target.closest('.yt-volume-slider')
    ) {
      return;
    }
    
    // If clicking on the left section (track info), navigate to artist page
    if (target.closest('.track-info-section')) {
      navigateToTrackPage();
      return;
    }
    
    // Toggle now playing view
    if (!showNowPlaying) {
      setShowNowPlaying(true);
      setNowPlayingTab('upnext');
    }
  }, [showNowPlaying, setShowNowPlaying, setNowPlayingTab, navigateToTrackPage]);

  // Mouse move handlers for hover seek
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    
    if (isDraggingRef.current === 'timeline' && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      setHoverProgress(percentage);
    }
    
    if (isDraggingRef.current === 'volume' && volumeRef.current) {
      const rect = volumeRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      setHoverVolume(percentage);
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, element: 'timeline' | 'volume') => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = element;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current === 'timeline' && hoverProgress !== null) {
      setSeekTrigger(hoverProgress * duration);
    }
    isDraggingRef.current = null;
    setHoverProgress(null);
    setHoverVolume(null);
  }, [hoverProgress, duration, setSeekTrigger]);

  useEffect(() => {
    if (isDraggingRef.current) {
      const handler = (e: MouseEvent) => handleMouseMove(e);
      const upHandler = () => handleMouseUp();
      
      document.addEventListener('mousemove', handler);
      document.addEventListener('mouseup', upHandler);
      
      return () => {
        document.removeEventListener('mousemove', handler);
        document.removeEventListener('mouseup', upHandler);
      };
    }
  }, [isDraggingRef.current, handleMouseMove, handleMouseUp]);

  return (
    <div 
      onClick={handleDockClick}
      className="w-screen px-4 pb-4 pt-1 flex justify-center flex-shrink-0 relative z-50 bg-transparent cursor-pointer"
    >
      <div className="h-[84px] w-full max-w-[1600px] rounded-3xl text-white border border-white/[0.08] px-6 flex items-center justify-between select-none transition-all duration-1000 backdrop-blur-2xl bg-zinc-950/75 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {/* LEFT SECTION: Track Info - Clickable to navigate */}
        <div className="flex items-center gap-3 w-[30%] min-w-[200px] track-info-section">
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-900 border border-white/5 flex-shrink-0 shadow-md shadow-black/40">
            <img 
              src={upgradeThumbnailUrl(currentTrack.thumbnailUrl, currentTrack.youtubeId || currentTrack.id)}
              alt={parsed.title}
              className={`w-full h-full object-cover transition-transform duration-300 ${
                currentTrack.origin !== 'spotify' ? 'scale-[1.22]' : 'scale-100'
              }`}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).onerror = null;
                (e.currentTarget as HTMLImageElement).src = currentTrack.thumbnailUrl || '';
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate leading-tight hover:underline cursor-pointer" title={parsed.title}>
              {parsed.title || 'Unknown Track'}
            </h4>
            <div className="text-[11px] text-zinc-400 truncate mt-1 leading-none font-semibold" title={currentTrack.channelTitle}>
              {currentTrack.channelTitle || 'Unknown Artist'}
            </div>
          </div>
          {/* Like and Add Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleLikeTrack(currentTrack); }}
              className={`p-2 rounded-full transition-all ${
                isLiked ? 'text-[var(--theme-accent)]' : 'text-zinc-400 hover:text-white'
              }`}
              title={isLiked ? 'Remove from Liked' : 'Save to Liked'}
            >
              {isLiked ? (
                <Heart className="w-5 h-5 fill-current text-[var(--theme-accent)]" />
              ) : (
                <Heart className="w-5 h-5" />
              )}
            </button>
            
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowPlaylistMenu(!showPlaylistMenu); }}
                className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all"
                title="Add to playlist"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
              {showPlaylistMenu && (
                <div className="absolute bottom-12 left-0 w-48 bg-zinc-950/95 border border-white/10 rounded-xl p-2 shadow-2xl z-50 text-xs">
                  <p className="text-zinc-500 font-bold px-2 py-1 uppercase tracking-wider text-[9px] mb-1">Add to Playlist</p>
                  <div className="max-h-36 overflow-y-auto space-y-0.5 custom-scrollbar">
                    {playlists.map(pl => {
                      const hasTrack = pl.tracks.some(t => t.id === currentTrack.id);
                      return (
                        <button
                          key={pl.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            usePlayerStore.getState().addTrackToPlaylist(pl.id, currentTrack);
                            setShowPlaylistMenu(false);
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-white/5 text-white truncate flex items-center justify-between"
                        >
                          <span>{pl.name}</span>
                          {hasTrack && <Check className="w-3.5 h-3.5 text-[var(--theme-accent)]" />}
                        </button>
                      );
                    })}
                    {playlists.length === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const name = prompt('Enter Playlist Name:');
                          if (name) createPlaylist(name);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white"
                      >
                        + Create Playlist
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: Playback Controls & Progress */}
        <div className="flex flex-col items-center gap-1.5 w-[40%] max-w-[600px]">
          {/* Controls Button Row */}
          <div className="flex items-center gap-5">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsShuffle(!isShuffle); }}
              className={`p-1 rounded-full transition-all ${
                isShuffle ? 'text-[var(--theme-accent)]' : 'text-zinc-400 hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-5 h-5" />
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); prevTrack(); }}
              className="p-1 text-zinc-400 hover:text-white transition-all"
              title="Previous"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all flex-shrink-0"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current text-black" />
              ) : (
                <Play className="w-5 h-5 fill-current text-black ml-0.5" />
              )}
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); nextTrack(); }}
              className="p-1 text-zinc-400 hover:text-white transition-all"
              title="Next"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (repeatMode === 'none') setRepeatMode('all');
                else if (repeatMode === 'all') setRepeatMode('one');
                else setRepeatMode('none');
              }}
              className={`p-1 rounded-full transition-all relative ${
                repeatMode !== 'none' ? 'text-[var(--theme-accent)]' : 'text-zinc-400 hover:text-white'
              }`}
              title={`Repeat mode: ${repeatMode}`}
            >
              <Repeat className="w-5 h-5" />
              {repeatMode === 'one' && (
                <span className="absolute top-[-3px] right-[-3px] text-[7px] font-bold bg-[var(--theme-accent)] text-white w-2.5 h-2.5 rounded-full flex items-center justify-center font-sans shadow-sm">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Timeline Seekbar */}
          <div 
            ref={timelineRef}
            className="relative flex items-center gap-2.5 w-full"
            onMouseEnter={(e) => {
              const target = e.currentTarget;
              const rect = target.getBoundingClientRect();
              const x = 0;
              const percentage = 1;
              const initialPos = e.nativeEvent.clientX - rect.left;
              const initialPercentage = initialPos / rect.width;
              setHoverProgress(initialPercentage);
            }}
          >
            <span className="text-[11px] text-zinc-400 font-semibold w-8 text-right font-mono">
              {formatTime(hoverProgress !== null ? hoverProgress * duration : playedSeconds)}
            </span>
            <div className="flex-1 h-6 flex items-center justify-center group">
              <input 
                type="range"
                min="0"
                max="0.999"
                step="any"
                value={duration > 0 ? playedSeconds / duration : 0}
                onChange={(e) => handleScrub(parseFloat(e.target.value))}
                className="absolute w-full opacity-0 cursor-pointer"
                onMouseDown={(e) => handleMouseDown(e, 'timeline')}
                onMouseEnter={() => {
                  const target = e.currentTarget;
                  const rect = target.getBoundingClientRect();
                  const x = e.nativeEvent.clientX - rect.left;
                  const percentage = Math.max(0, Math.min(1, x / rect.width));
                  setHoverProgress(percentage);
                }}
              />
              {/* Progress bar */}
              <div 
                className="h-1 w-full max-w-[400px] bg-zinc-700 rounded-full overflow-hidden"
                style={{ height: '4px' }}
              >
                <div 
                  className="h-full transition-all duration-200"
                  style={{ 
                    width: `${(duration > 0 ? playedSeconds / duration : 0) * 100}%`, 
                    backgroundColor: 'var(--theme-accent)' 
                  }}
                />
              </div>
              {/* Hover circle */}
              {hoverProgress !== null && (
                <div 
                  className="absolute -top-2 w-5 h-5 rounded-full bg-[var(--theme-accent)] border-2 border-black shadow-lg flex items-center justify-center transition-all duration-200"
                  style={{
                    left: `${hoverProgress * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                />
              )}
            </div>
            <span className="text-[11px] text-zinc-400 font-semibold w-8 font-mono">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* RIGHT SECTION: Extra Controls & Volume */}
        <div className="flex items-center gap-3 w-[30%] min-w-[200px] justify-end">
          {/* Lyrics Button */}
          <button 
            onClick={(e) => { 
              e.stopPropagation();
              if (showNowPlaying && nowPlayingTab === 'lyrics') {
                setShowNowPlaying(false);
              } else {
                setShowNowPlaying(true);
                setNowPlayingTab('lyrics');
              }
            }}
            className={`p-1.5 rounded-md hover:bg-white/5 transition-all ${
              showNowPlaying && nowPlayingTab === 'lyrics' ? 'text-[#E88EAC]' : 'text-zinc-400 hover:text-white'
            }`}
            title="Lyrics"
          >
            <Mic2 className="w-5 h-5" />
          </button>

          {/* Queue Button */}
          <button 
            onClick={(e) => { 
              e.stopPropagation();
              if (showNowPlaying && nowPlayingTab === 'upnext') {
                setShowNowPlaying(false);
              } else {
                setShowNowPlaying(true);
                setNowPlayingTab('upnext');
              }
            }}
            className={`p-1.5 rounded-md hover:bg-white/5 transition-all ${
              showNowPlaying && nowPlayingTab === 'upnext' ? 'text-[#E88EAC]' : 'text-zinc-400 hover:text-white'
            }`}
            title="Queue"
          >
            <ListMusic className="w-5 h-5" />
          </button>

          {/* Volume controls */}
          <div className="flex items-center gap-2 max-w-[120px] flex-1">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              className="text-zinc-400 hover:text-white transition-colors p-1"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <div 
              ref={volumeRef}
              className="relative flex items-center group py-2"
            >
              <input 
                type="range"
                min="0"
                max="1"
                step="any"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="absolute w-full opacity-0 cursor-pointer"
                onMouseDown={(e) => handleMouseDown(e, 'volume')}
                onMouseEnter={() => {
                  const rect = (e.currentTarget as HTMLInputElement).getBoundingClientRect();
                  const percentage = 0.5;
                  setHoverVolume(percentage);
                }}
              />
              <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-200"
                  style={{ 
                    width: `${(isMuted ? 0 : volume) * 100}%`, 
                    backgroundColor: 'var(--theme-accent)' 
                  }}
                />
              </div>
              {/* Hover circle for volume */}
              {hoverVolume !== null && (
                <div 
                  className="absolute -top-2 w-5 h-5 rounded-full bg-[var(--theme-accent)] border-2 border-black shadow-lg flex items-center justify-center transition-all duration-200"
                  style={{
                    right: `${hoverVolume * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                />
              )}
            </div>
          </div>

          {/* Fullscreen Toggle */}
          <button 
            onClick={(e) => { 
              e.stopPropagation();
              if (showNowPlaying) {
                setShowNowPlaying(false);
              } else {
                setShowNowPlaying(true);
                setNowPlayingTab('lyrics');
              }
            }}
            className={`p-1.5 transition-all hidden sm:block ${
              showNowPlaying ? 'text-[#E88EAC]' : 'text-zinc-400 hover:text-white'
            }`}
            title={showNowPlaying ? "Exit Fullscreen" : "Fullscreen"}
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomPlayerBar;