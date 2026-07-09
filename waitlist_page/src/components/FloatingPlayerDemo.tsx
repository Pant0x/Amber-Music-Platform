"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Volume2, Mic2 } from 'lucide-react';

const DEMO_SONGS = [
  {
    title: "KICK OUT",
    artist: "Travis Scott",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/30/66/90/306690d4-2a29-402e-e406-6b319ce7731a/886447227169.jpg/600x600bb.jpg",
    youtubeId: "lqRo0r36nRw",
    duration: 162, // 2:42
    lyrics: [
      { time: 0, text: "(Intro beat)" },
      { time: 8, text: "Yeah, yeah" },
      { time: 14, text: "Kick out the doors" },
      { time: 18, text: "Let me in" },
      { time: 24, text: "They said I couldn't" },
      { time: 28, text: "Now they wanna be friends" },
      { time: 33, text: "First year for free, then 50% off!" }
    ]
  },
  {
    title: "Any Colour You Like",
    artist: "Pink Floyd",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/3e/76/b0/3e76b0e3-762b-2286-a019-8afb19cee541/886445635829.jpg/600x600bb.jpg",
    youtubeId: "l8pEjmZVx3k",
    duration: 205, // 3:25
    lyrics: [
      { time: 0, text: "(Trippy synthesizer intro)" },
      { time: 15, text: "(Wah-wah guitar solo enters)" },
      { time: 45, text: "(Hammond organ swells)" },
      { time: 75, text: "(Synthesizer and guitar duel)" }
    ]
  },
  {
    title: "Deep Fried Frenz",
    artist: "MF DOOM",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/fb/9e/cb/fb9ecb3d-c6a4-1cff-2337-1267b8a3c4b9/artwork.jpg/600x600bb.jpg",
    youtubeId: "BjoULuCVQiw",
    duration: 299, // 4:59
    lyrics: [
      { time: 0, text: "(Intro beat)" },
      { time: 8, text: "Friends... how many of us have them?" },
      { time: 14, text: "Friends... ones we can depend on" },
      { time: 20, text: "Before we go any further, let's be friends" },
      { time: 26, text: "Yeah, check it. Some write to sheet, some speak to street" },
      { time: 32, text: "Most don't know who they gonna meet" }
    ]
  },
  {
    title: "Save Your Tears",
    artist: "The Weeknd",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/83/3a/f7/833af71b-2e0c-3303-24f5-8f5c546c073b/20UMGIM21167.rgb.jpg/600x600bb.jpg",
    youtubeId: "u6lihZAcy4s",
    duration: 215, // 3:35
    lyrics: [
      { time: 0, text: "(Synth intro)" },
      { time: 8, text: "I saw you dancing in a crowded room" },
      { time: 15, text: "You look so happy when I'm not with you" },
      { time: 22, text: "But then you saw me, caught you by surprise" },
      { time: 29, text: "A single teardrop falling from your eye" },
      { time: 36, text: "I don't know why I run away" },
      { time: 43, text: "I'll make you cry when I run away" }
    ]
  },
  {
    title: "No Pole",
    artist: "Don Toliver",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a5/c2/a5/a5c2a541-9f56-7c98-eb01-3c3198267851/075679823908.jpg/600x600bb.jpg",
    youtubeId: "fCeiUX59_FM",
    duration: 192, // 3:12
    lyrics: [
      { time: 0, text: "(Intro)" },
      { time: 6, text: "I'm in the hills, I'm out of my mind" },
      { time: 12, text: "You know I'm looking for a good time" },
      { time: 18, text: "Ain't got no pole, but she slide" },
      { time: 24, text: "Ride with me through the night" },
      { time: 30, text: "Yeah, we going up, yeah, we taking flight" }
    ]
  }
];

