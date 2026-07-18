'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { ExplicitBadge, PlayingEqualizer } from './pages/shared';
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
  VolumeX,
  Trash2,
  X,
  ListMusic,
  History,
  Laptop,
  Tv,
  HelpCircle,
  Info,
  ExternalLink
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
    setVolume,
    rightSidebarView,
    setRightSidebarView,
    queue,
    history,
    removeFromQueue,
    clearQueue,
    playTrack,
    viewChannel
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

  // 1. QUEUE SIDEBAR VIEW
  if (rightSidebarView === 'queue') {
    return (
      <div 
        className="hidden lg:flex w-[380px] flex-col select-none h-full flex-shrink-0 overflow-hidden relative z-20 transition-all duration-1000 p-6"
        style={{ background: 'var(--theme-player-bg, #0a0909)' }}
      >
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Play Queue</h3>
            <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-zinc-300">
              {queue.length}
            </span>
          </div>
          <button 
            onClick={() => setRightSidebarView('now-playing')}
            className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all"
            title="Close Queue"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pr-1">
          {/* Currently Playing Track */}
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Now playing</span>
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
              <img 
                src={upgradeThumbnailUrl(currentTrack.thumbnailUrl) || undefined} 
                className="w-10 h-10 rounded-md object-cover flex-shrink-0" 
                alt="" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = currentTrack.thumbnailUrl || '';
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{parsed.title}</p>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5 font-semibold">{currentTrack.channelTitle}</p>
              </div>
              <PlayingEqualizer isPlaying={isPlaying} />
            </div>
          </div>

          {/* Next Up */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Next up</span>
              {queue.length > 0 && (
                <button onClick={clearQueue} className="text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-all">
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
            
            <div className="space-y-1">
              {queue.map((track, idx) => {
                const trParsed = parseFeaturedArtists(track.title);
                return (
                  <div 
                    key={`q-${track.id}-${idx}`}
                    onClick={() => playTrack(track, queue.slice(idx + 1))}
                    className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all duration-200"
                  >
                    <img 
                      src={upgradeThumbnailUrl(track.thumbnailUrl) || undefined} 
                      className="w-9 h-9 rounded-md object-cover flex-shrink-0" 
                      alt="" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = track.thumbnailUrl || '';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{trParsed.title}</p>
                      <p className="text-[10px] text-zinc-450 truncate mt-0.5 font-medium">{track.channelTitle}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFromQueue(track.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white hover:bg-white/5 rounded-md transition-all"
                      title="Remove from queue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              {queue.length === 0 && (
                <p className="text-zinc-500 text-xs italic py-4 text-center">Queue is empty.</p>
              )}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Recently played</span>
              <div className="space-y-1">
                {history.slice(-10).reverse().map((track, idx) => {
                  const histParsed = parseFeaturedArtists(track.title);
                  return (
                    <div 
                      key={`h-${track.id}-${idx}`}
                      onClick={() => playTrack(track)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all duration-200"
                    >
                      <img 
                        src={upgradeThumbnailUrl(track.thumbnailUrl) || undefined} 
                        className="w-9 h-9 rounded-md object-cover flex-shrink-0" 
                        alt="" 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = track.thumbnailUrl || '';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{histParsed.title}</p>
                        <p className="text-[10px] text-zinc-450 truncate mt-0.5 font-medium">{track.channelTitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. CONNECT SIDEBAR VIEW
  if (rightSidebarView === 'connect') {
    return (
      <div 
        className="hidden lg:flex w-[380px] flex-col select-none h-full flex-shrink-0 overflow-hidden relative z-20 transition-all duration-1000 p-6"
        style={{ background: 'var(--theme-player-bg, #0a0909)' }}
      >
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h3 className="text-base font-bold text-white">Connect to a device</h3>
          <button 
            onClick={() => setRightSidebarView('now-playing')}
            className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all"
            title="Close Connect"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
          {/* Active device */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-[#1db954]/25 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-[#1db954]/10 flex items-center justify-center flex-shrink-0 text-[#1db954]">
              <Laptop className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#1db954]">Wired Connection</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">Active Listening</p>
            </div>
          </div>

          {/* LG TV Available Device */}
          <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition-all duration-200">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 text-zinc-400">
              <Tv className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-350">[LG] webOS TV UP7750PVB</p>
              <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Install Spotify to listen</p>
            </div>
          </div>
        </div>

        {/* Bottom Menu help triggers */}
        <div className="mt-auto border-t border-white/5 pt-4 space-y-3 flex-shrink-0 text-[11px] font-semibold text-zinc-400">
          <a href="#" className="flex items-center justify-between hover:text-white transition-colors py-1">
            <span>Don't see your device?</span>
            <HelpCircle className="w-3.5 h-3.5" />
          </a>
          <a href="#" className="flex items-center justify-between hover:text-white transition-colors py-1">
            <span>What can I connect to?</span>
            <Info className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // 3. NOW PLAYING SIDEBAR VIEW (DEFAULT)

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
                isLiked ? 'text-[#1db954]' : 'text-zinc-500 hover:text-white'
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
