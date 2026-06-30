"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export const WaitlistForm = () => {
  const [email, setEmail] = useState('');
  const [feature, setFeature] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    
    // Placeholder for actual Supabase POST request:
    // const res = await fetch('/api/waitlist', { method: 'POST', body: JSON.stringify({ email, feature }) })
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network request
      
      setStatus('success');
      setMessage("You're on the list. We'll be in touch.");
      setEmail('');
      setFeature('');
    } catch (err) {
      setStatus('error');
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      {status === 'success' ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-white"
        >
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="font-medium">{message}</span>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="relative group flex flex-col gap-3">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-800 to-zinc-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500 pointer-events-none"></div>
          
          <div className="relative flex items-center bg-[#0a0a0a] rounded-t-2xl border border-white/10 overflow-hidden focus-within:border-white/30 transition-colors">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 bg-transparent px-6 py-4 outline-none text-white placeholder:text-zinc-500"
              required
              disabled={status === 'loading'}
            />
          </div>
          
          <div className="relative flex items-center bg-[#0a0a0a] rounded-b-2xl border border-white/10 overflow-hidden focus-within:border-white/30 transition-colors">
             <div className="px-4 text-zinc-500"><Sparkles className="w-4 h-4" /></div>
             <input
              type="text"
              value={feature}
              onChange={(e) => setFeature(e.target.value)}
              placeholder="What do you want to see in the app?"
              className="flex-1 bg-transparent py-4 outline-none text-sm text-white placeholder:text-zinc-600"
              disabled={status === 'loading'}
            />
            <button
              type="submit"
              disabled={status === 'loading' || !email}
              className="flex items-center justify-center gap-2 px-6 py-3 mr-1 my-1 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
            >
              {status === 'loading' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Join <ArrowRight className="w-4 h-4 hidden sm:block" />
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {status === 'error' && (
              <motion.p initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="mt-1 text-sm text-red-400 text-center">
                {message}
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      )}
      <p className="mt-4 text-xs text-zinc-500 text-center font-medium">
        No spam. Unsubscribe at any time.
      </p>
    </div>
  );
};
