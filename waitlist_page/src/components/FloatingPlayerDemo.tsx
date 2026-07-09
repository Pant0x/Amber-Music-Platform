"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';

const DEMO_SONGS = [
  {
    title: "KICK OUT",
    artist: "Travis Scott",
    cover: "/pics/JACKBOYS_2_-_Album_Cover_by_JACKBOYS_&_Travis_Scott.png",
    youtubeId: "lqRo0r36nRw",
    duration: 30 // Play 30 second part
  },
  {
    title: "Any Colour You Like",
    artist: "Pink Floyd",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/3e/76/b0/3e76b0e3-762b-2286-a019-8afb19cee541/886445635829.jpg/600x600bb.jpg",
    youtubeId: "l8pEjmZVx3k",
    duration: 30
  },
  {
    title: "Deep Fried Frenz",
    artist: "MF DOOM",
    cover: "/pics/1900x1900-000000-80-0-0.jpg",
    youtubeId: "BjoULuCVQiw",
    duration: 30
  },
  {
    title: "Save Your Tears",
    artist: "The Weeknd",
    cover: "/pics/ab67616d0000b2738863bc11d2aa12b54f5aeb36.jpg",
    youtubeId: "u6lihZAcy4s",
    duration: 30
  },
  {
    title: "No Pole",
    artist: "Don Toliver",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a5/c2/a5/a5c2a541-9f56-7c98-eb01-3c3198267851/075679823908.jpg/600x600bb.jpg",
    youtubeId: "fCeiUX59_FM",
    duration: 30
  }
];

export const FloatingPlayerDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [currentSongIdx, setCurrentSongIdx] = useState(0);
  
  const playerRef = useRef<any>(null);
  const isApiLoaded = useRef<boolean>(false);
  const { scrollY } = useScroll();

  const currentSong = DEMO_SONGS[currentSongIdx];

  // Map scroll position: High (1.0) on Hero/Footer, Low (0.05) when reading features or bento/designed for any screen page
  const volumeRange = useTransform(
    scrollY, 
    [0, 600, 800, 2600, 2900], 
    [1.0, 1.0, 0.05, 0.05, 1.0]
  );

  // Handle setting up YouTube Iframe API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as any;

    const setupPlayer = () => {
      if (!win.YT || !win.YT.Player) return;
      
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

  // Track progress while playing & skip to next song at 30 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const currentTime = playerRef.current.getCurrentTime();
          if (currentTime >= 30) {
            handleNext(undefined as any);
          } else {
            setProgress(currentTime);
          }
        }
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSongIdx]);

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
    const newTime = percentage * 30; // Max 30s preview
    setProgress(newTime);
    playerRef.current.seekTo(newTime, true);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

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
                  style={{ width: `${Math.min(100, (progress / 30) * 100)}%` }}
                ></motion.div>
              </div>
              <span className="text-xs font-mono text-zinc-500 w-10 text-right">
                {formatTime(30)}
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
               <Volume2 className="w-4 h-4 text-zinc-400" />
               <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden relative">
                 <div className="h-full bg-zinc-400 rounded-full w-full"></div>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
