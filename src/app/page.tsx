'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MainDashboard } from '@/components/MainDashboard';
import { QueuePanel } from '@/components/QueuePanel';
import { NowPlayingView } from '@/components/NowPlayingView';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Home as HomeIcon, Compass, Library } from 'lucide-react';

export default function Home() {
  const {
    activeTab,
    setActiveTab,
    setCurrentPlaylistId,
    setCurrentChannelId
  } = usePlayerStore();

  const navigateToTab = (tab: 'home' | 'explore' | 'library') => {
    setActiveTab(tab);
    setCurrentPlaylistId(null);
    setCurrentChannelId(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* 1. YouTube Music Sticky Top Header */}
      <Header />

      {/* 2. Middle Body: Sidebar + Main Content scroll + sliding Queue Panel */}
      <div className="flex-1 flex min-w-0 overflow-hidden relative">

        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Scrollable Dashboard View */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-[#030303]">
          <MainDashboard />
          <NowPlayingView />
        </main>

        {/* Sliding Queue Panel on Right */}
        <QueuePanel />
      </div>

      {/* Mobile Bottom Navigation Bar (YouTube Music style) */}
      <div className="md:hidden h-14 bg-[#070707] border-t border-white/5 flex items-center justify-around z-20 flex-shrink-0 text-zinc-400 font-semibold text-[10px]">
        <button
          onClick={() => navigateToTab('home')}
          className={`flex flex-col items-center justify-center gap-1 w-20 py-1 transition-colors ${
            activeTab === 'home' ? 'text-white font-bold' : 'hover:text-zinc-200'
          }`}
        >
          <HomeIcon className="w-5.5 h-5.5" />
          <span>Home</span>
        </button>
        <button
          onClick={() => navigateToTab('explore')}
          className={`flex flex-col items-center justify-center gap-1 w-20 py-1 transition-colors ${
            activeTab === 'explore' ? 'text-white font-bold' : 'hover:text-zinc-200'
          }`}
        >
          <Compass className="w-5.5 h-5.5" />
          <span>Explore</span>
        </button>
        <button
          onClick={() => navigateToTab('library')}
          className={`flex flex-col items-center justify-center gap-1 w-20 py-1 transition-colors ${
            activeTab === 'library' ? 'text-white font-bold' : 'hover:text-zinc-200'
          }`}
        >
          <Library className="w-5.5 h-5.5" />
          <span>Library</span>
        </button>
      </div>

    </div>
  );
}
