"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Smartphone } from 'lucide-react';

export const AppDemoMockups = () => {
  return (
    <section className="relative py-24 px-6 overflow-hidden bg-[#000000]">
      {/* Background glow for the mockups */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[400px] bg-zinc-800/20 blur-[120px] rounded-[100%]"></div>
      </div>

      <div className="max-w-6xl mx-auto text-center mb-16 relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Designed for any screen.</h2>
        <p className="text-zinc-400 font-medium">Experience the same fluid, zero-latency interface whether you're at your desk or on the move.</p>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-0">
        {/* Desktop Mockup */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative w-full max-w-3xl lg:translate-x-12 z-10"
        >
          <div className="aspect-[16/10] bg-[#0a0a0a] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            {/* Window Header */}
            <div className="h-10 border-b border-white/5 bg-[#121212] flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="mx-auto flex items-center gap-2 text-zinc-500 text-xs font-medium">
                <Monitor className="w-3 h-3" /> Desktop App View
              </div>
            </div>
            {/* App Content Placeholder */}
            <div className="flex-1 p-6 flex">
              {/* Sidebar */}
              <div className="w-48 border-r border-white/5 pr-6 hidden sm:block space-y-4">
                <div className="h-6 w-32 bg-white/5 rounded-md animate-pulse"></div>
                <div className="h-4 w-24 bg-white/5 rounded-md animate-pulse"></div>
                <div className="h-4 w-28 bg-white/5 rounded-md animate-pulse"></div>
                <div className="h-4 w-20 bg-white/5 rounded-md animate-pulse"></div>
              </div>
              {/* Main Content */}
              <div className="flex-1 sm:pl-6 space-y-6">
                <div className="h-48 w-full bg-gradient-to-br from-indigo-500/10 to-red-500/5 rounded-xl border border-white/5 flex items-center justify-center">
                  <span className="text-zinc-600 font-bold text-sm tracking-widest">HERO BANNER PLACEHOLDER</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-square bg-white/5 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile Mockup */}
        <motion.div 
          initial={{ opacity: 0, x: 50, y: 50 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative w-[280px] shrink-0 z-20 lg:-translate-x-12 lg:translate-y-16"
        >
          <div className="aspect-[9/19] bg-[#0a0a0a] rounded-[2rem] border-4 border-zinc-800 shadow-2xl overflow-hidden relative">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-10 flex items-center justify-center">
               <div className="w-12 h-1.5 bg-black rounded-full"></div>
            </div>
            
            {/* App Content Placeholder */}
            <div className="absolute inset-0 pt-10 pb-6 px-4 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="h-6 w-24 bg-white/5 rounded-md"></div>
                <div className="w-8 h-8 rounded-full bg-white/5"></div>
              </div>
              
              <div className="flex-1 overflow-hidden space-y-4">
                <div className="h-40 w-full bg-gradient-to-br from-indigo-500/10 to-red-500/5 rounded-xl border border-white/5 flex items-center justify-center">
                  <span className="text-zinc-600 font-bold text-[10px] tracking-widest">PLAYER</span>
                </div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 w-full bg-white/5 rounded-xl flex items-center px-3 gap-3">
                     <div className="w-10 h-10 bg-white/10 rounded-md"></div>
                     <div className="space-y-2 flex-1">
                       <div className="h-3 w-3/4 bg-white/10 rounded-sm"></div>
                       <div className="h-2 w-1/2 bg-white/5 rounded-sm"></div>
                     </div>
                  </div>
                ))}
              </div>
              
              {/* Bottom Nav */}
              <div className="h-16 border-t border-white/5 mt-auto flex items-center justify-around">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-md bg-white/10"></div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
