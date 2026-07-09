'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Track } from '@/types/music-player';
import { ExplicitBadge } from './pages/shared';
import { cleanVisualName, parseFeaturedArtists, splitArtistNames } from '@/utils/text';
import {
  Shrink,
  Play,
  Pause,
  ThumbsUp,
  ThumbsDown,
  Heart,
  PlusCircle,
  X,
  Trash2,
  Disc,
  Compass,
  Radio,
  User,
  Check,
  ExternalLink,
  Share2,
  ArrowDownToLine
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

const LyricSkeleton = () => (
  <div className="flex-1 overflow-y-auto space-y-6 py-8 px-6 animate-pulse select-none custom-scrollbar">
    <div className="h-6 bg-white/5 rounded-full w-3/4 mx-auto" />
    <div className="h-6 bg-white/5 rounded-full w-1/2 mx-auto" />
    <div className="h-6 bg-white/5 rounded-full w-5/6 mx-auto" />
    <div className="h-6 bg-white/5 rounded-full w-2/3 mx-auto" />
    <div className="h-6 bg-white/5 rounded-full w-3/4 mx-auto" />
    <div className="h-6 bg-white/5 rounded-full w-1/2 mx-auto" />
    <div className="h-6 bg-white/5 rounded-full w-4/5 mx-auto" />
  </div>
);

export const NowPlayingView: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    likedTracks,
    toggleLikeTrack,
    queue,
    history,
    removeFromQueue,
    clearQueue,
    playTrack,
    viewChannel,
    showNowPlaying,
    setShowNowPlaying,
    playbackMode,
    setPlaybackMode,
    nowPlayingTab,
    setNowPlayingTab,
    playedSeconds,
    setSeekTrigger,
    subscribedChannels,
    toggleSubscribeChannel,
    searchHistory,
    selectedMood,
    setShareTrack,
    isAutoplayEnabled,
    toggleAutoplay,
    autoplayQueue,
    addToQueue
  } = usePlayerStore();

  const [lyricsData, setLyricsData] = useState<{ lyrics: string; lines: { text: string; time: number }[]; isSynced?: boolean } | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  
  const [relatedTracks, setRelatedTracks] = useState<Track[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [artistDetails, setArtistDetails] = useState<any>(null);
  const [artistLoading, setArtistLoading] = useState(false);
  
  const activeLyricRef = useRef<HTMLParagraphElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  // Thumbs state for local display
  const [isDisliked, setIsDisliked] = useState(false);
  const isLiked = currentTrack ? likedTracks.some((t) => t.id === currentTrack.id) : false;

  const handleLikeClick = () => {
    if (currentTrack) {
      toggleLikeTrack(currentTrack);
      if (isDisliked) setIsDisliked(false);
    }
  };

  const handleDislikeClick = () => {
    setIsDisliked(!isDisliked);
    if (currentTrack && isLiked) toggleLikeTrack(currentTrack);
  };

  const lyricsCache = useRef(new Map<string, any>());
  const historyRef = useRef(history);
  const searchHistoryRef = useRef(searchHistory);
  const selectedMoodRef = useRef(selectedMood);

  useEffect(() => {
    historyRef.current = history;
    searchHistoryRef.current = searchHistory;
    selectedMoodRef.current = selectedMood;
  }, [history, searchHistory, selectedMood]);

  // 1. Fetch Synced Lyrics — instant transition, no flicker, cancel stale requests
  const lyricsAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!currentTrack) return;

    const cacheKey = `${currentTrack.id}_${currentTrack.title}_${currentTrack.channelTitle}_${currentTrack.youtubeId || ''}`;

    // Kill any in-flight stale request
    if (lyricsAbortRef.current) {
      lyricsAbortRef.current.abort();
    }

    // Immediately show cached lyrics (even null = no lyrics) — no loading flash
    if (lyricsCache.current.has(cacheKey)) {
      setLyricsData(lyricsCache.current.get(cacheKey));
      setLyricsLoading(false);
      setIsDisliked(false);
      return;
    }

    // Mark loading only if no cached data at all
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

    setIsDisliked(false);

    return () => controller.abort();
  }, [currentTrack?.id, currentTrack?.title, currentTrack?.channelTitle, currentTrack?.youtubeId]);

  // Pre-fetch lyrics for the next 2 tracks in queue for snappy transitions
  useEffect(() => {
    const tracksToPrefetch = queue.slice(0, 2);
    tracksToPrefetch.forEach(nextTrack => {
      if (!nextTrack) return;
      const cacheKey = `${nextTrack.id}_${nextTrack.title}_${nextTrack.channelTitle}_${nextTrack.youtubeId || ''}`;
      if (!lyricsCache.current.has(cacheKey)) {
        const queryVideoId = nextTrack.youtubeId || nextTrack.id;
        fetch(`/api/lyrics?title=${encodeURIComponent(nextTrack.title)}&artist=${encodeURIComponent(nextTrack.channelTitle)}&duration=${encodeURIComponent(nextTrack.duration || '3:00')}&videoId=${encodeURIComponent(queryVideoId)}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.lyrics) {
              lyricsCache.current.set(cacheKey, data);
            }
          })
          .catch(() => {});
      }
    });
  }, [currentTrack?.id]);

  // 2. Fetch Related Content & Artist Details
  useEffect(() => {
    if (!currentTrack) return;

    const fetchRelated = async () => {
      setRelatedLoading(true);
      try {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            history: historyRef.current.slice(0, 10),
            searchHistory: searchHistoryRef.current,
            mood: selectedMoodRef.current
          })
        });
        if (res.ok) {
          const data = await res.json();
          setRelatedTracks(data.items || []);
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      } finally {
        setRelatedLoading(false);
      }
    };

    const fetchArtistData = async () => {
      setArtistLoading(true);
      try {
        // Query by artist name to merge topic channels and official channels
        const res = await fetch(`/api/youtube/channel?name=${encodeURIComponent(currentTrack.channelTitle)}&isName=true`);
        if (res.ok) {
          const data = await res.json();
          setArtistDetails(data);
        }
      } catch (err) {
        console.error('Failed to load artist details:', err);
      } finally {
        setArtistLoading(false);
      }
    };

    if (nowPlayingTab === 'related') {
      fetchRelated();
      fetchArtistData();
    }
  }, [currentTrack?.id, nowPlayingTab]);

  // 3. Active Lyric Line — synced uses timestamp, unsynced uses scroll position
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
          low = low + 1;
        } else {
          high = mid - 1;
        }
      }
      return bestMatch;
    }
    return unsyncedActiveIndex;
  }, [lyricsData, playedSeconds, unsyncedActiveIndex]);

  useEffect(() => {
    if (lyricsData?.lines && !lyricsData.isSynced) {
      handleLyricScroll();
    }
  }, [lyricsData, handleLyricScroll]);

  // Auto-scroll active lyric into center on every line change
  useEffect(() => {
    if (activeLineIndex < 0 || !lyricsData?.lines) return;
    const container = lyricsContainerRef.current;
    const element = activeLyricRef.current;
    if (!container || !element) return;
    
    const elementOffsetTop = element.offsetTop;
    const elementHeight = element.clientHeight;
    const containerHeight = container.clientHeight;

    container.scrollTo({
      top: elementOffsetTop - containerHeight / 2 + elementHeight / 2,
      behavior: 'auto'
    });
  }, [activeLineIndex, lyricsData]);

  // Scroll-inactivity timer: re-center to current lyric after 15s of no manual scroll
  const lastScrollTimeRef = useRef(Date.now());
  const userScrollingRef = useRef(false);
  const handleUserScroll = useCallback(() => {
    userScrollingRef.current = true;
    lastScrollTimeRef.current = Date.now();
    handleLyricScroll();
  }, [handleLyricScroll]);

  useEffect(() => {
    if (!lyricsData?.lines) return;
    const interval = setInterval(() => {
      if (!userScrollingRef.current) return;
      if (Date.now() - lastScrollTimeRef.current >= 15000) {
        userScrollingRef.current = false;
        const container = lyricsContainerRef.current;
        const element = activeLyricRef.current;
        if (container && element) {
          const elementOffsetTop = element.offsetTop;
          const elementHeight = element.clientHeight;
          const containerHeight = container.clientHeight;
          container.scrollTo({
            top: elementOffsetTop - containerHeight / 2 + elementHeight / 2,
            behavior: 'auto'
          });
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lyricsData, activeLineIndex]);

  if (!currentTrack) return null;

  return (
    <div
      className={`absolute inset-0 bg-[#030303] z-30 transition-all duration-300 ease-in-out flex flex-col overflow-hidden select-none ${
        showNowPlaying ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      {/* Dynamic Blurred Ambient Background Art */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <img
          src={upgradeThumbnailUrl(currentTrack.thumbnailUrl)   || undefined}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = currentTrack.thumbnailUrl || '';
          }}
          className="absolute inset-0 w-full h-full object-cover blur-[120px] opacity-30 scale-125 transition-all duration-1000"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/90 to-[#030303]/85" />
      </div>

      {/* Header bar */}
      <header className="h-16 px-6 flex items-center justify-between z-10 flex-shrink-0 border-b border-white/5 bg-[#030303]/40 backdrop-blur-md">
        <div className="w-10"></div> {/* Spacer for flex balance */}

        {/* Video vs Song Toggle Pill */}
        <div className="flex bg-zinc-900/80 border border-white/5 p-1 rounded-full text-xs font-bold shadow-lg">
          <button
            onClick={() => setPlaybackMode('song')}
            className={`px-6 py-1.5 rounded-full transition-all duration-300 font-semibold tracking-wide ${
              playbackMode === 'song'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Song
          </button>
          <button
            onClick={() => setPlaybackMode('video')}
            className={`px-6 py-1.5 rounded-full transition-all duration-300 font-semibold tracking-wide ${
              playbackMode === 'video'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Video
          </button>
        </div>

        <div className="w-10"></div> {/* Spacer */}
      </header>

      {/* Main content grid */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-8 p-4 lg:p-8 overflow-hidden z-10">
        
        {/* Left Side: Interactive Canvas */}
        <div className={`flex-[7] flex flex-col items-center justify-center min-w-0 h-full relative ${
          nowPlayingTab === 'player' ? 'flex' : 'hidden lg:flex'
        }`}>
          
          {playbackMode === 'song' ? (
            /* Song Mode Cover Art Canvas */
            <div className="w-full flex flex-col items-center justify-center animate-fade-in relative">
              {/* Backglow Ambient Neon Effect */}
              <div className="absolute w-[280px] h-[280px] rounded-full bg-[#ff0000]/20 blur-[80px] pointer-events-none -translate-x-8 -translate-y-8 animate-pulse z-0" />
              <div className="absolute w-[280px] h-[280px] rounded-full bg-[#0055ff]/15 blur-[80px] pointer-events-none translate-x-8 translate-y-8 animate-pulse z-0" />

              <div className="relative w-[70vw] h-[70vw] sm:w-[50vw] sm:h-[50vw] lg:w-[380px] lg:h-[380px] aspect-square rounded-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] neon-border-glow overflow-hidden bg-zinc-900 border border-white/10 group z-10">
                <img
                  src={upgradeThumbnailUrl(currentTrack.thumbnailUrl)   || undefined}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = currentTrack.thumbnailUrl || '';
                  }}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover select-none transition-transform duration-500 scale-100 group-hover:scale-[1.02]"
                />
              </div>

              {/* Title, artist & likes info container */}
              <div className="w-[70vw] sm:w-[50vw] lg:w-[380px] mt-6 flex justify-between items-center bg-black/20 backdrop-blur-md p-4 rounded-xl border border-white/5">
                <div className="min-w-0 flex-1 mr-4">
                  {(() => {
                    const parsed = parseFeaturedArtists(currentTrack.title);
                    return (
                      <>
                        <h2 className="text-lg lg:text-xl font-extrabold text-white truncate leading-tight flex items-center gap-1">
                          {parsed.title}
                          {currentTrack.isExplicit && <ExplicitBadge />}
                        </h2>
                        {parsed.featured.length > 0 && (
                          <p className="text-[11px] text-zinc-500 font-medium leading-none mt-0.5 truncate">
                            feat.{' '}
                            {parsed.featured.map((featName, idx) => (
                              <React.Fragment key={featName}>
                                {idx > 0 && ', '}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    viewChannel(featName);
                                    setShowNowPlaying(false);
                                  }}
                                  className="hover:underline hover:text-white cursor-pointer"
                                >
                                  {featName}
                                </span>
                              </React.Fragment>
                            ))}
                          </p>
                        )}
                        <p className="text-xs lg:text-sm text-zinc-400 truncate mt-1.5 font-medium">
                          {(() => {
                            const artistNames = currentTrack.channelTitle
                              ? currentTrack.channelTitle.split(/,|\s+&\s+|\s+and\s+/i).map((n: string) => n.trim()).filter(Boolean)
                              : [];
                            if (artistNames.length === 0) return 'Unknown Artist';
                            return artistNames.map((name: string, idx: number) => {
                              const cleanName = cleanVisualName(name);
                              return (
                                <React.Fragment key={name}>
                                  {idx > 0 && <span className="text-zinc-500">, </span>}
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const artistId = idx === 0 ? currentTrack.channelId || currentTrack.artistId : undefined;
                                      viewChannel(cleanName, artistId);
                                      setShowNowPlaying(false);
                                    }}
                                    className="hover:underline hover:text-white cursor-pointer"
                                  >
                                    {cleanName}
                                  </span>
                                </React.Fragment>
                              );
                            });
                          })()}
                        </p>
                      </>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={handleDislikeClick}
                    className={`p-2 rounded-full hover:bg-white/5 transition-colors ${
                      isDisliked ? 'text-red-500' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Dislike"
                  >
                    <ThumbsDown className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleLikeClick}
                    className={`p-2 rounded-full hover:bg-white/5 transition-colors ${
                      isLiked ? 'text-red-500' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Like"
                  >
                    <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShareTrack(currentTrack)}
                    className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                    title="Share Song"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Video Mode Canvas (Portal Target) */
            <div className="w-full flex flex-col items-center justify-center animate-fade-in">
              <div className="w-full max-w-[620px] aspect-video bg-black border border-white/10 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden relative">
                {/* The react-player DOM elements will be injected here via portal */}
                <div id="now-playing-video-portal" className="w-full h-full relative z-10" />
                
                {/* Floating Loading Layer */}
                <div className="absolute inset-0 bg-[#070707] flex items-center justify-center z-0">
                  <Disc className="w-8 h-8 animate-spin text-[#ff0000]" />
                </div>
              </div>

              {/* Title & Artist info */}
              <div className="w-full max-w-[620px] mt-6 flex justify-between items-center bg-black/20 backdrop-blur-md p-4 rounded-xl border border-white/5">
                <div className="min-w-0 flex-1 mr-4">
                  {(() => {
                    const parsed = parseFeaturedArtists(currentTrack.title);
                    return (
                      <>
                        <h2 className="text-lg lg:text-xl font-extrabold text-white truncate leading-tight flex items-center gap-1">
                          {parsed.title}
                          {currentTrack.isExplicit && <ExplicitBadge />}
                        </h2>
                        {parsed.featured.length > 0 && (
                          <p className="text-[11px] text-zinc-500 font-medium leading-none mt-0.5 truncate">
                            feat.{' '}
                            {parsed.featured.map((featName, idx) => (
                              <React.Fragment key={featName}>
                                {idx > 0 && ', '}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    viewChannel(featName);
                                    setShowNowPlaying(false);
                                  }}
                                  className="hover:underline hover:text-white cursor-pointer"
                                >
                                  {featName}
                                </span>
                              </React.Fragment>
                            ))}
                          </p>
                        )}
                        <p className="text-xs lg:text-sm text-zinc-400 truncate mt-1.5 font-medium">
                          {(() => {
                            const artistNames = currentTrack.channelTitle
                              ? currentTrack.channelTitle.split(/,|\s+&\s+|\s+and\s+/i).map((n: string) => n.trim()).filter(Boolean)
                              : [];
                            if (artistNames.length === 0) return 'Unknown Artist';
                            return artistNames.map((name: string, idx: number) => {
                              const cleanName = cleanVisualName(name);
                              return (
                                <React.Fragment key={name}>
                                  {idx > 0 && <span className="text-zinc-500">, </span>}
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const artistId = idx === 0 ? currentTrack.channelId || currentTrack.artistId : undefined;
                                      viewChannel(cleanName, artistId);
                                      setShowNowPlaying(false);
                                    }}
                                    className="hover:underline hover:text-white cursor-pointer"
                                  >
                                    {cleanName}
                                  </span>
                                </React.Fragment>
                              );
                            });
                          })()}
                        </p>
                      </>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={handleDislikeClick}
                    className={`p-2 rounded-full hover:bg-white/5 transition-colors ${
                      isDisliked ? 'text-red-500' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Dislike"
                  >
                    <ThumbsDown className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleLikeClick}
                    className={`p-2 rounded-full hover:bg-white/5 transition-colors ${
                      isLiked ? 'text-red-500' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Like"
                  >
                    <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShareTrack(currentTrack)}
                    className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                    title="Share Song"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Glassmorphic Tabs Details Panel */}
        <div className={`flex-[5] flex flex-col bg-zinc-950/45 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl relative transition-all duration-300 ${
          nowPlayingTab !== 'player' ? 'flex-1 h-full' : 'h-14 lg:h-full lg:flex-[5] flex'
        }`}>
          
          {/* Tab Header Selector */}
          <div className="flex border-b border-white/5 bg-black/20 text-xs font-bold tracking-wider select-none flex-shrink-0">
            {(['player', 'upnext', 'lyrics', 'related'] as const).map((tab) => {
              if (tab === 'player') {
                return (
                  <button
                    key={tab}
                    onClick={() => setNowPlayingTab(tab)}
                    className={`lg:hidden flex-1 py-4 text-center border-b-2 hover:text-white transition-all duration-200 cursor-pointer ${
                      nowPlayingTab === tab ? 'border-[#ff0000] text-white' : 'border-transparent text-zinc-400'
                    }`}
                  >
                    PLAYER
                  </button>
                );
              }
              const label = tab === 'upnext' ? 'UP NEXT' : tab === 'lyrics' ? 'LYRICS' : 'RELATED';
              const active = nowPlayingTab === tab || (tab === 'upnext' && nowPlayingTab === 'player');
              return (
                <button
                  key={tab}
                  onClick={() => setNowPlayingTab(tab)}
                  className={`flex-1 py-4 text-center border-b-2 hover:text-white transition-all duration-200 cursor-pointer ${
                    active ? 'border-[#ff0000] text-white' : 'border-transparent text-zinc-400'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Tab contents */}
          <div className="flex-1 overflow-hidden relative">

            {/* TAB: UP NEXT */}
            {(nowPlayingTab === 'upnext' || nowPlayingTab === 'player') && (
              <div className="absolute inset-0 flex flex-col overflow-hidden p-4 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Playing from queue
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none group/toggle">
                      <input 
                        type="checkbox" 
                        checked={isAutoplayEnabled} 
                        onChange={toggleAutoplay} 
                        className="sr-only peer" 
                      />
                      <div className="w-7 h-4 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white relative"></div>
                      <span className="text-[10px] font-extrabold text-zinc-500 group-hover/toggle:text-zinc-300 transition-colors uppercase tracking-wider">Autoplay</span>
                    </label>
                  </div>
                  {queue.length > 0 && (
                    <button
                      onClick={clearQueue}
                      className="text-xs text-zinc-400 hover:text-red-500 hover:underline transition-colors flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear Queue
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                  
                  {/* Current playing highlight */}
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-lg flex items-center gap-3 relative overflow-hidden group shadow-md">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff0000]" />
                    <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden">
                      <img src={currentTrack.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                      {isPlaying && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="flex items-end gap-0.5 h-3">
                            <span className="w-0.5 bg-[#ff0000] rounded animate-wave-1 h-3"></span>
                            <span className="w-0.5 bg-[#ff0000]/80 rounded animate-wave-2 h-2"></span>
                            <span className="w-0.5 bg-[#ff0000]/50 rounded animate-wave-3 h-1.5"></span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {(() => {
                        const parsed = parseFeaturedArtists(currentTrack.title);
                        return (
                          <>
                            <p className="text-sm font-bold text-white truncate">{parsed.title}</p>
                            {parsed.featured.length > 0 && (
                              <p className="text-[10px] text-zinc-500 truncate font-medium mt-0.5">
                                feat.{' '}
                                {parsed.featured.map((featName, idx) => (
                                  <React.Fragment key={featName}>
                                    {idx > 0 && ', '}
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        viewChannel(featName);
                                        setShowNowPlaying(false);
                                      }}
                                      className="hover:underline hover:text-white cursor-pointer"
                                    >
                                      {featName}
                                    </span>
                                  </React.Fragment>
                                ))}
                              </p>
                            )}
                            <p className="text-xs text-zinc-400 truncate mt-0.5 font-medium">
                              {(() => {
                                const artistNames = currentTrack.channelTitle
                                  ? currentTrack.channelTitle.split(/,|\s+&\s+|\s+and\s+/i).map((n: string) => n.trim()).filter(Boolean)
                                  : [];
                                if (artistNames.length === 0) return 'Unknown Artist';
                                return artistNames.map((name: string, idx: number) => {
                                  const cleanName = cleanVisualName(name);
                                  return (
                                    <React.Fragment key={name}>
                                      {idx > 0 && <span className="text-zinc-500">, </span>}
                                      <span
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const artistId = idx === 0 ? currentTrack.channelId || currentTrack.artistId : undefined;
                                          viewChannel(cleanName, artistId);
                                          setShowNowPlaying(false);
                                        }}
                                        className="hover:underline hover:text-white cursor-pointer"
                                      >
                                        {cleanName}
                                      </span>
                                    </React.Fragment>
                                  );
                                });
                              })()}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 mr-1">{currentTrack.duration || '—'}</span>
                  </div>

                  {/* Next up divider */}
                  {queue.length > 0 && (
                    <div className="py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-center">
                      — UP NEXT —
                    </div>
                  )}

                  {/* Queue Items */}
                  {queue.map((track, idx) => (
                    <div
                      key={`np-queue-${track.id}-${idx}`}
                      className="group/item flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div
                        onClick={() => playTrack(track, queue.slice(idx))}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      >
                        <span className="text-xs font-bold text-zinc-500 w-4 text-center group-hover/item:text-white">
                          {idx + 1}
                        </span>
                        <img
                          src={track.thumbnailUrl   || undefined}
                          referrerPolicy="no-referrer"
                          alt=""
                          className="w-10 h-10 object-cover rounded bg-zinc-800 flex-shrink-0 border border-white/5"
                        />
                        <div className="min-w-0 flex-1">
                          {(() => {
                            const parsed = parseFeaturedArtists(track.title);
                            return (
                              <>
                                <p className="text-sm font-bold text-zinc-300 truncate group-hover/item:text-white">
                                  {parsed.title}
                                  {track.isExplicit && <ExplicitBadge />}
                                </p>
                                {parsed.featured.length > 0 && (
                                  <p className="text-[10px] text-zinc-500 truncate font-medium mt-0.5">
                                    feat.{' '}
                                    {parsed.featured.map((featName, idx) => (
                                      <React.Fragment key={featName}>
                                        {idx > 0 && ', '}
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            viewChannel(featName);
                                            setShowNowPlaying(false);
                                          }}
                                          className="hover:underline hover:text-white cursor-pointer"
                                        >
                                          {featName}
                                        </span>
                                      </React.Fragment>
                                    ))}
                                  </p>
                                )}
                                <p className="text-xs text-zinc-500 truncate mt-0.5 group-hover/item:text-zinc-400 font-medium">
                                  {(() => {
                                    const artistNames = track.channelTitle
                                      ? track.channelTitle.split(/,|\s+&\s+|\s+and\s+/i).map((n: string) => n.trim()).filter(Boolean)
                                      : [];
                                    if (artistNames.length === 0) return 'Unknown Artist';
                                    return artistNames.map((name: string, idx: number) => {
                                      const cleanName = cleanVisualName(name);
                                      return (
                                        <React.Fragment key={name}>
                                          {idx > 0 && <span className="text-zinc-500">, </span>}
                                          <span
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const artistId = idx === 0 ? track.channelId || track.artistId : undefined;
                                              viewChannel(cleanName, artistId);
                                              setShowNowPlaying(false);
                                            }}
                                            className="hover:underline hover:text-white cursor-pointer"
                                          >
                                            {cleanName}
                                          </span>
                                        </React.Fragment>
                                      );
                                    });
                                  })()}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-mono text-zinc-500">{track.duration || '—'}</span>
                        <button
                          onClick={() => removeFromQueue(track.id)}
                          className="opacity-0 group-hover/item:opacity-100 p-1 text-zinc-400 hover:text-white rounded-full hover:bg-[#242424] transition-all"
                          title="Remove"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Autoplay suggestions */}
                  {isAutoplayEnabled && autoplayQueue.length > 0 && (
                    <>
                      <div className="py-2 mt-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-center flex items-center justify-center gap-2">
                        <span className="h-[1px] bg-white/5 flex-1" />
                        <span>Autoplay suggestions</span>
                        <span className="h-[1px] bg-white/5 flex-1" />
                      </div>
                      
                      {autoplayQueue.map((track, idx) => (
                        <div
                          key={`np-autoplay-${track.id}-${idx}`}
                          className="group/item flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div
                            onClick={() => playTrack(track)}
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                          >
                            <span className="text-xs font-bold text-zinc-500 w-4 text-center group-hover/item:text-white">
                              💡
                            </span>
                            <img
                              src={track.thumbnailUrl || undefined}
                              referrerPolicy="no-referrer"
                              alt=""
                              className="w-10 h-10 object-cover rounded bg-zinc-800 flex-shrink-0 border border-white/5"
                            />
                            <div className="min-w-0 flex-1">
                              {(() => {
                                const parsed = parseFeaturedArtists(track.title);
                                return (
                                  <>
                                    <p className="text-sm font-bold text-zinc-300 truncate group-hover/item:text-white">
                                      {parsed.title}
                                      {track.isExplicit && <ExplicitBadge />}
                                    </p>
                                    {parsed.featured.length > 0 && (
                                      <p className="text-[10px] text-zinc-500 truncate font-medium mt-0.5">
                                        feat.{' '}
                                        {parsed.featured.map((featName, idx) => (
                                          <React.Fragment key={featName}>
                                            {idx > 0 && ', '}
                                            <span
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                viewChannel(featName);
                                                setShowNowPlaying(false);
                                              }}
                                              className="hover:underline hover:text-white cursor-pointer"
                                            >
                                              {featName}
                                            </span>
                                          </React.Fragment>
                                        ))}
                                      </p>
                                    )}
                                    <p className="text-xs text-zinc-500 truncate mt-0.5 group-hover/item:text-zinc-400 font-medium">
                                      {(() => {
                                        const artistNames = track.channelTitle
                                          ? track.channelTitle.split(/,|\s+&\s+|\s+and\s+/i).map((n: string) => n.trim()).filter(Boolean)
                                          : [];
                                        if (artistNames.length === 0) return 'Unknown Artist';
                                        return artistNames.map((name: string, idx: number) => {
                                          const cleanName = cleanVisualName(name);
                                          return (
                                            <React.Fragment key={name}>
                                              {idx > 0 && <span className="text-zinc-500">, </span>}
                                              <span
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const artistId = idx === 0 ? track.channelId || track.artistId : undefined;
                                                  viewChannel(cleanName, artistId);
                                                  setShowNowPlaying(false);
                                                }}
                                                className="hover:underline hover:text-white cursor-pointer"
                                              >
                                                {cleanName}
                                              </span>
                                            </React.Fragment>
                                          );
                                        });
                                      })()}
                                    </p>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-mono text-zinc-500">{track.duration || '—'}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                usePlayerStore.getState().playNext(track);
                              }}
                              className="opacity-0 group-hover/item:opacity-100 text-[9px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10"
                            >
                              + Next
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToQueue(track);
                              }}
                              className="opacity-0 group-hover/item:opacity-100 text-[9px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10"
                            >
                              + Queue
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Recently played divider */}
                  {history.length > 1 && (
                    <div className="py-2 mt-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-center">
                      — RECENTLY PLAYED —
                    </div>
                  )}

                  {/* History items */}
                  {history
                    .filter((t) => t.id !== currentTrack.id)
                    .slice(0, 8)
                    .map((track) => (
                      <div
                        key={`np-history-${track.id}`}
                        onClick={() => playTrack(track)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <img
                          src={track.thumbnailUrl   || undefined}
                          referrerPolicy="no-referrer"
                          alt=""
                          className="w-10 h-10 object-cover rounded bg-zinc-800 flex-shrink-0 border border-white/5 opacity-60 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="min-w-0 flex-1">
                          {(() => {
                            const parsed = parseFeaturedArtists(track.title);
                            return (
                              <>
                                <p className="text-sm font-bold text-zinc-400 truncate group-hover:text-white">
                                  {parsed.title}
                                </p>
                                {parsed.featured.length > 0 && (
                                  <p className="text-[10px] text-zinc-500 truncate font-medium mt-0.5">
                                    feat.{' '}
                                    {parsed.featured.map((featName, idx) => (
                                      <React.Fragment key={featName}>
                                        {idx > 0 && ', '}
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            viewChannel(featName);
                                            setShowNowPlaying(false);
                                          }}
                                          className="hover:underline hover:text-white cursor-pointer"
                                        >
                                          {featName}
                                        </span>
                                      </React.Fragment>
                                    ))}
                                  </p>
                                )}
                                <p className="text-xs text-zinc-500 truncate mt-0.5">
                                  {cleanVisualName(track.channelTitle)}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                        <span className="text-xs font-mono text-zinc-600 group-hover:text-zinc-500">{track.duration || '—'}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB: LYRICS */}
            {nowPlayingTab === 'lyrics' && (
              <div className="absolute inset-0 flex flex-col overflow-hidden">
                <div className="flex-1 p-6 relative">
                  {lyricsLoading ? (
                    <LyricSkeleton />
                  ) : lyricsData ? (
                    <div
                      ref={lyricsContainerRef}
                      onScroll={handleUserScroll}
                      className="h-full overflow-y-auto space-y-5 custom-scrollbar pr-2 text-center select-text py-[20vh]"
                    >
                      {lyricsData.lines.map((line, idx) => {
                        const isActive = idx === activeLineIndex;
                        const isClickable = lyricsData.isSynced && line.time !== -999;
                        return (
                          <p
                            key={`lyric-line-${idx}`}
                            data-lyric-line
                            ref={isActive ? activeLyricRef : null}
                            onClick={() => {
                              if (isClickable) {
                                setSeekTrigger(line.time);
                              }
                            }}
                            className={`px-4 transition-all duration-300 leading-relaxed font-semibold ${
                              isClickable 
                                ? 'cursor-pointer hover:text-white hover:scale-[1.02] active:scale-95' 
                                : 'cursor-default'
                            } ${
                              isActive
                                ? 'text-white text-lg lg:text-xl font-extrabold opacity-100 scale-[1.04] blur-none'
                                : 'text-zinc-500 text-sm lg:text-base opacity-40 blur-[0.4px] hover:opacity-75 hover:blur-none'
                            } ${line.text.startsWith('[') ? 'text-zinc-400/80 italic font-medium tracking-wide border-t border-white/5 pt-2 mt-4' : ''}`}
                          >
                            {line.text}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    <LyricSkeleton />
                  )}
                </div>
              </div>
            )}

            {/* TAB: RELATED */}
            {nowPlayingTab === 'related' && (
              <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-6 animate-fade-in space-y-8">
                
                {/* 1. Artist Details Profile Card */}
                {artistLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Disc className="w-6 h-6 animate-spin text-[#ff0000]" />
                  </div>
                ) : artistDetails?.profile ? (
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-4 shadow-lg">
                    <div className="flex items-center gap-4">
                      <img
                        src={artistDetails.profile.avatarUrl || undefined}
                        referrerPolicy="no-referrer"
                        alt=""
                        className="w-14 h-14 rounded-full object-cover border border-white/10"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-white truncate">
                          {cleanVisualName(artistDetails.profile.title)}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {(() => {
                            const count = Number(artistDetails.profile.subscriberCount || 0);
                            const adjusted = subscribedChannels.includes(artistDetails.profile.id) ? count + 1 : count;
                            if (adjusted >= 1000000) return `${(adjusted / 1000000).toFixed(adjusted >= 10000000 ? 0 : 1)}M subscribers`;
                            if (adjusted >= 1000) return `${(adjusted / 1000).toFixed(0)}K subscribers`;
                            return `${adjusted.toLocaleString()} subscribers`;
                          })()}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleSubscribeChannel(artistDetails.profile.id)}
                        className={`text-xs font-extrabold px-4 py-2 rounded-full border transition-all ${
                          subscribedChannels.includes(artistDetails.profile.id)
                            ? 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700'
                            : 'bg-white text-black border-white hover:scale-105 active:scale-95'
                        }`}
                      >
                        {subscribedChannels.includes(artistDetails.profile.id) ? 'Subscribed' : 'Subscribe'}
                      </button>
                    </div>

                    {artistDetails.profile.description && (
                      <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                        {artistDetails.profile.description}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          viewChannel(currentTrack.channelTitle, currentTrack.channelId);
                          setShowNowPlaying(false);
                        }}
                        className="flex-1 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer border border-white/5"
                      >
                        View Channel <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 p-4 rounded-xl text-center text-xs text-zinc-500">
                    Artist details not found.
                  </div>
                )}

                {/* 2. Top Songs by this Artist */}
                {artistDetails?.topSongs?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      More from {cleanVisualName(currentTrack.channelTitle)}
                    </h4>
                    <div className="space-y-2">
                      {artistDetails.topSongs.slice(0, 5).map((track: Track) => {
                        const isPlayingThis = currentTrack.id === track.id;
                        return (
                          <div
                            key={`related-art-song-${track.id}`}
                            onClick={() => playTrack(track, artistDetails.topSongs)}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                          >
                            <img
                              src={track.thumbnailUrl   || undefined}
                              referrerPolicy="no-referrer"
                              alt=""
                              className="w-10 h-10 object-cover rounded bg-zinc-900 border border-white/5 flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-bold truncate ${isPlayingThis ? 'text-[#ff0000]' : 'text-white'}`}>
                                {track.title}
                              </p>
                              <p className="text-xs text-zinc-400 mt-0.5 truncate">{track.views ? track.views.replace(' views', ' plays') : 'Track'}</p>
                            </div>
                            <span className="text-xs font-mono text-zinc-500">{track.duration || '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Recommended / Similar Tracks */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Recommended Tracks
                  </h4>
                  {relatedLoading ? (
                    <div className="flex justify-center py-4">
                      <Disc className="w-5 h-5 animate-spin text-[#ff0000]" />
                    </div>
                  ) : relatedTracks.length > 0 ? (
                    <div className="space-y-2">
                      {relatedTracks.slice(0, 10).map((track) => {
                        const isPlayingThis = currentTrack.id === track.id;
                        return (
                          <div
                            key={`related-rec-song-${track.id}`}
                            onClick={() => playTrack(track, relatedTracks)}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                          >
                            <img
                              src={track.thumbnailUrl   || undefined}
                              referrerPolicy="no-referrer"
                              alt=""
                              className="w-10 h-10 object-cover rounded bg-zinc-900 border border-white/5 flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-bold truncate ${isPlayingThis ? 'text-[#ff0000]' : 'text-white'}`}>
                                {track.title}
                                {track.isExplicit && <ExplicitBadge />}
                              </p>
                              <p className="text-xs text-zinc-400 truncate mt-0.5">{cleanVisualName(track.channelTitle)}</p>
                            </div>
                            <span className="text-xs font-mono text-zinc-500">{track.duration || '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500">No recommended tracks found.</div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

