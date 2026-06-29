'use client';

import React from 'react';
import { Home as HomeIcon, Compass, Library } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { usePlayerStore } from '@/store/usePlayerStore';

export const MobileBottomNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { setActiveTab, setCurrentPlaylistId, setCurrentChannelId } = usePlayerStore();

  const currentTab = pathname === '/' ? 'home' : pathname === '/explore' ? 'explore' : pathname === '/library' ? 'library' : '';

  const navigateToTab = (tab: 'home' | 'explore' | 'library') => {
    setActiveTab(tab);
    setCurrentPlaylistId(null);
    setCurrentChannelId(null);
    if (tab === 'home') router.push('/');
    else if (tab === 'explore') router.push('/explore');
    else if (tab === 'library') router.push('/library');
  };

  return (
    <div className="md:hidden h-14 bg-[#070707] border-t border-white/5 flex items-center justify-around z-20 flex-shrink-0 text-zinc-400 font-semibold text-[10px]">
      <button
        onClick={() => navigateToTab('home')}
        className={`flex flex-col items-center justify-center gap-1 w-20 py-1 transition-colors ${
          currentTab === 'home' ? 'text-white font-bold' : 'hover:text-zinc-200'
        }`}
      >
        <HomeIcon className="w-5.5 h-5.5" />
        <span>Home</span>
      </button>
      <button
        onClick={() => navigateToTab('explore')}
        className={`flex flex-col items-center justify-center gap-1 w-20 py-1 transition-colors ${
          currentTab === 'explore' ? 'text-white font-bold' : 'hover:text-zinc-200'
        }`}
      >
        <Compass className="w-5.5 h-5.5" />
        <span>Explore</span>
      </button>
      <button
        onClick={() => navigateToTab('library')}
        className={`flex flex-col items-center justify-center gap-1 w-20 py-1 transition-colors ${
          currentTab === 'library' ? 'text-white font-bold' : 'hover:text-zinc-200'
        }`}
      >
        <Library className="w-5.5 h-5.5" />
        <span>Library</span>
      </button>
    </div>
  );
};
