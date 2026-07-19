'use client';

import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Track } from '@/types/music-player';
import { cleanVisualName, parseFeaturedArtists } from '@/utils/text';
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
  Mic2,
  ListMusic,
  Laptop2,
  ExternalLink,
  Maximize2,
  PlusCircle,
  Check,
  X
} from 'lucide-react';
import { ArtistLinks } from './pages/shared';

const upgradeThumbnailUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.includes('googleusercontent.com')) {
    return url.replace(/=w\d+-h\d+.*$/, '=w544-h544-l90-rj').replace(/=s\d+.*$/, '=w544-h544-l90-rj');
  }
  if (url.includes('i.ytimg.com/vi/') || url.includes('img.youtube.com/vi/')) {
    const cleanUrl = url.split('?')[0];
    return cleanUrl.replace(/\/(default|mqdefault|sddefault|hqdefault|maxresdefault)\.jpg/, '/maxresdefault.jpg');
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
    activeTab,
    setActiveTab,
    navigateBack,
    pushNavState,
    currentPlaylistId,
    currentChannelId,
    artistSubTab,
    queue,
    setShowNowPlaying,
    setNowPlayingTab
  } = usePlayerStore();

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [showQueueMobile, setShowQueueMobile] = useState(false);

  useEffect(() => {
    setShowQueueMobile(false);
  }, [currentTrack?.id]);

  // Global lyrics caching and fetching
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
  }, [currentTrack?.id, currentTrack?.title, currentTrack?.channelTitle, currentTrack?.youtubeId, setGlobalLyricsData, setGlobalLyricsLoading]);

  if (!currentTrack) return null;

  const isLiked = likedTracks.some((t) => t.id === currentTrack.id);
  const parsed = parseFeaturedArtists(currentTrack.title);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fraction = parseFloat(e.target.value);
    setSeekTrigger(fraction * duration);
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

  const toggleSidebarView = (view: 'now-playing' | 'queue' | 'connect') => {
    if (rightSidebarView === view) {
      setRightSidebarView('now-playing');
    } else {
      setRightSidebarView(view);
    }
  };

  const handleFullscreen = () => {
    setShowNowPlaying(true);
    setNowPlayingTab('player');
  };

  const handlePiP = async () => {
    const video = document.querySelector('video');
    if (video) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await video.requestPictureInPicture();
        }
      } catch {}
    }
  };

  return (
    <div className="w-screen px-4 pb-4 pt-1 flex justify-center flex-shrink-0 relative z-50 bg-transparent">
      <div 
        className="h-[84px] w-full max-w-[1600px] rounded-3xl text-white border border-white/10 px-6 flex items-center justify-between select-none transition-all duration-1000 backdrop-blur-3xl bg-black/40 shadow-2xl shadow-black/50"
      >
      {/* 1. LEFT SECTION: Track Info */}
      <div className="flex items-center gap-3 w-[30%] min-w-[200px]">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-900 border border-white/5 flex-shrink-0 shadow-md shadow-black/40">
          <img 
            src={upgradeThumbnailUrl(currentTrack.thumbnailUrl) || undefined} 
            alt="" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = currentTrack.thumbnailUrl || '';
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-white truncate leading-tight hover:underline cursor-pointer" title={parsed.title}>
            {parsed.title}
          </h4>
          <div className="text-[11px] text-zinc-400 truncate mt-1 leading-none font-semibold" title={currentTrack.channelTitle}>
            <ArtistLinks channelTitle={currentTrack.channelTitle} channelId={currentTrack.channelId} />
          </div>
        </div>
        
        {/* Like and Add Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button 
            onClick={() => toggleLikeTrack(currentTrack)}
            className={`p-2 rounded-full hover:bg-white/5 transition-all ${
              isLiked ? 'text-[var(--theme-accent)]' : 'text-zinc-400 hover:text-white'
            }`}
            title={isLiked ? 'Remove from Liked' : 'Save to Liked'}
          >
            {isLiked ? <Check className="w-4 h-4 text-[var(--theme-accent)]" /> : <Heart className="w-4 h-4" />}
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
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
                        onClick={() => {
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
                      onClick={() => {
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

      {/* 2. MIDDLE SECTION: Playback Controls & Progress */}
      <div className="flex flex-col items-center gap-1.5 w-[40%] max-w-[600px]">
        {/* Controls Button Row */}
        <div className="flex items-center gap-5">
          <button 
            onClick={() => setIsShuffle(!isShuffle)}
            className={`p-1 rounded-full transition-all ${
              isShuffle ? 'text-[var(--theme-accent)]' : 'text-zinc-400 hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4.5 h-4.5" />
          </button>
          
          <button 
            onClick={prevTrack}
            className="p-1 text-zinc-400 hover:text-white transition-all"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all flex-shrink-0 group"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4.5 h-4.5 fill-current text-black" />
            ) : (
              <Play className="w-4.5 h-4.5 fill-current text-black ml-0.5" />
            )}
          </button>
          
          <button 
            onClick={nextTrack}
            className="p-1 text-zinc-400 hover:text-white transition-all"
            title="Next"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          
          <button 
            onClick={() => {
              if (repeatMode === 'none') setRepeatMode('all');
              else if (repeatMode === 'all') setRepeatMode('one');
              else setRepeatMode('none');
            }}
            className={`p-1 rounded-full transition-all relative ${
              repeatMode !== 'none' ? 'text-[var(--theme-accent)]' : 'text-zinc-400 hover:text-white'
            }`}
            title={`Repeat mode: ${repeatMode}`}
          >
            <Repeat className="w-4.5 h-4.5" />
            {repeatMode === 'one' && (
              <span className="absolute top-[-3px] right-[-3px] text-[7px] font-bold bg-[var(--theme-accent)] text-white w-2.5 h-2.5 rounded-full flex items-center justify-center font-sans shadow-sm">
                1
              </span>
            )}
          </button>
        </div>

        {/* Timeline Seekbar progress */}
        <div className="flex items-center gap-2.5 w-full">
          <span className="text-[11px] text-zinc-400 font-semibold w-8 text-right font-mono">{formatTime(playedSeconds)}</span>
          <div className="relative flex-1 flex items-center group py-2">
            <input 
              type="range"
              min="0"
              max="0.999"
              step="any"
              value={duration > 0 ? playedSeconds / duration : 0}
              onChange={handleScrub}
              className="yt-deck-slider w-full z-10 cursor-pointer"
            />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[4px] rounded-full pointer-events-none transition-all duration-300"
              style={{ width: `${(duration > 0 ? playedSeconds / duration : 0) * 100}%`, backgroundColor: 'var(--theme-accent, #1db954)' }}
            />
          </div>
          <span className="text-[11px] text-zinc-400 font-semibold w-8 font-mono">{formatTime(duration)}</span>
        </div>
      </div>

      {/* 3. RIGHT SECTION: Extra Controls & Volume */}
      <div className="flex items-center gap-3 w-[30%] min-w-[200px] justify-end">
        {/* Lyrics Button */}
        <button 
          onClick={() => {
            if (activeTab === 'lyrics') {
              navigateBack();
            } else {
              pushNavState(activeTab, currentPlaylistId, currentChannelId, artistSubTab);
              setActiveTab('lyrics');
            }
          }}
          className={`p-1.5 rounded-md hover:bg-white/5 transition-all ${
            activeTab === 'lyrics' ? 'text-[var(--theme-accent)]' : 'text-zinc-400 hover:text-white'
          }`}
          title="Lyrics"
        >
          <Mic2 className="w-4.5 h-4.5" />
        </button>

        {/* Queue Button */}
        <div className="relative">
          <button 
            onClick={() => {
              if (window.innerWidth < 1024) {
                setShowQueueMobile(!showQueueMobile);
              } else {
                toggleSidebarView('queue');
              }
            }}
            className={`p-1.5 rounded-md hover:bg-white/5 transition-all ${
              rightSidebarView === 'queue' ? 'text-[var(--theme-accent)]' : 'text-zinc-400 hover:text-white'
            }`}
            title="Queue"
          >
            <ListMusic className="w-4.5 h-4.5" />
          </button>
          {showQueueMobile && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
              <div className="w-full bg-zinc-900 rounded-t-2xl max-h-[70vh] overflow-y-auto p-4 animate-slide-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">Queue ({queue.length})</h3>
                  <button onClick={() => setShowQueueMobile(false)} className="p-1 text-zinc-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {queue.map((track, idx) => {
                  const qParsed = parseFeaturedArtists(track.title);
                  return (
                    <div key={`mq-${track.id}-${idx}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5">
                      <img src={upgradeThumbnailUrl(track.thumbnailUrl) || ''} className="w-10 h-10 rounded-md object-cover" alt="" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">{qParsed.title}</p>
                        <p className="text-xs text-zinc-400 truncate">{track.channelTitle}</p>
                      </div>
                    </div>
                  );
                })}
                {queue.length === 0 && <p className="text-zinc-500 text-sm text-center py-8">Queue is empty</p>}
              </div>
            </div>
          )}
        </div>

        {/* Connection Button */}
        <button 
          onClick={() => toggleSidebarView('connect')}
          className={`p-1.5 rounded-md hover:bg-white/5 transition-all ${
            rightSidebarView === 'connect' ? 'text-[var(--theme-accent)]' : 'text-zinc-400 hover:text-white'
          }`}
          title="Connect to a device"
        >
          <Laptop2 className="w-4.5 h-4.5" />
        </button>

        {/* Volume controls */}
        <div className="flex items-center gap-2 max-w-[120px] flex-1">
          <button 
            onClick={toggleMute}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
          </button>
          <div className="relative flex-1 flex items-center group py-2">
            <input 
              type="range"
              min="0"
              max="1"
              step="any"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="yt-volume-slider w-full z-10 cursor-pointer"
            />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[3.5px] rounded-full pointer-events-none transition-all duration-300"
              style={{ width: `${(isMuted ? 0 : volume) * 100}%`, backgroundColor: 'var(--theme-accent, #1db954)' }}
            />
          </div>
        </div>

        {/* Picture in picture */}
        <button 
          onClick={handlePiP}
          className="p-1.5 text-zinc-400 hover:text-white transition-all hidden sm:block"
          title="Miniplayer (PiP)"
        >
          <ExternalLink className="w-4.5 h-4.5" />
        </button>

        {/* Fullscreen */}
        <button 
          onClick={handleFullscreen}
          className="p-1.5 text-zinc-400 hover:text-white transition-all hidden sm:block"
          title="Fullscreen"
        >
          <Maximize2 className="w-4.5 h-4.5" />
        </button>
      </div>
      </div>
    </div>
  );
};
