import React from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Heart, Music } from 'lucide-react';
import { AlbumCoverPlayOverlay } from '../AlbumCoverPlayOverlay';
import { useRouter } from 'next/navigation';
import { AnimatedPage, HoverCard } from '../AnimatedPage';

export const LibraryView: React.FC = () => {
  const router = useRouter();
  const {
    playlists,
    likedTracks,
    setActiveTab,
    setCurrentPlaylistId
  } = usePlayerStore();

  return (
    <AnimatedPage className="space-y-6 pt-6">
      <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-8">Recently Added</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight">Playlists</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          
          {/* Liked songs card */}
          <HoverCard
            className="group bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg relative border border-white/5 hover:scale-[1.02]"
          >
            <div
              onClick={() => {
                router.push('/liked');
              }}
            >
              <div className="aspect-square w-full rounded-xl bg-gradient-to-br from-[#ff0000] to-[#b30000] flex items-center justify-center mb-4 relative overflow-hidden shadow-md">
                <Heart className="w-12 h-12 text-white fill-current" />
                <AlbumCoverPlayOverlay item={{ id: 'liked', title: 'Liked Music', type: 'playlist' }} contextTracks={likedTracks} />
              </div>
              <h4 className="text-xs font-bold text-white truncate mb-0.5">Liked Music</h4>
              <p className="text-[10px] text-zinc-400">Playlist • {likedTracks.length} songs</p>
            </div>
          </HoverCard>

          {/* User playlists */}
          {playlists.map((pl) => (
            <HoverCard
              key={pl.id}
              className="group bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg relative border border-white/5 hover:scale-[1.02]"
            >
              <div
                onClick={() => {
                  router.push(`/playlist/${pl.id}`);
                }}
              >
                <div className="aspect-square w-full rounded-xl bg-[#1f1f1f] flex items-center justify-center mb-4 relative overflow-hidden shadow-md">
                  <Music className="w-10 h-10 text-zinc-600" />
                  <AlbumCoverPlayOverlay item={{ id: pl.id, title: pl.name, type: 'playlist' }} contextTracks={pl.tracks} />
                </div>
                <h4 className="text-xs font-bold text-white truncate mb-0.5">{pl.name}</h4>
                <p className="text-[10px] text-zinc-400">Playlist • {pl.tracks.length} songs</p>
              </div>
            </HoverCard>
          ))}
        </div>
      </div>
    </AnimatedPage>
  );
};