export const FloatingPlayerDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [currentSongIdx, setCurrentSongIdx] = useState(0);
  const [showLyrics, setShowLyrics] = useState(true);
  
  const playerRef = useRef<any>(null);
  const isApiLoaded = useRef<boolean>(false);
  const { scrollY } = useScroll();

  const currentSong = DEMO_SONGS[currentSongIdx];

  // Map scroll position to audio volume (low at top, high when scrolled down to player)
  const volumeRange = useTransform(scrollY, [0, 400], [0.1, 1.0]);

  // Handle setting up YouTube Iframe API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupPlayer = () => {
      const win = window as any;
      if (!win.YT || !win.YT.Player) return;
      
      // If player already exists, just destroy it first to avoid duplicates
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) {}
      }

      playerRef.current = new win.YT.Player('yt-player-iframe', {
        height: '0',
        width: '0',
        videoId: currentSong.youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            const vol = volumeRange.get();
            event.target.setVolume(vol * 100);
            if (isPlaying) {
              event.target.playVideo();
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
            if (event.data === 1) {
              setIsPlaying(true);
            } else if (event.data === 2) {
              setIsPlaying(false);
            } else if (event.data === 0) {
              handleNext(undefined as any);
            }
          }
        }
      });
    };

    const win = window as any;
    if (win.YT && win.YT.Player) {
      setupPlayer();
    } else {
      if (!isApiLoaded.current) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        isApiLoaded.current = true;
      }

      win.onYouTubeIframeAPIReady = () => {
        setupPlayer();
      };
    }

    return () => {
      // Don't destroy on every song change, only on unmount
    };
  }, []);

  // Update volume when scrolling
  useEffect(() => {
    return volumeRange.onChange((v) => {
      if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
        playerRef.current.setVolume(v * 100);
      }
    });
  }, [volumeRange]);

  // Load new video when song changes
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      playerRef.current.loadVideoById({
        videoId: currentSong.youtubeId,
        startSeconds: 0,
      });
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [currentSongIdx]);

  // Track progress while playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          setProgress(playerRef.current.getCurrentTime());
        }
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleNext = (e: React.MouseEvent) => {
    e?.stopPropagation();
    setProgress(0);
    setCurrentSongIdx((prev) => (prev + 1) % DEMO_SONGS.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e?.stopPropagation();
    setProgress(0);
    setCurrentSongIdx((prev) => (prev - 1 + DEMO_SONGS.length) % DEMO_SONGS.length);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!playerRef.current || typeof playerRef.current.seekTo !== 'function') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * currentSong.duration;
    setProgress(newTime);
    playerRef.current.seekTo(newTime, true);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Find active lyric line based on progress
  const activeLyricIdx = currentSong.lyrics.findIndex((lyric, idx) => {
    const nextLyric = currentSong.lyrics[idx + 1];
    return progress >= lyric.time && (!nextLyric || progress < nextLyric.time);
  });

  return (
    <div className="mt-16 w-full max-w-2xl mx-auto relative group z-20">
      
      {/* Hidden YouTube Iframe Container */}
      <div id="yt-player-iframe" className="hidden pointer-events-none absolute w-0 h-0 opacity-0" />

      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.5, type: 'spring', bounce: 0.4 }}
        className="cursor-pointer relative"
        onClick={togglePlay}
      >
        {/* Floating Aura */}
        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-red-500/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
        
        {/* Glass Panel */}
        <div className="relative bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 shadow-2xl flex flex-col md:flex-row items-center gap-6 overflow-hidden">
          {/* Animated equalizer background accent when playing */}
          {isPlaying && (
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute top-0 left-1/4 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent animate-pulse-slow"></div>
            </div>
          )}

          {/* Album Cover & Status */}
          <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden shrink-0 shadow-xl bg-zinc-900 border border-white/5">
            <div className="absolute inset-0 bg-black/20 mix-blend-overlay z-10"></div>
            <AnimatePresence mode="popLayout">
              <motion.img 
                key={currentSong.cover}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                src={currentSong.cover} 
                alt="Demo Track Cover" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
            {/* Active indicator overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
              {isPlaying ? <Pause className="w-8 h-8 text-white fill-white" /> : <Play className="w-8 h-8 text-white fill-white ml-1" />}
            </div>
          </div>

          {/* Track Info & Controls */}
          <div className="flex-1 w-full text-center md:text-left flex flex-col justify-center relative z-20">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <span className="inline-flex items-center justify-center bg-zinc-700/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider">E</span>
              <span className="text-xs font-bold text-red-500 tracking-widest uppercase">Live Demo</span>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSong.title}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-xl font-bold text-white mb-1 truncate">{currentSong.title}</h3>
                <p className="text-sm text-zinc-400 mb-4">{currentSong.artist}</p>
              </motion.div>
            </AnimatePresence>

            {/* Scrubber */}
            <div className="w-full flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-500 w-10">
                {formatTime(progress)}
              </span>
              <div 
                className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden relative cursor-pointer"
                onClick={handleScrub}
              >
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-indigo-500 rounded-full"
                  style={{ width: `${Math.min(100, (progress / currentSong.duration) * 100)}%` }}
                ></motion.div>
              </div>
              <span className="text-xs font-mono text-zinc-500 w-10 text-right">
                {formatTime(currentSong.duration)}
              </span>
            </div>
          </div>

          {/* Right side controls */}
          <div className="hidden md:flex flex-col items-center gap-4 shrink-0 px-4 relative z-20">
            <div className="flex items-center gap-4 text-zinc-400">
               <SkipBack 
                 className="w-5 h-5 hover:text-white transition-colors cursor-pointer" 
                 onClick={handlePrev} 
               />
               <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer">
                 {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-1" />}
               </div>
               <SkipForward 
                 className="w-5 h-5 hover:text-white transition-colors cursor-pointer" 
                 onClick={handleNext} 
               />
            </div>
            <div className="flex items-center gap-2 text-zinc-500 w-full justify-center">
               <Volume2 className="w-4 h-4" />
               <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden relative">
                 <motion.div 
                   className="h-full bg-zinc-400 rounded-full"
                   style={{ width: useTransform(volumeRange, [0.1, 1.0], ['10%', '100%']) }}
                 ></motion.div>
               </div>
               <Mic2 
                 className={`w-4 h-4 ml-2 transition-colors cursor-pointer ${showLyrics ? 'text-indigo-400' : 'hover:text-white'}`}
                 onClick={(e) => {
                   e.stopPropagation();
                   setShowLyrics(!showLyrics);
                 }}
               />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Syncing Lyrics Area */}
      <AnimatePresence>
        {showLyrics && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-xl mx-auto mt-6 bg-[#0a0a0a]/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 overflow-hidden relative"
          >
            {/* Soft glow inside lyrics box */}
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10"></div>
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10"></div>
            
            <div className="relative h-24 flex flex-col items-center justify-center space-y-3 pointer-events-none">
              <AnimatePresence mode="popLayout">
                {currentSong.lyrics.map((lyric, idx) => {
                  const isActive = idx === activeLyricIdx;
                  const isPast = idx < activeLyricIdx;
                  const isUpcoming = idx > activeLyricIdx;

                  // Only show active, and one before/after for clean UI
                  if (Math.abs(idx - activeLyricIdx) > 1 && !(!isActive && activeLyricIdx === -1)) return null;

                  return (
                    <motion.p
                      key={`${currentSong.title}-lyric-${idx}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: isActive ? 1 : 0.3,
                        scale: isActive ? 1.05 : 0.95,
                        y: isPast ? -20 : isUpcoming ? 20 : 0
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className={`text-center transition-colors duration-500 absolute w-full ${
                        isActive 
                          ? 'text-lg md:text-xl font-bold text-white' 
                          : 'text-sm md:text-base font-medium text-zinc-500'
                      }`}
                    >
                      {lyric.text}
                    </motion.p>
                  );
                })}
              </AnimatePresence>
              
              {/* Fallback if no lyric is active yet */}
              {activeLyricIdx === -1 && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  className="text-zinc-500 font-medium tracking-widest text-sm absolute"
                >
                  (♪ Instrumental ♪)
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
