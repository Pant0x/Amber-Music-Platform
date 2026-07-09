'use client';

import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useRouter, usePathname } from 'next/navigation';
import { cleanVisualName, parseFeaturedArtists, splitArtistNames } from '@/utils/text';
import { recordListen } from '@/lib/recordListen';
import { ExplicitBadge } from './pages/shared';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Volume1,
  ThumbsUp,
  ThumbsDown,
  ListMusic,
  Shuffle,
  Repeat,
  Maximize2,
  Minimize2,
  Repeat1,
  Mic2
} from 'lucide-react';

const ReactPlayer = dynamic(() => import('react-player/youtube'), { ssr: false }) as any;

export const MediaDeck: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    nextTrack,
    prevTrack,
    togglePlay,
    setVolume,
    setPlaying,
    likedTracks,
    toggleLikeTrack,
    showQueuePanel,
    toggleQueuePanel,
    _hasHydrated,
    viewChannel,
    showNowPlaying,
    setShowNowPlaying,
    playbackMode,
    nowPlayingTab,
    setNowPlayingTab,
    navigateBack,
    navigateForward,
    repeatMode,
    setRepeatMode,
    queue
  } = usePlayerStore();

  const setStoreDuration = usePlayerStore((s) => s.setDuration);
  const setStorePlayedSeconds = usePlayerStore((s) => s.setPlayedSeconds);
  const setYoutubeIdForCurrentTrack = usePlayerStore((s) => s.setYoutubeIdForCurrentTrack);
  const enrichCurrentTrack = usePlayerStore((s) => s.enrichCurrentTrack);
  const activeTab = usePlayerStore((s) => s.activeTab);
  const currentPlaylistId = usePlayerStore((s) => s.currentPlaylistId);
  const currentChannelId = usePlayerStore((s) => s.currentChannelId);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let targetPath = '';
    if (activeTab === 'home') targetPath = '/';
    else if (activeTab === 'explore') targetPath = '/explore';
    else if (activeTab === 'library') targetPath = '/library';
    else if (activeTab === 'liked') targetPath = '/liked';
    else if (activeTab === 'search') targetPath = '/search';
    else if (activeTab === 'playlist' && currentPlaylistId) targetPath = `/playlist/${currentPlaylistId}`;
    else if (activeTab === 'channel' && currentChannelId) targetPath = `/artist/${currentChannelId}`;
    
    // Only route if targetPath differs from current browser path
    if (targetPath && window.location.pathname !== targetPath) {
      router.push(targetPath);
    }
  }, [activeTab, currentPlaylistId, currentChannelId, router]);

  const playerRef = useRef<any>(null);
  const [progress, setProgress] = useState({ played: 0, playedSeconds: 0, loaded: 0 });
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [videoRect, setVideoRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isReadyRef = useRef(false);

  // Reset ready state when track changes
  useEffect(() => {
    isReadyRef.current = false;
  }, [currentTrack?.id]);

  const seekTrigger = usePlayerStore((s) => s.seekTrigger);
  const setSeekTrigger = usePlayerStore((s) => s.setSeekTrigger);
  const isMinimized = usePlayerStore((s) => s.isMinimized);
  const setIsMinimized = usePlayerStore((s) => s.setIsMinimized);

  useEffect(() => {
    if (seekTrigger !== null && playerRef.current && isReadyRef.current) {
      playerRef.current.seekTo(seekTrigger);
      setProgress((prev) => ({ 
        ...prev, 
        played: duration > 0 ? seekTrigger / duration : 0, 
        playedSeconds: seekTrigger 
      }));
      setStorePlayedSeconds(seekTrigger);
      setSeekTrigger(null);
    }
  }, [seekTrigger, duration, setSeekTrigger, setStorePlayedSeconds]);

  // Keyboard and Mouse Navigation Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.hasAttribute('contenteditable'))
      ) {
        return;
      }

      switch (e.key) {
        case ' ': // Spacebar
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setIsMuted(!isMuted);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (playerRef.current && duration > 0) {
            const current = progress.playedSeconds;
            const target = Math.min(current + 5, duration);
            playerRef.current.seekTo(target);
          }
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          if (playerRef.current && duration > 0) {
            const current = progress.playedSeconds;
            const target = Math.min(current + 10, duration);
            playerRef.current.seekTo(target);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (playerRef.current && duration > 0) {
            const current = progress.playedSeconds;
            const target = Math.max(current - 5, 0);
            playerRef.current.seekTo(target);
          }
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          if (playerRef.current && duration > 0) {
            const current = progress.playedSeconds;
            const target = Math.max(current - 10, 0);
            playerRef.current.seekTo(target);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(volume + 0.05, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(volume - 0.05, 0));
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          nextTrack();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          prevTrack();
          break;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Mouse back/forward button clicks
      if (e.button === 3) {
        e.preventDefault();
        navigateBack();
      } else if (e.button === 4) {
        e.preventDefault();
        navigateForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [togglePlay, isMuted, volume, setVolume, progress.playedSeconds, duration, nextTrack, prevTrack, navigateBack, navigateForward]);

  // Autoplay Unlocking: Browser security requires user interaction (click/tap) before playing audio
  useEffect(() => {
    const unlockAutoplay = () => {
      if (isPlaying && playerRef.current && isReadyRef.current) {
        const internal = playerRef.current.getInternalPlayer();
        if (internal) {
          if (typeof internal.playVideo === 'function') {
            internal.playVideo();
          } else if (typeof internal.play === 'function') {
            internal.play().catch((e: any) => console.warn(e));
          }
        }
      }
      document.removeEventListener('click', unlockAutoplay);
      document.removeEventListener('touchstart', unlockAutoplay);
    };

    if (isPlaying) {
      document.addEventListener('click', unlockAutoplay);
      document.addEventListener('touchstart', unlockAutoplay);
    }

    return () => {
      document.removeEventListener('click', unlockAutoplay);
      document.removeEventListener('touchstart', unlockAutoplay);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (showNowPlaying && playbackMode === 'video') {
      const updateRect = () => {
        const el = document.getElementById('now-playing-video-portal');
        if (el) {
          const rect = el.getBoundingClientRect();
          setVideoRect({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          });
        }
      };

      updateRect();
      window.addEventListener('resize', updateRect);
      // Run multiple delayed sweeps to capture slide up transition frames
      const timers = [50, 100, 200, 300, 500, 800].map(t => setTimeout(updateRect, t));

      return () => {
        window.removeEventListener('resize', updateRect);
        timers.forEach(clearTimeout);
      };
    } else {
      setVideoRect(null);
    }
  }, [showNowPlaying, playbackMode]);

  // Background periodic listen writer (best-effort)
  useEffect(() => {
    let interval: number | undefined;
    if (isPlaying && currentTrack) {
      // Write immediate initial log for instant catalog mapping!
      recordListen({ 
        track_id: currentTrack.id, 
        youtube_id: currentTrack.youtubeId || null, 
        played_seconds: 0, 
        duration_seconds: Math.floor(duration) || 180, 
        metadata: { 
          ...currentTrack, 
          partial: true 
        } 
      });

      interval = window.setInterval(() => {
        recordListen({ 
          track_id: currentTrack.id, 
          youtube_id: currentTrack.youtubeId || null, 
          played_seconds: Math.floor(progressRef.current.playedSeconds), 
          duration_seconds: Math.floor(duration), 
          metadata: { 
            ...currentTrack, 
            partial: true 
          } 
        });
      }, 30000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isPlaying, currentTrack?.id, duration]);

  useEffect(() => {
    if (!currentTrack) return;
    
    const needsResolve = currentTrack.origin === 'spotify' && !currentTrack.youtubeId;
    
    if (needsResolve) {
      console.log(`[MediaDeck] Resolving stream (${playbackMode}) for: "${currentTrack.title}" by "${currentTrack.channelTitle}"`);
      
      const resolveTrack = async () => {
        try {
          const explicitParam = currentTrack.isExplicit ? '&explicit=true' : '';
          const res = await fetch(
            `/api/youtube/resolve?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.channelTitle)}&mode=${playbackMode}${explicitParam}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.videoId) {
              console.log(`[MediaDeck] Successfully resolved to videoId: ${data.videoId}`);
              setYoutubeIdForCurrentTrack(data.videoId);
            } else {
              console.error('[MediaDeck] Failed to resolve: no videoId returned');
              if (currentTrack.origin === 'youtube') {
                setYoutubeIdForCurrentTrack(currentTrack.id);
              }
            }
          } else {
            console.error('[MediaDeck] Failed to resolve: HTTP error', res.status);
            if (currentTrack.origin === 'youtube') {
              setYoutubeIdForCurrentTrack(currentTrack.id);
            }
          }
        } catch (err) {
          console.error('[MediaDeck] Error resolving track:', err);
          if (currentTrack.origin === 'youtube') {
            setYoutubeIdForCurrentTrack(currentTrack.id);
          }
        }
      };

      resolveTrack();
    }
  }, [currentTrack?.id, currentTrack?.youtubeId, setYoutubeIdForCurrentTrack, playbackMode]);

  // Pre-resolve next track in queue for instant playback on transition
  useEffect(() => {
    if (queue.length === 0) return;
    const nextTrack = queue[0];
    if (nextTrack.origin === 'spotify' && !nextTrack.youtubeId) {
      console.log(`[MediaDeck] Pre-resolving next track in queue: "${nextTrack.title}"`);
      const resolveNext = async () => {
        try {
          const explicitParam = nextTrack.isExplicit ? '&explicit=true' : '';
          const res = await fetch(
            `/api/youtube/resolve?title=${encodeURIComponent(nextTrack.title)}&artist=${encodeURIComponent(nextTrack.channelTitle)}&mode=${playbackMode}${explicitParam}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.videoId) {
              console.log(`[MediaDeck] Successfully pre-resolved next track to: ${data.videoId}`);
              usePlayerStore.setState((state) => {
                const newQueue = state.queue.map((t, idx) => idx === 0 ? { ...t, youtubeId: data.videoId } : t);
                return { queue: newQueue };
              });
            }
          }
        } catch (e) {
          console.error('[MediaDeck] Failed to pre-resolve next track:', e);
        }
      };
      resolveNext();
    }
  }, [queue[0]?.id, queue[0]?.youtubeId]);

  // Background Spotify metadata enrichment for YouTube tracks
  useEffect(() => {
    if (!currentTrack || currentTrack.isEnriched) return;
    
    if (currentTrack.origin === 'youtube') {
      const enrichTrack = async () => {
        try {
          const res = await fetch(
            `/api/spotify/resolve?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.channelTitle)}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.enriched) {
              console.log(`[MediaDeck] Successfully enriched YouTube track with Spotify metadata: "${data.title}" by "${data.channelTitle}"`);
              enrichCurrentTrack({
                title: data.title,
                channelTitle: data.channelTitle,
                isExplicit: data.isExplicit
              });
            }
          }
        } catch (err) {
          console.error('[MediaDeck] Error enriching YouTube track with Spotify metadata:', err);
        }
      };

      enrichTrack();
    }
  }, [currentTrack?.id, currentTrack?.isEnriched, enrichCurrentTrack]);

  if (!mounted || !_hasHydrated) return null;

  if (!currentTrack) {
    return (
      <footer className="h-20 bg-[#070707] border-t border-white/5 flex items-center justify-center text-xs font-semibold tracking-wider text-zinc-500 select-none flex-shrink-0">
        Nothing playing. Select a song from Home or search above.
      </footer>
    );
  }

  const isLiked = likedTracks.some((t) => t.id === currentTrack.id);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === null) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fraction = parseFloat(e.target.value);
    playerRef.current?.seekTo(fraction);
    setProgress((prev) => ({ ...prev, played: fraction, playedSeconds: fraction * duration }));
    setStorePlayedSeconds(fraction * duration);
  };

  const handlePlayerProgress = (state: { played: number; playedSeconds: number; loaded: number }) => {
    setProgress(state);
    setStorePlayedSeconds(state.playedSeconds);
  };

  const handlePlayerEnded = () => {
    if (repeatMode === 'one') {
      playerRef.current?.seekTo(0);
      setProgress((prev) => ({ ...prev, played: 0, playedSeconds: 0 }));
      setStorePlayedSeconds(0);
      setPlaying(true);
    } else {
      // Finalize listen on end (best-effort)
      if (currentTrack) {
        recordListen({ 
          track_id: currentTrack.id, 
          youtube_id: currentTrack.youtubeId || null, 
          played_seconds: Math.floor(duration), 
          duration_seconds: Math.floor(duration), 
          metadata: { 
            ...currentTrack 
          } 
        });
      }
      nextTrack();
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const handleLikeClick = () => {
    toggleLikeTrack(currentTrack);
    if (isDisliked) setIsDisliked(false);
  };

  const handleDislikeClick = () => {
    setIsDisliked(!isDisliked);
    if (isLiked) toggleLikeTrack(currentTrack);
  };

  const handleDeckClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't expand if click was on volume sliders, skip/like/play buttons, or queue panels
    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('a') || 
      (target.tagName.toLowerCase() === 'span' && target.classList.contains('cursor-pointer'))
    ) {
      return;
    }
    setShowNowPlaying(!showNowPlaying);
  };

  return (
    <footer 
      onClick={handleDeckClick}
      className={`h-20 bg-[#070707] px-6 flex items-center justify-between select-none relative z-40 flex-shrink-0 border-t border-white/5 yt-deck-slider-group cursor-pointer hover:bg-[#0f0f0f] transition-colors ${isMinimized ? 'media-deck--minimized' : ''}`}
    >
      
      {/* Persistent ReactPlayer Engine */}
      <div 
        className="fixed z-50 rounded-2xl overflow-hidden pointer-events-none"
        style={videoRect ? {
          left: `${videoRect.left}px`,
          top: `${videoRect.top}px`,
          width: `${videoRect.width}px`,
          height: `${videoRect.height}px`,
          opacity: 1,
          pointerEvents: 'auto'
        } : {
          left: '-9999px',
          top: '-9999px',
          width: '200px',
          height: '200px',
          opacity: 0.01,
          pointerEvents: 'none'
        }}
      >
        <ReactPlayer
          ref={playerRef}
          url={currentTrack.youtubeId ? `https://www.youtube.com/watch?v=${currentTrack.youtubeId}` : currentTrack.origin === 'spotify' ? '' : `https://www.youtube.com/watch?v=${currentTrack.id}`}
          playing={isPlaying && (currentTrack.origin !== 'spotify' || !!currentTrack.youtubeId)}
          volume={volume}
          muted={isMuted}
          onProgress={handlePlayerProgress}
          onDuration={(d: number) => {
            setDuration(d);
            setStoreDuration(d);
          }}
          onEnded={handlePlayerEnded}
          onReady={() => {
            isReadyRef.current = true;
            const trigger = usePlayerStore.getState().seekTrigger;
            if (trigger !== null && playerRef.current) {
              console.log(`[MediaDeck] Deferred initial seek to: ${trigger}s`);
              playerRef.current.seekTo(trigger);
              setProgress((prev) => ({
                ...prev,
                playedSeconds: trigger
              }));
              setStorePlayedSeconds(trigger);
              setSeekTrigger(null);
            }

            // Attempt programmatical play to handle allowed browser autoplay scenarios
            if (isPlaying && playerRef.current) {
              const internal = playerRef.current.getInternalPlayer();
              if (internal) {
                if (typeof internal.playVideo === 'function') {
                  internal.playVideo();
                } else if (typeof internal.play === 'function') {
                  internal.play().catch((e: any) => console.warn('[Autoplay Blocked]', e));
                }
              }
            }
          }}
          width="100%"
          height="100%"
          controls={false}
          config={{
            youtube: {
              playerVars: {
                autoplay: 1,
                controls: 0,
                modestbranding: 1,
                rel: 0
              }
            }
          }}
        />
      </div>

      {/* A. SIGNATURE YT MUSIC EDGE-TO-EDGE TIMELINE SLIDER */}
      <div className="absolute top-0 inset-x-0 h-1 bg-transparent pointer-events-auto">
        <input
          type="range"
          min="0"
          max="0.999"
          step="any"
          value={progress.played}
          onChange={handleScrub}
          className="yt-deck-slider"
        />
        {/* Active Progress Overlay line */}
        <div
          className="absolute top-0 left-0 h-[2px] group-hover:h-[4px] bg-[#ff0000] pointer-events-none transition-colors"
          style={{ width: `${progress.played * 100}%` }}
        ></div>
      </div>

      {/* 1. LEFT SIDE: Track details & Like/Dislike thumbs */}
      <div className="flex items-center gap-4 w-1/3 min-w-0 left-section">
        <div 
          onClick={() => setShowNowPlaying(true)}
          className="flex items-center gap-3 min-w-0 cursor-pointer group/card"
        >
          <img
            src={currentTrack.thumbnailUrl   || undefined}
            referrerPolicy="no-referrer"
            alt=""
            className="w-11 h-11 object-cover rounded bg-[#1f1f1f] flex-shrink-0 group-hover/card:scale-105 transition-transform duration-200"
          />
          <div className="min-w-0 flex flex-col">
            {(() => {
              const parsed = parseFeaturedArtists(currentTrack.title);
              return (
                <>
                  <h4 className="text-sm font-bold text-white truncate max-w-[150px] group-hover/card:text-zinc-200 transition-colors flex items-center gap-1">
                    {parsed.title}
                  </h4>
                  {parsed.featured.length > 0 && (
                    <p className="text-[10px] text-zinc-500 truncate max-w-[150px] font-medium leading-none mb-0.5">
                      feat.{' '}
                      {parsed.featured.map((featName, idx) => (
                        <React.Fragment key={featName}>
                          {idx > 0 && ', '}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              viewChannel(featName);
                            }}
                            className="hover:underline hover:text-white cursor-pointer"
                          >
                            {featName}
                          </span>
                        </React.Fragment>
                      ))}
                    </p>
                  )}
                </>
              );
            })()}
            <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
              {(() => {
                const artistNames = currentTrack.channelTitle
                  ? splitArtistNames(currentTrack.channelTitle)
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
          </div>
        </div>

        {/* Thumbs Likes */}
        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
          <button
            onClick={handleDislikeClick}
            className={`p-1.5 rounded-full hover:bg-white/5 transition-colors ${
              isDisliked ? 'text-[#ff0000]' : 'text-zinc-400 hover:text-white'
            }`}
            title="Dislike"
          >
            <ThumbsDown className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={handleLikeClick}
            className={`p-1.5 rounded-full hover:bg-white/5 transition-colors ${
              isLiked ? 'text-[#ff0000]' : 'text-zinc-400 hover:text-white'
            }`}
            title="Like"
          >
            <ThumbsUp className={`w-4.5 h-4.5 ${isLiked ? 'fill-[#ff0000]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. CENTER SIDE: Controls (Shuffle, Prev, Play Circle, Next, Repeat) */}
      <div className="flex flex-col items-center w-1/3 center-section hide-on-minimize">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`transition-colors ${isShuffle ? 'text-[#ff0000]' : 'text-zinc-400 hover:text-white'}`}
            title="Shuffle"
          >
            <Shuffle className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={prevTrack}
            className="text-zinc-400 hover:text-white transition-colors"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current text-black" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5 text-black" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="text-zinc-400 hover:text-white transition-colors"
            title="Next"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              const nextMode = repeatMode === 'none' ? 'all' : repeatMode === 'all' ? 'one' : 'none';
              setRepeatMode(nextMode);
            }}
            className={`transition-colors p-1 ${repeatMode !== 'none' ? 'text-[#ff0000]' : 'text-zinc-400 hover:text-white'}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Small time label */}
        <div className="text-[10px] text-zinc-400 font-medium mt-1 font-mono">
          <span>{formatTime(progress.playedSeconds)}</span>
          <span className="mx-1">/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* 3. RIGHT SIDE: Utilities & Volume */}
      <div className="flex items-center justify-end gap-5 w-1/3 text-zinc-400 right-section hide-on-minimize">
        <button 
          onClick={() => {
            const nextShow = !showNowPlaying || nowPlayingTab !== 'lyrics';
            setShowNowPlaying(nextShow);
            if (nextShow) {
              setNowPlayingTab('lyrics');
            }
          }}
          className={`transition-colors p-1 ${showNowPlaying && nowPlayingTab === 'lyrics' ? 'text-[#ff0000] hover:text-[#ff3333]' : 'hover:text-white'}`}
          title="Lyrics"
        >
          <Mic2 className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={toggleQueuePanel}
          className={`transition-colors p-1 ${showQueuePanel ? 'text-[#ff0000] hover:text-[#ff3333]' : 'hover:text-white'}`}
          title="Queue"
        >
          <ListMusic className="w-5 h-5" />
        </button>

        {/* Volume group */}
        <div className="flex items-center gap-2 w-28 group yt-volume-group">
          <button
            onClick={toggleMute}
            className="hover:text-white transition-colors p-1"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4.5 h-4.5" />
            ) : volume < 0.4 ? (
              <Volume1 className="w-4.5 h-4.5" />
            ) : (
              <Volume2 className="w-4.5 h-4.5" />
            )}
          </button>
          
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="any"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="yt-volume-slider z-10"
            />
            {/* Active overlay */}
            <div
              className="absolute inset-y-0 left-0 h-[3px] bg-white group-hover:bg-[#ff0000] rounded-full pointer-events-none"
              style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
            ></div>
          </div>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowNowPlaying(!showNowPlaying);
          }} 
          className={`hover:text-white transition-colors p-1 ${showNowPlaying ? 'text-[#ff0000]' : ''}`} 
          title={showNowPlaying ? "Minimize player" : "Expand player"}
        >
          {showNowPlaying ? (
            <Minimize2 className="w-4.5 h-4.5" />
          ) : (
            <Maximize2 className="w-4.5 h-4.5" />
          )}
        </button>
      </div>

    </footer>
  );
};

