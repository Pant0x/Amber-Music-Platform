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
  const setActiveTab = usePlayerStore((s) => s.setActiveTab);
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
    else if (activeTab === 'playlist' && currentPlaylistId) {
      const prefix = (currentPlaylistId.startsWith('MPREb') || currentPlaylistId.startsWith('OLAK')) ? 'album' : 'playlist';
      targetPath = `/${prefix}/${currentPlaylistId}`;
    }
    else if (activeTab === 'channel' && currentChannelId) targetPath = `/artist/${encodeURIComponent(currentChannelId)}`;
    
    // Only route if targetPath differs from current browser path
    if (targetPath && window.location.pathname !== targetPath && decodeURIComponent(window.location.pathname) !== decodeURIComponent(targetPath)) {
      const search = window.location.search;
      router.push(targetPath + search);
    }
  }, [activeTab, currentPlaylistId, currentChannelId, router]);

  // Synchronize activeTab inside store with pathname when browser navigates
  useEffect(() => {
    if (!pathname) return;
    
    let tab: any = null;
    if (pathname === '/') tab = 'home';
    else if (pathname === '/explore') tab = 'explore';
    else if (pathname === '/library') tab = 'library';
    else if (pathname === '/liked') tab = 'liked';
    else if (pathname === '/search') tab = 'search';
    else if (pathname.startsWith('/playlist/') || pathname.startsWith('/album/')) tab = 'playlist';
    else if (pathname.startsWith('/artist/')) tab = 'channel';
    
    if (tab && activeTab !== tab) {
      if (activeTab === 'lyrics') return;
      setActiveTab(tab);
    }
  }, [pathname, activeTab, setActiveTab]);

  // Synchronize playing song parameter (play=TRACK_ID) in the URL search query
  const currentTrackId = currentTrack?.id;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const existingPlay = params.get('play');
    if (currentTrackId) {
      if (existingPlay !== currentTrackId) {
        params.set('play', currentTrackId);
        const newSearch = params.toString();
        window.history.replaceState(null, '', window.location.pathname + `?${newSearch}`);
      }
    } else {
      if (existingPlay) {
        params.delete('play');
        const newSearch = params.toString();
        window.history.replaceState(null, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''));
      }
    }
  }, [currentTrackId, pathname]);

  const playerRef = useRef<any>(null);
  const [progress, setProgress] = useState({ played: 0, playedSeconds: 0, loaded: 0 });
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isReadyRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const lastProgressSyncTimeRef = useRef(Date.now());
  const playedSecondsRef = useRef(0);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const SILENCE_DATA = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA";
    if (!silentAudioRef.current && typeof window !== 'undefined') {
      const audio = new Audio(SILENCE_DATA);
      audio.loop = true;
      audio.volume = 0.001;
      silentAudioRef.current = audio;
    }

    if (isPlaying) {
      silentAudioRef.current?.play().catch(() => {});
    } else {
      silentAudioRef.current?.pause();
    }
  }, [isPlaying]);

  // Reset ready state when track changes
  useEffect(() => {
    isReadyRef.current = false;
    isTransitioningRef.current = false;
    playedSecondsRef.current = 0;
    lastProgressSyncTimeRef.current = Date.now();
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
    
    const isTopicChannel = currentTrack.channelTitle?.toLowerCase().includes('topic');

    // If we have a direct YouTube track from a Topic channel, we play it directly.
    // Otherwise, we force resolution to find the clean official Topic release.
    const needsResolve = !currentTrack.youtubeId && (currentTrack.origin !== 'youtube' || !isTopicChannel);
    
    if (!currentTrack.youtubeId && currentTrack.origin === 'youtube' && isTopicChannel) {
      setYoutubeIdForCurrentTrack(currentTrack.id);
    }
    
    if (needsResolve) {
      console.log(`[MediaDeck] Resolving stream for: "${currentTrack.title}" by "${currentTrack.channelTitle}"`);
      
      const resolveTrack = async () => {
        try {
          const hideExplicit = usePlayerStore.getState().hideExplicit;
          const explicitParam = (!hideExplicit || currentTrack.isExplicit) ? '&explicit=true' : '';
          const albumParam = currentTrack.albumName ? `&album=${encodeURIComponent(currentTrack.albumName)}` : '';
          const res = await fetch(
            `/api/youtube/resolve?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.channelTitle)}${explicitParam}${albumParam}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.videoId) {
              console.log(`[MediaDeck] Successfully resolved to videoId: ${data.videoId}`);
              setYoutubeIdForCurrentTrack(data.videoId);
              if (data.track) {
                // Only enrich non-text metadata — never overwrite title/artist from resolver
                // (resolver may find a slightly different version that would corrupt displayed metadata)
                enrichCurrentTrack({
                  thumbnailUrl: data.track.thumbnailUrl || undefined,
                  albumName: data.track.albumName || undefined,
                  albumId: data.track.albumId || undefined,
                  duration: data.track.duration || undefined,
                  isExplicit: data.track.isExplicit ?? undefined,
                });
              }
            } else {
              console.error('[MediaDeck] Failed to resolve: no videoId returned');
              // Do NOT fall back to raw currentTrack.id for album tracks — it may be a VEVO/video clip.
              // Only fall back for tracks that originated directly as standalone YouTube videos.
              const isAlbumTrack = !!currentTrack.albumName || !!currentTrack.albumId;
              if (currentTrack.origin === 'youtube' && !isAlbumTrack) {
                setYoutubeIdForCurrentTrack(currentTrack.id);
              }
            }
          } else {
            console.error('[MediaDeck] Failed to resolve: HTTP error', res.status);
            const isAlbumTrack = !!currentTrack.albumName || !!currentTrack.albumId;
            if (currentTrack.origin === 'youtube' && !isAlbumTrack) {
              setYoutubeIdForCurrentTrack(currentTrack.id);
            }
          }
        } catch (err) {
          console.error('[MediaDeck] Error resolving track:', err);
          const isAlbumTrack = !!currentTrack.albumName || !!currentTrack.albumId;
          if (currentTrack.origin === 'youtube' && !isAlbumTrack) {
            setYoutubeIdForCurrentTrack(currentTrack.id);
          }
        }
      };

      resolveTrack();
    }
  }, [currentTrack?.id, currentTrack?.youtubeId, setYoutubeIdForCurrentTrack]);

  // Pre-resolve next track in queue for instant playback on transition
  useEffect(() => {
    if (queue.length === 0) return;
    const nextTrack = queue[0];
    
    if (!nextTrack.youtubeId) {
      console.log(`[MediaDeck] Pre-resolving next track in queue: "${nextTrack.title}"`);
      const resolveNext = async () => {
        try {
          const hideExplicit = usePlayerStore.getState().hideExplicit;
          const explicitParam = (!hideExplicit || nextTrack.isExplicit) ? '&explicit=true' : '';
          const albumParam = nextTrack.albumName ? `&album=${encodeURIComponent(nextTrack.albumName)}` : '';
          const res = await fetch(
            `/api/youtube/resolve?title=${encodeURIComponent(nextTrack.title)}&artist=${encodeURIComponent(nextTrack.channelTitle)}${explicitParam}${albumParam}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.videoId) {
              console.log(`[MediaDeck] Successfully pre-resolved next track to: ${data.videoId}`);
              usePlayerStore.setState((state) => {
                const newQueue = state.queue.map((t, idx) => {
                  if (idx === 0) {
                    return { 
                      ...t, 
                      youtubeId: data.videoId,
                      // Only enrich supplemental metadata — never overwrite title/artist from resolver
                      ...(data.track && {
                        ...(data.track.thumbnailUrl && { thumbnailUrl: data.track.thumbnailUrl }),
                        ...(data.track.albumName && { albumName: data.track.albumName }),
                        ...(data.track.albumId && { albumId: data.track.albumId }),
                        ...(data.track.duration && { duration: data.track.duration }),
                        ...(data.track.isExplicit !== undefined && { isExplicit: data.track.isExplicit }),
                      })
                    };
                  }
                  return t;
                });
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

  useEffect(() => {
    lastProgressSyncTimeRef.current = Date.now();
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || !currentTrack || duration <= 0) return;

    const interval = setInterval(() => {
      if (isTransitioningRef.current) return;

      const elapsedMs = Date.now() - lastProgressSyncTimeRef.current;
      const estimatedPlayedSeconds = playedSecondsRef.current + (elapsedMs / 1000);

      // If we've played past the duration (with a 2s tolerance buffer to let natural events fire),
      // and we are still marked as playing, force transition to the next track.
      if (estimatedPlayedSeconds >= duration + 2) {
        console.log(`[MediaDeck Watchdog] Track finished in background. Forcing next track.`);
        isTransitioningRef.current = true;
        handlePlayerEnded();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack?.id, duration]);

  if (!mounted || !_hasHydrated) return null;

  if (!currentTrack) return null;

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
    playedSecondsRef.current = state.playedSeconds;
    lastProgressSyncTimeRef.current = Date.now();
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

  // trackNeedsResolve = true while we wait for the YouTube ID to be resolved.
  // Never play while unresolved — the raw currentTrack.id may be a VEVO/video clip.
  const trackNeedsResolve = currentTrack && !currentTrack.youtubeId && currentTrack.origin !== 'spotify';

  return (
    <div 
      className="fixed pointer-events-none"
      style={{
        position: 'fixed',
        bottom: '0',
        right: '0',
        width: '1px',
        height: '1px',
        opacity: 0.001,
        pointerEvents: 'none',
        zIndex: 99999,
        overflow: 'hidden'
      }}
    >
      <ReactPlayer
        ref={playerRef}
        url={
          currentTrack.youtubeId 
            ? `https://www.youtube.com/watch?v=${currentTrack.youtubeId}` 
            : currentTrack.origin === 'spotify' 
              ? '' 
              : '' // Wait for resolution — never load raw ID (could be VEVO/video clip)
        }
        playing={isPlaying && !trackNeedsResolve}
        volume={volume}
        muted={isMuted}
        onProgress={handlePlayerProgress}
        progressInterval={200}
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
  );
};
