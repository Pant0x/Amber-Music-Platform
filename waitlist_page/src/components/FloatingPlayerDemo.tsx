"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Volume2, Maximize2, Mic2 } from 'lucide-react';

const DEMO_SONGS = [
  {
    title: "KICK OUT",
    artist: "Travis Scott",
    cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=400&auto=format&fit=crop&grayscale=true",
    duration: "3:42",
    lyrics: [
      { time: 10, text: "Yeah, yeah" },
      { time: 25, text: "Kick out the doors" },
      { time: 40, text: "Let me in" },
      { time: 55, text: "They said I couldn't" },
      { time: 70, text: "Now they wanna be friends" }
    ]
  },
  {
    title: "Any Colour You Like",
    artist: "Pink Floyd",
    cover: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=400&auto=format&fit=crop",
    duration: "3:25",
    lyrics: [
      { time: 5, text: "(Instrumental intro)" },
      { time: 30, text: "(Synthesizer solo)" },
      { time: 60, text: "Any colour you like" },
      { time: 80, text: "They're all the same" }
    ]
  },
  {
    title: "Deep Fried Frenz",
    artist: "MF DOOM",
    cover: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?q=80&w=400&auto=format&fit=crop",
    duration: "4:59",
    lyrics: [
      { time: 5, text: "Friends, how many of us have them?" },
      { time: 25, text: "Friends, ones we can depend on" },
      { time: 40, text: "Before we go any further" },
      { time: 55, text: "Let's be friends" }
    ]
  },
  {
    title: "Save Your Tears",
    artist: "The Weeknd",
    cover: "https://images.unsplash.com/photo-1493225457124-a1a2a2f52ba3?q=80&w=400&auto=format&fit=crop",
    duration: "3:35",
    lyrics: [
      { time: 5, text: "I saw you dancing in a crowded room" },
      { time: 25, text: "You look so happy when I'm not with you" },
      { time: 40, text: "But then you saw me, caught you by surprise" },
      { time: 55, text: "A single teardrop falling from your eye" }
    ]
  },
  {
    title: "No Pole",
    artist: "Don Toliver",
    cover: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?q=80&w=400&auto=format&fit=crop",
    duration: "3:12",
    lyrics: [
      { time: 5, text: "I'm in the hills, I'm out of my mind" },
      { time: 25, text: "You know I'm looking for a good time" },
      { time: 40, text: "Ain't got no pole, but she slide" },
      { time: 55, text: "Ride with me through the night" }
    ]
  }
];

export const FloatingPlayerDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [currentSongIdx, setCurrentSongIdx] = useState(0);
  const [showLyrics, setShowLyrics] = useState(true);

  const currentSong = DEMO_SONGS[currentSongIdx];

  // Simulate progress bar moving
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            handleNext(undefined as any);
            return 0;
          }
          return p + 0.5;
        });
      }, 500);
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

  // Find active lyric line based on progress
  const activeLyricIdx = currentSong.lyrics.findIndex((lyric, idx) => {
    const nextLyric = currentSong.lyrics[idx + 1];
    return progress >= lyric.time && (!nextLyric || progress < nextLyric.time);
  });

  return (
    <div className="mt-16 w-full max-w-2xl mx-auto relative group z-20">
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.5, type: 'spring', bounce: 0.4 }}
        className="cursor-pointer relative"
        onClick={() => setIsPlaying(!isPlaying)}
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
              <span className="text-xs font-mono text-zinc-500">
                {Math.floor(progress / 60)}:{(Math.floor(progress % 60)).toString().padStart(2, '0')}
              </span>
              <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden relative">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-indigo-500 rounded-full"
                  style={{ width: `${progress}%` }}
                ></motion.div>
              </div>
              <span className="text-xs font-mono text-zinc-500">{currentSong.duration}</span>
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
               <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                 <div className="w-2/3 h-full bg-zinc-400 rounded-full"></div>
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
