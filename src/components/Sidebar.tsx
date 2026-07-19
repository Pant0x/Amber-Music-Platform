'use client';

import React from 'react';
import { Home, Compass, Library, Plus, Music, Heart, User, Star, FileAudio } from 'lucide-react';
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

  const NavItem = ({ tab, icon: Icon, label, path }: { tab: any, icon: any, label: string, path: string }) => {
    const isActive = pathname === path;
    return (
      <button
        onClick={() => navigateToTab(tab)}
        className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-[13px] transition-all duration-200 group w-full ${
          isActive ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-white/5 font-normal'
        }`}
      >
        <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[var(--theme-accent)]' : 'text-zinc-400 group-hover:text-white'}`} />
        {label}
      </button>
    );
  };

  return (
    <aside 
      className="hidden md:flex w-[240px] flex-col select-none h-full flex-shrink-0 p-4 transition-all duration-1000 bg-black/20 backdrop-blur-3xl border-r border-white/5"
    >
      
      {/* Brand Header */}
      <div className="flex items-center gap-2 px-3 py-4 mb-4 flex-shrink-0">
        <Star className="w-6 h-6 text-[#ff0000] fill-current" />
        <h1 className="text-lg font-bold tracking-tight text-white leading-none mt-1">Pantooty</h1>
      </div>

      {/* 1. Main Navigation Items */}
      <div className="flex-shrink-0 mb-6">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-3 block mb-2">Pantooty</span>
        <nav className="flex flex-col gap-0.5">
          <NavItem tab="home" icon={Home} label="Home" path="/" />
          <NavItem tab="explore" icon={Compass} label="Browse" path="/explore" />
        </nav>
      </div>

      <div className="flex-shrink-0 mb-6">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-3 block mb-2">Library</span>
        <nav className="flex flex-col gap-0.5">
          <NavItem tab="library" icon={Library} label="Recently Added" path="/library" />
          <NavItem tab="liked" icon={Heart} label="Liked Songs" path="/liked" />
          <NavItem tab="library" icon={FileAudio} label="My Files" path="/files" />
        </nav>
      </div>

      {/* 2. Playlist Utilities & Playlists */}
      <div className="flex flex-col gap-1 flex-1 min-h-0">
        <div className="flex items-center justify-between px-3 mb-1 flex-shrink-0 group cursor-pointer" onClick={handlePlaylistCreate}>
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">Playlists</span>
          <Plus className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
        </div>

        {/* Scrollable Playlist Sub-list */}
        <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar pb-4">
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 group ${
                  isCurrent ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] truncate ${isCurrent ? 'text-[var(--theme-accent)] font-medium' : 'text-zinc-400 group-hover:text-white font-normal'}`}>
                    {playlist.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Profile Card Pinned at Bottom */}
      <div className="mt-auto pt-4 flex-shrink-0">
        <div 
          onClick={() => { setShowNowPlaying(false); router.push('/profile'); }}
          className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-all border border-white/5"
        >
          <img 
            src={avatarUrl || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} 
            className="w-8 h-8 rounded-full object-cover border border-white/10" 
            alt="Avatar" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-white truncate leading-tight">{displayName || 'Anonymous Listener'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
