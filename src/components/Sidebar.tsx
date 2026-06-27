'use client';

import React from 'react';
import { Home, Compass, Library, Plus, Music, Heart } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    playlists,
    likedTracks,
    currentPlaylistId,
    setCurrentPlaylistId,
    createPlaylist,
    setCurrentChannelId
  } = usePlayerStore();

  const handlePlaylistCreate = () => {
    const playlistName = prompt('Enter playlist name:');
    if (playlistName !== null) {
      createPlaylist(playlistName);
    }
  };

  const navigateToTab = (tab: 'home' | 'explore' | 'library' | 'liked') => {
    setActiveTab(tab);
    setCurrentPlaylistId(null);
    setCurrentChannelId(null);
  };

  return (
    <aside className="w-[240px] bg-[#030303] flex flex-col gap-4 select-none h-full flex-shrink-0 text-zinc-400 font-semibold p-4 border-r border-white/5">
      
      {/* 1. Main Navigation Items */}
      <nav className="flex flex-col gap-1">
        <button
          onClick={() => navigateToTab('home')}
          className={`flex items-center gap-4 px-4 py-2.5 rounded-lg text-sm transition-colors duration-150 hover:bg-[#1a1a1a] hover:text-white ${
            activeTab === 'home' ? 'bg-[#1a1a1a] text-white font-bold' : ''
          }`}
        >
          <Home className="w-5 h-5" />
          Home
        </button>
        <button
          onClick={() => navigateToTab('explore')}
          className={`flex items-center gap-4 px-4 py-2.5 rounded-lg text-sm transition-colors duration-150 hover:bg-[#1a1a1a] hover:text-white ${
            activeTab === 'explore' ? 'bg-[#1a1a1a] text-white font-bold' : ''
          }`}
        >
          <Compass className="w-5 h-5" />
          Explore
        </button>
        <button
          onClick={() => navigateToTab('library')}
          className={`flex items-center gap-4 px-4 py-2.5 rounded-lg text-sm transition-colors duration-150 hover:bg-[#1a1a1a] hover:text-white ${
            activeTab === 'library' ? 'bg-[#1a1a1a] text-white font-bold' : ''
          }`}
        >
          <Library className="w-5 h-5" />
          Library
        </button>
      </nav>

      {/* Divider */}
      <div className="h-[1px] bg-white/5 mx-2"></div>

      {/* 2. Playlist Utilities */}
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        <button
          onClick={handlePlaylistCreate}
          className="flex items-center gap-4 px-4 py-2.5 rounded-full text-sm bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] transition-colors font-bold w-fit ml-2"
        >
          <Plus className="w-4 h-4" />
          New playlist
        </button>

        {/* Scrollable Playlist Sub-list */}
        <div className="flex-1 overflow-y-auto space-y-1 mt-2 custom-scrollbar">
          {/* Liked Music Shortcut */}
          <div
            onClick={() => navigateToTab('liked')}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors duration-150 ${
              activeTab === 'liked' ? 'bg-[#1a1a1a] text-white' : 'hover:bg-[#0d0d0d]'
            }`}
          >
            <div className="w-9 h-9 rounded bg-gradient-to-br from-[#ff0000] to-[#b30000] flex items-center justify-center flex-shrink-0 shadow-md">
              <Heart className="w-4.5 h-4.5 text-white fill-current animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">Liked Music</p>
              <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                Auto Playlist • {likedTracks.length} songs
              </p>
            </div>
          </div>

          {/* User Custom Playlists */}
          {playlists.map((playlist) => {
            const isCurrent = activeTab === 'playlist' && currentPlaylistId === playlist.id;
            return (
              <div
                key={playlist.id}
                onClick={() => {
                  setCurrentPlaylistId(playlist.id);
                  setCurrentChannelId(null);
                  setActiveTab('playlist');
                }}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors duration-150 ${
                  isCurrent ? 'bg-[#1a1a1a] text-white' : 'hover:bg-[#0d0d0d]'
                }`}
              >
                <div className="w-9 h-9 rounded bg-[#1f1f1f] flex items-center justify-center flex-shrink-0 shadow-md border border-white/5">
                  <Music className="w-4.5 h-4.5 text-zinc-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{playlist.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                    Playlist • {playlist.tracks.length} songs
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
