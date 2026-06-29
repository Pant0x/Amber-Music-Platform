'use client';

import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Track } from '@/types/music-player';

interface AlbumCoverPlayOverlayProps {
  item: {
    id: string;
    title: string;
    type?: string;
    thumbnailUrl?: string;
    channelTitle?: string;
  };
  contextTracks?: any[];
}

export const AlbumCoverPlayOverlay: React.FC<AlbumCoverPlayOverlayProps> = ({ item, contextTracks }) => {
  const { playTrack } = usePlayerStore();
  const [loading, setLoading] = useState(false);

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If it's a single track/song card
    if (item.type === 'music' || (!item.id.startsWith('VL') && !item.id.startsWith('PL') && !item.id.startsWith('MPRE'))) {
      const track: Track = {
        id: item.id,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl || '',
        channelTitle: item.channelTitle || 'Unknown Artist',
        publishedAt: '',
        type: item.type as any,
        origin: 'youtube'
      };
      playTrack(track, contextTracks || [track]);
      return;
    }

    // Otherwise, fetch album/playlist tracks dynamically
    setLoading(true);
    try {
      const res = await fetch(`/api/youtube/playlist?id=${item.id}`);
      if (res.ok) {
        const data = await res.json();
        const tracks = data.tracks || [];
        if (tracks.length > 0) {
          playTrack(tracks[0], tracks);
        }
      }
    } catch (err) {
      console.error('Failed to play album tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-10">
      <button
        onClick={handlePlayClick}
        disabled={loading}
        className="w-12 h-12 rounded-full bg-[#ff0000] hover:bg-[#cc0000] flex items-center justify-center text-white shadow-2xl scale-75 group-hover:scale-100 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        aria-label={`Play ${item.title}`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        ) : (
          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
        )}
      </button>
    </div>
  );
};
