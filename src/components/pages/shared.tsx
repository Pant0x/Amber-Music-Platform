import React from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { cleanVisualName } from '@/utils/text';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const ExplicitBadge = () => (
  <span className="inline-flex items-center justify-center bg-zinc-600/80 text-white text-[9px] font-bold px-1 py-0.5 rounded-sm mx-1.5 leading-none h-[14px]">
    E
  </span>
);

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

  React.useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      setTimeout(checkScroll, 100);
      const observer = new ResizeObserver(() => checkScroll());
      observer.observe(el);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        observer.disconnect();
      };
    }
  }, [children]);

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
    <div className="relative group/carousel w-full">
      {showLeft && (
        <button
          onClick={(e) => { e.stopPropagation(); scroll('left'); }}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/85 hover:bg-black text-white flex items-center justify-center border border-white/10 shadow-lg hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 duration-200"
          title="Scroll Left"
        >
          <ChevronLeft className="w-5 h-5 text-zinc-300 hover:text-white" />
        </button>
      )}
      {showRight && (
        <button
          onClick={(e) => { e.stopPropagation(); scroll('right'); }}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/85 hover:bg-black text-white flex items-center justify-center border border-white/10 shadow-lg hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 duration-200"
          title="Scroll Right"
        >
          <ChevronRight className="w-5 h-5 text-zinc-300 hover:text-white" />
        </button>
      )}
      <div
        ref={containerRef}
        className={`flex overflow-x-auto no-scrollbar pb-2 w-full snap-x snap-mandatory ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

export const renderArtistLinks = (channelTitle: string, channelId?: string, extraClass = "") => {
  const { viewChannel } = usePlayerStore();
  const artistNames = channelTitle
    ? channelTitle.split(/,|\s+&\s+|\s+and\s+/i).map((n: string) => n.trim()).filter(Boolean)
    : [];
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
                viewChannel(cleanName, artistId);
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
