import React from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Track } from '@/types/music-player';
import { Play, Pause } from 'lucide-react';
import { isActiveTrack } from './pages/shared';

interface TrackCoverProps {
  track: Track;
  contextTracks: Track[];
  sizeClass?: string;
  noOverlay?: boolean;
}

export const TrackCover: React.FC<TrackCoverProps> = ({
  track,
  contextTracks,
  sizeClass = "w-12 h-12 rounded shadow",
  noOverlay = false
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const isActive = isActiveTrack(currentTrack, track);
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
      {!noOverlay && (
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
            <div className="flex items-end gap-[3px] h-[18px] justify-center pb-[2px]">
              <span style={{ animationPlayState: isCurrentPlaying ? 'running' : 'paused', backgroundColor: 'var(--theme-accent)' }} className="w-[3px] h-3 rounded-t-sm animate-wave-1" />
              <span style={{ animationPlayState: isCurrentPlaying ? 'running' : 'paused', backgroundColor: 'var(--theme-accent)' }} className="w-[3px] h-[18px] rounded-t-sm animate-wave-2" />
              <span style={{ animationPlayState: isCurrentPlaying ? 'running' : 'paused', backgroundColor: 'var(--theme-accent)' }} className="w-[3px] h-[10px] rounded-t-sm animate-wave-3" />
              <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                <Pause className="w-5 h-5 fill-current text-white" />
              </div>
            </div>
          ) : isActive ? (
            <Play className="w-5 h-5 fill-current" style={{ color: 'var(--theme-accent)' }} />
          ) : (
            <Play className="w-5 h-5 fill-current text-white ml-0.5" />
          )}
        </div>
      )}
    </div>
  );
};
