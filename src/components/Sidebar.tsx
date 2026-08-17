'use client';

import React, { useState } from 'react';
import { Home, Compass, Library, Plus, Music, Heart, User, Star, ExternalLink } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { usePlayerStore } from '@/store/usePlayerStore';

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [playlistNameInput, setPlaylistNameInput] = useState('');

  const {
    playlists,
    likedTracks,
    createPlaylist,
    setShowNowPlaying,
    displayName,
    avatarUrl,
    onboardingCompleted,
    setOnboardingCompleted
  } = usePlayerStore();

  const handlePlaylistCreate = () => {
    setIsCreatingPlaylist(true);
    setPlaylistNameInput('');
  };

  const handlePlaylistNameSubmit = () => {
    const name = playlistNameInput.trim();
    if (name) {
      createPlaylist(name);
    }
    setIsCreatingPlaylist(false);
    setPlaylistNameInput('');
  };

  const handleStartOnboarding = () => {
    setOnboardingCompleted(true);
  };

  const NavItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => {
    const isActive = pathname === path;
    return (
      <button
        onClick={() => {
          setShowNowPlaying(false);
          router.push(path);
        }}
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
        <Star className="w-6 h-6 text-[#E88EAC] fill-current" />
        <h1 className="text-lg font-bold tracking-tight text-white leading-none mt-1">Sonora</h1>
      </div>

      {/* 1. Main Navigation Items */}
      <div className="flex-shrink-0 mb-6">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-3 block mb-2">Explore</span>
        <nav className="flex flex-col gap-0.5">
          <NavItem icon={Home} label="Home" path="/" />
          <NavItem icon={Compass} label="Browse" path="/explore" />
        </nav>
      </div>

      <div className="flex-shrink-0 mb-6">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-3 block mb-2">Library</span>
        <nav className="flex flex-col gap-0.5">
          <NavItem icon={Library} label="Recently Added" path="/library" />
          <NavItem icon={Heart} label="Liked Songs" path="/liked" />
          {!onboardingCompleted && (
            <button
              onClick={handleStartOnboarding}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-[13px] transition-all duration-200 w-full text-zinc-400 hover:text-white hover:bg-white/5 font-normal"
            >
              <User className="w-4 h-4" />
              Onboard
            </button>
          )}
        </nav>
      </div>

      {/* 2. Playlist Utilities & Playlists */}
      <div className="flex flex-col gap-1 flex-1 min-h-0">
        <div className="flex items-center justify-between px-3 mb-1 flex-shrink-0 group cursor-pointer" onClick={handlePlaylistCreate}>
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">Playlists</span>
          <Plus className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
        </div>

        {/* Inline playlist name input (window.prompt is unavailable in Electron) */}
        {isCreatingPlaylist && (
          <div className="px-3 pb-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={playlistNameInput}
              onChange={(e) => setPlaylistNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePlaylistNameSubmit();
                if (e.key === 'Escape') setIsCreatingPlaylist(false);
              }}
              onBlur={handlePlaylistNameSubmit}
              placeholder="Playlist name..."
              maxLength={80}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[13px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-[var(--theme-accent)]"
            />
          </div>
        )}

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

    </aside>
  );
};