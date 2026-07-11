'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { ExplicitBadge } from './pages/shared';
import { cleanVisualName, parseFeaturedArtists } from '@/utils/text';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Heart,
  Music,
  Video,
  Volume2,
  VolumeX
} from 'lucide-react';

const upgradeThumbnailUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.includes('googleusercontent.com')) {
    return url.replace(/=w\d+-h\d+.*$/, '=w544-h544-l90-rj').replace(/=s\d+.*$/, '=w544-h544-l90-rj');
  }
  if (url.includes('i.ytimg.com/vi/') || url.includes('img.youtube.com/vi/')) {
    const cleanUrl = url.split('?')[0];
    return cleanUrl.replace(/\/(default|mqdefault|sddefault|hqdefault|maxresdefault)\.jpg/, '/hqdefault.jpg');
  }
  return url;
};

const formatTime = (secs: number) => {
  if (isNaN(secs)) return '0:00';
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const PlayerDock: React.FC = () => {
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
    playbackMode,
    setPlaybackMode,
    volume,
    setVolume
  } = usePlayerStore();

  const [lyricsData, setLyricsData] = useState<{ lyrics: string; lines: { text: string; time: number }[]; isSynced?: boolean } | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  const activeLyricRef = useRef<HTMLParagraphElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  const isLiked = currentTrack ? likedTracks.some((t) => t.id === currentTrack.id) : false;

  // Sync lyrics fetching
  const lyricsCache = useRef(new Map<string, any>());
  const lyricsAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!currentTrack) return;

    const cacheKey = `${currentTrack.id}_${currentTrack.title}_${currentTrack.channelTitle}_${currentTrack.youtubeId || ''}`;

    if (lyricsAbortRef.current) {
      lyricsAbortRef.current.abort();
    }

    if (lyricsCache.current.has(cacheKey)) {
      setLyricsData(lyricsCache.current.get(cacheKey));
      setLyricsLoading(false);
      return;
    }

    setLyricsLoading(true);

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
          setLyricsData(data);
        } else {
          lyricsCache.current.set(cacheKey, null);
          setLyricsData(null);
        }
      })
      .catch(err => {
        if (err?.name === 'AbortError') return;
        console.error('Failed to load lyrics:', err);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLyricsLoading(false);
        }
      });

    return () => controller.abort();
  }, [currentTrack?.id, currentTrack?.title, currentTrack?.channelTitle, currentTrack?.youtubeId]);

  // Synced Lyrics index calculations
  const [unsyncedActiveIndex, setUnsyncedActiveIndex] = useState(-1);

  const handleLyricScroll = useCallback(() => {
    const container = lyricsContainerRef.current;
    if (!container || !lyricsData?.lines || lyricsData.isSynced) return;
    const containerCenter = container.scrollTop + container.clientHeight / 2;
    const lines = container.querySelectorAll('[data-lyric-line]');
    let closestIdx = -1;
    let closestDist = Infinity;
    lines.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      const lineMid = rect.top + rect.height / 2 - container.getBoundingClientRect().top;
      const dist = Math.abs(lineMid - containerCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });
    setUnsyncedActiveIndex(closestIdx);
  }, [lyricsData, lyricsContainerRef]);

  const activeLineIndex = React.useMemo(() => {
    if (!lyricsData?.lines) return -1;
    if (lyricsData.isSynced) {
      const lines = lyricsData.lines;
      let low = 0;
      let high = lines.length - 1;
      let bestMatch = -1;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const line = lines[mid];
        
        if (line.time === -999) {
          return lines.findIndex((l, idx) => {
            const nextL = lines[idx + 1];
            return l.time !== -999 && playedSeconds >= l.time && (!nextL || playedSeconds < nextL.time);
          });
        }

        if (playedSeconds >= line.time) {
          bestMatch = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      return bestMatch;
    }
    return unsyncedActiveIndex;
  }, [lyricsData, playedSeconds, unsyncedActiveIndex]);

  // Scroll active lyric to center
  const scrollToActiveLyric = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = lyricsContainerRef.current;
    const element = activeLyricRef.current;
    if (!container || !element) return;

    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const targetTop = elementRect.top - containerRect.top + container.scrollTop - containerRect.height / 2 + elementRect.height / 2;

    container.scrollTo({
      top: targetTop,
      behavior
    });
  }, [lyricsContainerRef, activeLyricRef]);

  useEffect(() => {
    if (activeLineIndex < 0 || !lyricsData?.lines) return;
    const timer = setTimeout(() => {
      scrollToActiveLyric('smooth');
    }, 100);
    return () => clearTimeout(timer);
  }, [activeLineIndex, lyricsData, scrollToActiveLyric]);

  if (!currentTrack) return null;

  const parsed = parseFeaturedArtists(currentTrack.title);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fraction = parseFloat(e.target.value);
    setSeekTrigger(fraction * duration);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div 
      className="hidden lg:flex w-[380px] flex-col select-none h-full flex-shrink-0 overflow-hidden relative z-20 transition-all duration-1000"
      style={{ background: 'var(--theme-player-bg, #0a0909)' }}
    >
      
      {/* Scrollable Container for Player & Lyrics */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-6">
        
        {/* Album Art / Video Player Frame */}
        <div 
          className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-900 border flex-shrink-0 transition-all duration-1000"
          style={{ boxShadow: '0 20px 45px -10px var(--theme-glow)', borderColor: 'var(--theme-border)' }}
        >
          {playbackMode === 'video' ? (
            /* Portal target for ReactPlayer Video projection */
            <div 
              id="player-dock-video-portal" 
              className="w-full h-full bg-black relative"
            >
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500 gap-2">
                <Video className="w-6 h-6 animate-pulse" />
                <span className="text-xs font-semibold">Video Streaming</span>
              </div>
            </div>
          ) : (
            <img
              src={upgradeThumbnailUrl(currentTrack.thumbnailUrl) || undefined}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = currentTrack.thumbnailUrl || '';
              }}
              alt={currentTrack.title}
              className="w-full h-full object-cover select-none"
            />
          )}
        </div>

        {/* Title, Artist, Mode Toggle & Like Button */}
        <div className="mt-5 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1 pr-4">
              <h2 className="text-lg font-bold text-white leading-snug truncate flex items-center gap-1.5" title={parsed.title}>
                {parsed.title}
                {currentTrack.isExplicit && <ExplicitBadge />}
              </h2>
              <p className="text-sm font-semibold text-zinc-400 truncate mt-0.5" title={currentTrack.channelTitle}>
                {currentTrack.channelTitle}
              </p>
            </div>
            
            <button
              onClick={() => toggleLikeTrack(currentTrack)}
              className={`p-2 rounded-full hover:bg-white/5 transition-all flex-shrink-0 ${
                isLiked ? 'text-[#ff0055]' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Mode Selector Pill (Song vs Video) */}
          <div className="flex bg-zinc-950/80 border border-white/5 p-0.5 rounded-full text-xs font-bold mt-4 w-fit shadow-md">
            <button
              onClick={() => setPlaybackMode('song')}
              className={`px-4 py-1 rounded-full transition-all duration-200 font-bold tracking-wide flex items-center gap-1.5 ${
                playbackMode === 'song'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              Song
            </button>
            <button
              onClick={() => setPlaybackMode('video')}
              className={`px-4 py-1 rounded-full transition-all duration-200 font-bold tracking-wide flex items-center gap-1.5 ${
                playbackMode === 'video'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Video
            </button>
          </div>
        </div>

        {/* Seekbar and Timer */}
        <div className="mt-5 flex-shrink-0">
          <div className="relative flex items-center group w-full">
            <input
              type="range"
              min="0"
              max="0.999"
              step="any"
              value={duration > 0 ? playedSeconds / duration : 0}
              onChange={handleScrub}
              className="yt-deck-slider w-full"
            />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full pointer-events-none transition-all duration-300"
              style={{ width: `${(duration > 0 ? playedSeconds / duration : 0) * 100}%`, backgroundColor: 'var(--theme-accent)' }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold font-mono mt-1.5">
            <span>{formatTime(playedSeconds)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls Row */}
        <div className="mt-4 flex items-center justify-between px-2 flex-shrink-0">
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`p-2 rounded-full hover:bg-white/5 transition-all ${
              isShuffle ? 'text-[#ff0055]' : 'text-zinc-500 hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={prevTrack}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg transition-all active:scale-95 flex-shrink-0"
            style={{ backgroundColor: 'var(--theme-accent)' }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current text-white" />
            ) : (
              <Play className="w-5 h-5 fill-current text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
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
            className={`p-2 rounded-full hover:bg-white/5 transition-all relative ${
              repeatMode !== 'none' ? 'text-[#ff0055]' : 'text-zinc-500 hover:text-white'
            }`}
            title={`Repeat mode: ${repeatMode}`}
          >
            <Repeat className="w-4.5 h-4.5" />
            {repeatMode === 'one' && (
              <span className="absolute top-1 right-1 text-[8px] font-bold bg-[#ff0055] text-white w-3 h-3 rounded-full flex items-center justify-center border border-[#0a0909]">
                1
              </span>
            )}
          </button>
        </div>

        {/* Volume controls for convenience */}
        <div className="mt-4 flex items-center gap-3 px-2 flex-shrink-0">
          <button
            onClick={toggleMute}
            className="text-zinc-500 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4.5 h-4.5" />
            ) : (
              <Volume2 className="w-4.5 h-4.5" />
            )}
          </button>
          <div className="relative flex-1 flex items-center group py-2">
            <input
              type="range"
              min="0"
              max="1"
              step="any"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="yt-volume-slider w-full z-10 cursor-pointer"
            />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full pointer-events-none transition-all duration-300"
              style={{ width: `${(isMuted ? 0 : volume) * 100}%`, backgroundColor: 'var(--theme-accent)' }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-white/5 my-5 flex-shrink-0" />

        {/* LYRICS Header & synced text */}
        <div className="flex-1 flex flex-col min-h-0 select-none">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex-shrink-0">
            Lyrics
          </h3>

          <div 
            ref={lyricsContainerRef}
            onScroll={handleLyricScroll}
            className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar text-center text-sm font-bold tracking-tight pb-8 select-text"
            style={{ contentVisibility: 'auto' }}
          >
            {lyricsLoading ? (
              <div className="space-y-4 animate-pulse pt-4">
                <div className="h-4 bg-white/5 rounded w-3/4 mx-auto" />
                <div className="h-4 bg-white/5 rounded w-1/2 mx-auto" />
                <div className="h-4 bg-white/5 rounded w-5/6 mx-auto" />
                <div className="h-4 bg-white/5 rounded w-2/3 mx-auto" />
              </div>
            ) : lyricsData?.lines ? (
              lyricsData.lines.map((line, idx) => {
                const isActive = idx === activeLineIndex;
                return (
                  <p
                    key={`lyric-${idx}`}
                    ref={isActive ? activeLyricRef : null}
                    data-lyric-line
                    onClick={() => {
                      if (line.time !== -999) {
                        setSeekTrigger(line.time);
                      }
                    }}
                    className={`cursor-pointer transition-all duration-300 py-1.5 px-3 rounded-lg text-base leading-relaxed border border-transparent ${
                      isActive
                        ? 'text-white text-lg font-extrabold scale-[1.02] shadow-md shadow-black/10'
                        : 'text-zinc-650 hover:text-zinc-300 font-semibold'
                    }`}
                    style={isActive ? { backgroundColor: 'var(--theme-border)', borderColor: 'var(--theme-glow)' } : {}}
                  >
                    {line.text}
                  </p>
                );
              })
            ) : (
              <p className="text-zinc-500 text-xs font-medium italic pt-4">
                Lyrics are not available for this track.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
