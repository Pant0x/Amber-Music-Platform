'use client';

import React from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { HomeView } from './pages/HomeView';
import { ExploreView } from './pages/ExploreView';
import { LibraryView } from './pages/LibraryView';
import { SearchView } from './pages/SearchView';
import { PlaylistView } from './pages/PlaylistView';
import { ArtistView } from './pages/ArtistView';

export const MainDashboard: React.FC = () => {
  const { activeTab } = usePlayerStore();

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 select-none bg-[#030303] custom-scrollbar relative">
      {/* Dynamic Ambient Background Lights */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#ff0000]/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#0055ff]/4 blur-[150px] pointer-events-none z-0" />
      
      <div className="relative z-10">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'explore' && <ExploreView />}
        {activeTab === 'library' && <LibraryView />}
        {activeTab === 'search' && <SearchView />}
        {activeTab === 'playlist' && <PlaylistView mode="custom" />}
        {activeTab === 'liked' && <PlaylistView mode="liked" />}
        {activeTab === 'channel' && <ArtistView />}
      </div>
    </div>
  );
};
