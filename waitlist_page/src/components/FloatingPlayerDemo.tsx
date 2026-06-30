"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Volume2, Maximize2 } from 'lucide-react';

export const FloatingPlayerDemo = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(35); // simulated percentage

  // Simulate progress bar moving
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(p => (p >= 100 ? 0 : p + 0.5));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.5, type: 'spring', bounce: 0.4 }}
      className="mt-16 w-full max-w-2xl mx-auto relative group z-20 cursor-pointer"
      onClick={() => setIsPlaying(!isPlaying)}
    >
      {/* Floating Aura */}
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-red-500/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
      
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
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-red-600 opacity-80 mix-blend-overlay"></div>
          <img 
            src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=400&auto=format&fit=crop" 
            alt="Demo Track Cover" 
            className="w-full h-full object-cover"
          />
          {/* Active indicator overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isPlaying ? <Pause className="w-8 h-8 text-white fill-white" /> : <Play className="w-8 h-8 text-white fill-white ml-1" />}
          </div>
        </div>

        {/* Track Info & Controls */}
        <div className="flex-1 w-full text-center md:text-left flex flex-col justify-center">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <span className="inline-flex items-center justify-center bg-zinc-700/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider">E</span>
            <span className="text-xs font-bold text-red-500 tracking-widest uppercase">Live Demo</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1 truncate">Midnight Symphony</h3>
          <p className="text-sm text-zinc-400 mb-4">Pantooty Exclusive &bull; High-Res Audio</p>

          {/* Scrubber */}
          <div className="w-full flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-500">1:24</span>
            <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden relative">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-indigo-500 rounded-full"
                style={{ width: `${progress}%` }}
              ></motion.div>
            </div>
            <span className="text-xs font-mono text-zinc-500">3:42</span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="hidden md:flex flex-col items-center gap-4 shrink-0 px-4">
          <div className="flex items-center gap-4 text-zinc-400">
             <SkipBack className="w-5 h-5 hover:text-white transition-colors" />
             <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
               {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-1" />}
             </div>
             <SkipForward className="w-5 h-5 hover:text-white transition-colors" />
          </div>
          <div className="flex items-center gap-2 text-zinc-500 w-full justify-center">
             <Volume2 className="w-4 h-4" />
             <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
               <div className="w-2/3 h-full bg-zinc-400 rounded-full"></div>
             </div>
             <Maximize2 className="w-4 h-4 ml-2 hover:text-white transition-colors cursor-pointer" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
