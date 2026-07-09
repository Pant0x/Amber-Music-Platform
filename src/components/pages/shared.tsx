import React from 'react';
import { Track } from '@/types/music-player';
import { usePlayerStore } from '@/store/usePlayerStore';
import { cleanVisualName, splitArtistNames } from '@/utils/text';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const ExplicitBadge = () => null;

export const Carousel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = 'gap-4' }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = React.useState(false);
  const [showRight, setShowRight] = React.useState(true);

  const checkScroll = () => {
    const el = containerRef.current;
    if (el) {
      setShowLeft(el.scrollLeft > 5);
      setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }
  };

  const firstChildKey = (React.Children.toArray(children)[0] as React.ReactElement)?.key;
  
  React.useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollLeft = 0; // Reset scroll on new content
      el.addEventListener('scroll', checkScroll);
      checkScroll();
      // Wait for images to load
      const timer = setTimeout(checkScroll, 500);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        clearTimeout(timer);
      };
    }
  }, [firstChildKey]);

  const scroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.75;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative group/carousel">
      {showLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center border border-white/10 opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-lg"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {showRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center border border-white/10 opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-lg"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
      <div
        ref={containerRef}
        className={`flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar select-none ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

interface ArtistLinksProps {
  channelTitle: string;
  channelId?: string;
  extraClass?: string;
}

export const ArtistLinks: React.FC<ArtistLinksProps> = ({
  channelTitle,
  channelId,
  extraClass = ""
}) => {
  const router = useRouter();
  const artistNames = splitArtistNames(channelTitle);
  if (artistNames.length === 0) return <span className="text-zinc-500">Unknown Artist</span>;

  return (
    <span className={`inline-block truncate ${extraClass}`}>
      {artistNames.map((name: string, idx: number) => {
        const cleanName = cleanVisualName(name);
        return (
          <React.Fragment key={name}>
            {idx > 0 && <span className="text-zinc-500">, </span>}
            <span
              onClick={(e) => {
                e.stopPropagation();
                const artistId = idx === 0 ? channelId : undefined;
                router.push(`/artist/${encodeURIComponent(artistId || cleanName)}`);
              }}
              className="hover:underline hover:text-white cursor-pointer"
            >
              {cleanName}
            </span>
          </React.Fragment>
        );
      })}
    </span>
  );
};

export const PlayingEqualizer: React.FC<{ isPlaying: boolean; color?: string }> = ({ isPlaying, color = '#ff0000' }) => {
  return (
    <div className="flex items-end gap-[2px] h-[14px] w-[12px] justify-center flex-shrink-0">
      <div 
        style={{ animationPlayState: isPlaying ? 'running' : 'paused', backgroundColor: color }} 
        className="w-[2px] h-1 bg-[#ff0000] rounded-t-sm animate-wave-1" 
      />
      <div 
        style={{ animationPlayState: isPlaying ? 'running' : 'paused', backgroundColor: color }} 
        className="w-[2px] h-2 bg-[#ff0000] rounded-t-sm animate-wave-2" 
      />
      <div 
        style={{ animationPlayState: isPlaying ? 'running' : 'paused', backgroundColor: color }} 
        className="w-[2px] h-1.5 bg-[#ff0000] rounded-t-sm animate-wave-3" 
      />
    </div>
  );
};

export const isActiveTrack = (currentTrack: Track | null, track: Track) => {
  if (!currentTrack) return false;
  return (
    currentTrack.id === track.id ||
    (currentTrack.youtubeId && currentTrack.youtubeId === track.id) ||
    (track.youtubeId && track.youtubeId === currentTrack.id) ||
    (currentTrack.youtubeId && track.youtubeId && currentTrack.youtubeId === track.youtubeId) ||
    (currentTrack.title.toLowerCase() === track.title.toLowerCase() && 
     currentTrack.channelTitle.toLowerCase() === track.channelTitle.toLowerCase())
  );
};

