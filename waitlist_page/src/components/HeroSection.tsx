"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { WaitlistForm } from './WaitlistForm';

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 overflow-hidden">
      {/* Ambient Light Leaks */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Urgency Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-wider text-white mb-8"
        >
          <span className="animate-pulse">🔥</span> 
          WAITING LIST USERS GET THE FIRST YEAR COMPLETELY FREE
        </motion.div>

        {/* Headlines */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight"
        >
          Your Music. <br className="md:hidden" />
          <span className="text-zinc-500">Your Rules.</span> <br />
          <span className="text-gradient bg-gradient-to-r from-white to-zinc-500">Uninterrupted.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
        >
          The ultimate streaming engine built for listeners and creators. Upload your own audio, sync everywhere, and experience music without limits.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <WaitlistForm />
        </motion.div>
      </div>
    </section>
  );
};
