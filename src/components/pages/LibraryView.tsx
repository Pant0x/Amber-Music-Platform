import React from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Heart, Music } from 'lucide-react';

export const LibraryView: React.FC = () => {
  const {
    playlists,
    likedTracks,
    setActiveTab,
    setCurrentPlaylistId
  } = usePlayerStore();

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-3xl font-extrabold text-white tracking-tight">Library</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight">Playlists</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          
          {/* Liked songs card */}
          <div
            onClick={() => {
              setActiveTab('liked');
              setCurrentPlaylistId(null);
            }}
            className="group bg-[#0d0d0d] hover:bg-[#1a1a1a] p-4 rounded-lg transition-all duration-200 cursor-pointer shadow-lg relative"
          >
            <div className="aspect-square w-full rounded bg-gradient-to-br from-[#ff0000] to-[#b30000] flex items-center justify-center mb-3">
              <Heart className="w-12 h-12 text-white fill-current" />
            </div>
            <h4 className="text-xs font-bold text-white truncate mb-0.5">Liked Music</h4>
            <p className="text-[10px] text-zinc-400">Playlist • {likedTracks.length} songs</p>
          </div>

          {/* User playlists */}
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => {
                setCurrentPlaylistId(pl.id);
                setActiveTab('playlist');
              }}
              className="group bg-[#0d0d0d] hover:bg-[#1a1a1a] p-4 rounded-lg transition-all duration-200 cursor-pointer shadow-lg relative border border-white/5"
            >
              <div className="aspect-square w-full rounded bg-[#1f1f1f] flex items-center justify-center mb-3">
                <Music className="w-10 h-10 text-zinc-600" />
              </div>
              <h4 className="text-xs font-bold text-white truncate mb-0.5">{pl.name}</h4>
              <p className="text-[10px] text-zinc-400">Playlist • {pl.tracks.length} songs</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
