'use client';

import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { usePlayerStore } from '@/store/usePlayerStore';
import { cleanVisualName, parseFeaturedArtists } from '@/utils/text';
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
  Mic2
} from 'lucide-react';

const ReactPlayer = dynamic(() => import('react-player/youtube'), { ssr: false }) as any;

const ExplicitBadge = () => (
  <span className="inline-flex items-center justify-center bg-zinc-600/80 text-white text-[9px] font-bold px-1 py-0.5 rounded-sm mx-1.5 leading-none h-[14px]">
    E
  </span>
);

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
    navigateForward
  } = usePlayerStore();

  const setStoreDuration = usePlayerStore((s) => s.setDuration);
  const setStorePlayedSeconds = usePlayerStore((s) => s.setPlayedSeconds);
  const setYoutubeIdForCurrentTrack = usePlayerStore((s) => s.setYoutubeIdForCurrentTrack);

  const playerRef = useRef<any>(null);
  const [progress, setProgress] = useState({ played: 0, playedSeconds: 0, loaded: 0 });
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const seekTrigger = usePlayerStore((s) => s.seekTrigger);
  const setSeekTrigger = usePlayerStore((s) => s.setSeekTrigger);

  useEffect(() => {
    if (seekTrigger !== null && playerRef.current) {
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

  useEffect(() => {
    if (showNowPlaying && playbackMode === 'video') {
      const timer = setTimeout(() => {
        const el = document.getElementById('now-playing-video-portal');
        setPortalTarget(el);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setPortalTarget(null);
    }
  }, [showNowPlaying, playbackMode]);

  useEffect(() => {
    if (!currentTrack) return;
    
    if (currentTrack.origin === 'spotify' && !currentTrack.youtubeId) {
      console.log(`[MediaDeck] Resolving YouTube stream for Spotify track: "${currentTrack.title}" by "${currentTrack.channelTitle}"`);
      
      const resolveTrack = async () => {
        try {
          const res = await fetch(
            `/api/youtube/resolve?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.channelTitle)}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.videoId) {
              console.log(`[MediaDeck] Successfully resolved to videoId: ${data.videoId}`);
              setYoutubeIdForCurrentTrack(data.videoId);
            } else {
              console.error('[MediaDeck] Failed to resolve: no videoId returned');
            }
          } else {
            console.error('[MediaDeck] Failed to resolve: HTTP error', res.status);
          }
        } catch (err) {
          console.error('[MediaDeck] Error resolving Spotify track:', err);
        }
      };

      resolveTrack();
    }
  }, [currentTrack?.id, currentTrack?.youtubeId, setYoutubeIdForCurrentTrack]);

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
    if (isRepeat) {
      playerRef.current?.seekTo(0);
      setProgress((prev) => ({ ...prev, played: 0, playedSeconds: 0 }));
      setStorePlayedSeconds(0);
      setPlaying(true);
    } else {
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
    setShowNowPlaying(true);
  };

  return (
    <footer 
      onClick={handleDeckClick}
      className="h-20 bg-[#070707] px-6 flex items-center justify-between select-none relative z-40 flex-shrink-0 border-t border-white/5 yt-deck-slider-group cursor-pointer hover:bg-[#0f0f0f] transition-colors"
    >
      
      {/* Hidden/Portalled ReactPlayer Engine */}
      {portalTarget ? (
        createPortal(
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
            width="100%"
            height="100%"
            controls={true}
            config={{
              youtube: {
                playerVars: {
                  autoplay: 1,
                  controls: 1,
                  modestbranding: 1,
                  rel: 0
                }
              }
            }}
          />,
          portalTarget
        )
      ) : (
        <div className="hidden">
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
            width="0"
            height="0"
          />
        </div>
      )}

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
      <div className="flex items-center gap-4 w-1/3 min-w-0">
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
                    {currentTrack.isExplicit && <ExplicitBadge />}
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
            <p 
              onClick={(e) => {
                e.stopPropagation();
                viewChannel(currentTrack.channelTitle, currentTrack.channelId);
              }}
              className="text-[11px] text-zinc-400 truncate mt-0.5 hover:text-white hover:underline cursor-pointer"
            >
              {cleanVisualName(currentTrack.channelTitle)}
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
      <div className="flex flex-col items-center w-1/3">
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
            onClick={() => setIsRepeat(!isRepeat)}
            className={`transition-colors ${isRepeat ? 'text-[#ff0000]' : 'text-zinc-400 hover:text-white'}`}
            title="Repeat"
          >
            <Repeat className="w-4.5 h-4.5" />
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
      <div className="flex items-center justify-end gap-5 w-1/3 text-zinc-400">
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
          onClick={() => setShowNowPlaying(!showNowPlaying)} 
          className={`hover:text-white transition-colors p-1 ${showNowPlaying ? 'text-[#ff0000]' : ''}`} 
          title={showNowPlaying ? "Collapse Panel" : "Expand Now Playing"}
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
