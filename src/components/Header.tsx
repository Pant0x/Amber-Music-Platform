'use client';

import React, { useState, useEffect } from 'react';
import { Search, User, X, Play, Compass, Home, Library, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useRouter } from 'next/navigation';

export const Header: React.FC = () => {
  const router = useRouter();
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    addSearchQueryToHistory,
    setCurrentPlaylistId,
    setCurrentChannelId,
    navHistory,
    navForward,
    navigateBack,
    navigateForward
  } = usePlayerStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogoClick = () => {
    setActiveTab('home');
    setCurrentPlaylistId(null);
    setCurrentChannelId(null);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      addSearchQueryToHistory(searchQuery);
    }
  };

  return (
    <header className="h-16 w-full bg-[#030303] border-b border-white/5 px-6 flex items-center justify-between select-none z-30 flex-shrink-0">

      {/* 1. LEFT SIDE: Brand Logo & Navigation Chevrons */}
      <div className="flex items-center gap-6 flex-shrink-0">
        <div onClick={handleLogoClick} className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#ff0000] flex items-center justify-center text-white">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
            Pantooty <span className="font-light text-zinc-400">Music</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 p-1 rounded-full">
          <button
            onClick={navigateBack}
            disabled={!mounted || navHistory.length === 0}
            className={`p-1.5 rounded-full transition-colors ${
              !mounted || navHistory.length === 0 
                ? 'opacity-30 cursor-not-allowed text-zinc-600' 
                : 'hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Back"
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={navigateForward}
            disabled={!mounted || navForward.length === 0}
            className={`p-1.5 rounded-full transition-colors ${
              !mounted || navForward.length === 0 
                ? 'opacity-30 cursor-not-allowed text-zinc-600' 
                : 'hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Forward"
            aria-label="Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CENTER SIDE: Wide Search Pill */}
      <div className="flex-1 max-w-2xl mx-12 hidden md:block">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeTab !== 'search') {
                setActiveTab('search');
                setCurrentPlaylistId(null);
                setCurrentChannelId(null);
              }
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search songs, albums, artists, channels..."
            className="w-full bg-[#1f1f1f] text-white text-sm pl-12 pr-10 py-2.5 rounded-full outline-none placeholder-zinc-400 border border-transparent focus:border-zinc-800 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={handleSearchClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. RIGHT SIDE: Profile Avatar */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Mobile Search Button */}
        <button
          onClick={() => {
            setActiveTab('search');
            setCurrentPlaylistId(null);
            setCurrentChannelId(null);
          }}
          className="p-2 text-zinc-400 hover:text-white md:hidden"
        >
          <Search className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 rounded-full bg-[#0055ff] flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:scale-105 transition-transform">
          G
        </div>
      </div>

    </header>
  );
};
