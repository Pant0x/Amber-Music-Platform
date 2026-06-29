import React from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Track } from '@/types/music-player';
import { Play, Pause } from 'lucide-react';

interface TrackCoverProps {
  track: Track;
  contextTracks: Track[];
  sizeClass?: string;
}

export const TrackCover: React.FC<TrackCoverProps> = ({
  track,
  contextTracks,
  sizeClass = "w-12 h-12 rounded shadow"
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const isActive = currentTrack?.id === track.id;
  const isCurrentPlaying = isActive && isPlaying;

  const handlePlayAction = () => {
    if (isActive) {
      togglePlay();
    } else {
      playTrack(track, contextTracks);
    }
  };

  return (
    <div className={`relative ${sizeClass} overflow-hidden group/cover flex-shrink-0 bg-zinc-900 border border-white/5`}>
      <img 
        src={track.thumbnailUrl || undefined} 
        referrerPolicy="no-referrer" 
        alt="" 
        className="w-full h-full object-cover transition-transform duration-300 group-hover/cover:scale-105" 
      />
      <div 
        onClick={(e) => {
          e.stopPropagation();
          handlePlayAction();
        }}
        className={`absolute inset-0 bg-black/45 flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover/cover:opacity-100'
        }`}
      >
        {isCurrentPlaying ? (
          <div className="flex items-center gap-0.75 h-4 justify-center">
            <span className="w-0.75 h-3 bg-[#ff0000] rounded-full animate-bounce-slow" />
            <span className="w-0.75 h-4.5 bg-[#ff0000] rounded-full animate-bounce-normal" />
            <span className="w-0.75 h-2.5 bg-[#ff0000] rounded-full animate-bounce-fast" />
            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded">
              <Pause className="w-5 h-5 fill-current text-white" />
            </div>
          </div>
        ) : isActive ? (
          <Play className="w-5 h-5 fill-current text-[#ff0000]" />
        ) : (
          <Play className="w-5 h-5 fill-current text-white ml-0.5" />
        )}
      </div>
    </div>
  );
};
