'use client';

import React from 'react';
import { Home, Compass, Library, Plus, Music, Heart, User, Cloud } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { usePlayerStore } from '@/store/usePlayerStore';

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  
  const {
    playlists,
    likedTracks,
    createPlaylist,
    setShowNowPlaying,
    displayName,
    avatarUrl
  } = usePlayerStore();

  const handlePlaylistCreate = () => {
    const playlistName = prompt('Enter playlist name:');
    if (playlistName !== null) {
      createPlaylist(playlistName);
    }
  };

  const navigateToTab = (tab: 'home' | 'explore' | 'library' | 'liked') => {
    setShowNowPlaying(false);
    if (tab === 'liked') {
      router.push('/liked');
    } else {
      router.push(tab === 'home' ? '/' : `/${tab}`);
    }
  };

  return (
    <aside 
      className="hidden md:flex w-[240px] flex-col select-none h-full flex-shrink-0 text-zinc-400 font-semibold p-4 border-r transition-all duration-1000"
      style={{ background: 'var(--theme-sidebar-bg, #120d0d)', borderRightColor: 'var(--theme-border)' }}
    >
      
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-3 mb-2 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-zinc-950 shadow-md">
          <Cloud className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="text-base font-black tracking-tight text-white leading-none">Cloud Music</h1>
          <span className="text-[10px] text-zinc-500 font-medium mt-1 block">Premium listening</span>
        </div>
      </div>

      {/* 1. Main Navigation Items */}
      <div className="flex-shrink-0">
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider px-2 block mb-2">Browse</span>
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => navigateToTab('home')}
            className={`flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 hover:text-white ${
              pathname === '/' ? 'bg-[#2b1f1f] text-white font-bold' : 'hover:bg-white/5'
            }`}
          >
            <Home className="w-4.5 h-4.5" />
            Home
          </button>
          <button
            onClick={() => navigateToTab('explore')}
            className={`flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 hover:text-white ${
              pathname === '/explore' ? 'bg-[#2b1f1f] text-white font-bold' : 'hover:bg-white/5'
            }`}
          >
            <Compass className="w-4.5 h-4.5" />
            Explore
          </button>
          <button
            onClick={() => navigateToTab('library')}
            className={`flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 hover:text-white ${
              pathname === '/library' ? 'bg-[#2b1f1f] text-white font-bold' : 'hover:bg-white/5'
            }`}
          >
            <Library className="w-4.5 h-4.5" />
            Library
          </button>
          <button
            onClick={() => navigateToTab('liked')}
            className={`flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 hover:text-white ${
              pathname === '/liked' ? 'bg-[#2b1f1f] text-white font-bold' : 'hover:bg-white/5'
            }`}
          >
            <Heart className="w-4.5 h-4.5" />
            Liked Songs
          </button>
        </nav>
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-white/5 mx-2 my-2 flex-shrink-0"></div>

      {/* 2. Playlist Utilities & Playlists */}
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        <div className="flex items-center justify-between px-2 mb-1 flex-shrink-0">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block">Collections</span>
          <button
            onClick={handlePlaylistCreate}
            className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
            title="Create Playlist"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Playlist Sub-list */}
        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
          {/* User Custom Playlists */}
          {playlists.map((playlist) => {
            const isCurrent = pathname === `/playlist/${playlist.id}`;
            return (
              <div
                key={playlist.id}
                onClick={() => {
                  setShowNowPlaying(false);
                  router.push(`/playlist/${playlist.id}`);
                }}
                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  isCurrent ? 'bg-[#2b1f1f] text-white font-bold' : 'hover:bg-white/5'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0 shadow-md border border-white/5">
                  <Music className="w-4.5 h-4.5 text-zinc-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{playlist.name}</p>
                  <p className="text-[10px] text-zinc-550 truncate mt-0.5 font-medium">
                    Playlist • {playlist.tracks.length} songs
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Profile Card Pinned at Bottom */}
      <div className="mt-auto pt-3 border-t border-white/5 flex-shrink-0">
        <div 
          onClick={() => { setShowNowPlaying(false); router.push('/profile'); }}
          className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer bg-[#1c1414] hover:bg-[#281d1d] border border-white/5 transition-all shadow-lg"
        >
          <img 
            src={avatarUrl || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} 
            className="w-9 h-9 rounded-full object-cover border border-white/10" 
            alt="Avatar" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate leading-tight">{displayName || 'George Miles'}</p>
            <p className="text-[10px] text-zinc-500 font-semibold truncate mt-0.5">Premium member</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
