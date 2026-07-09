import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Track } from '@/types/music-player';
import { Disc } from 'lucide-react';
import { TrackCover } from '../TrackCover';
import { Carousel, ArtistLinks } from './shared';

export const ExploreView: React.FC = () => {
  const { hideExplicit } = usePlayerStore();
  const [exploreCharts, setExploreCharts] = useState<Track[]>([]);
  const [exploreNewReleases, setExploreNewReleases] = useState<Track[]>([]);
  const [exploreLoading, setExploreLoading] = useState(false);

  useEffect(() => {
    const loadExploreData = async () => {
      setExploreLoading(true);
      try {
        const res = await fetch('/api/youtube/explore');
        if (res.ok) {
          const data = await res.json();
          setExploreCharts(data.charts || []);
          setExploreNewReleases(data.newReleases || []);
        }
      } catch (e) {
        console.error('Failed to load explore data:', e);
      } finally {
        setExploreLoading(false);
      }
    };
    loadExploreData();
  }, []);

  return (
    <div className="animate-fade-in space-y-8">
      <h1 className="text-3xl font-extrabold text-white tracking-tight">Explore</h1>

      {exploreLoading ? (
        <div className="space-y-8">
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-bold text-white tracking-tight">New releases</h2>
            <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2 w-full">
              {[...Array(6)].map((_, i) => (
                <div key={`skel-explore-1-${i}`} className="bg-[#0d0d0d] p-3 rounded-lg shadow-lg flex-shrink-0 w-36 sm:w-44 border border-white/5">
                  <div className="aspect-square w-full rounded-md mb-3 bg-white/5 animate-pulse" />
                  <div className="h-3 w-3/4 bg-white/5 animate-pulse rounded mb-2" />
                  <div className="h-2 w-1/2 bg-white/5 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Top charts</h2>
            <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2 w-full">
              {[...Array(6)].map((_, i) => (
                <div key={`skel-explore-2-${i}`} className="bg-[#0d0d0d] p-3 rounded-lg shadow-lg flex-shrink-0 w-36 sm:w-44 border border-white/5">
                  <div className="aspect-square w-full rounded-md mb-3 bg-white/5 animate-pulse" />
                  <div className="h-3 w-3/4 bg-white/5 animate-pulse rounded mb-2" />
                  <div className="h-2 w-1/2 bg-white/5 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* New Releases Section */}
          {exploreNewReleases.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-xl font-bold text-white tracking-tight">New releases</h2>
              <Carousel>
                {(hideExplicit ? exploreNewReleases.filter(t => !t.isExplicit) : exploreNewReleases).map((track) => (
                  <div
                    key={`new-rel-${track.id}`}
                    onClick={() => usePlayerStore.getState().playTrack(track, exploreNewReleases)}
                    className="group bg-[#0d0d0d] hover:bg-[#1a1a1a] p-3 rounded-lg transition-all duration-200 cursor-pointer relative shadow-lg flex-shrink-0 w-36 sm:w-44 snap-start border border-white/5"
                  >
                    <TrackCover track={track} contextTracks={exploreNewReleases} sizeClass="aspect-square w-full rounded-md mb-3" />
                    <h4 className="text-xs font-bold text-white truncate mb-0.5">{track.title}</h4>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5"><ArtistLinks channelTitle={track.channelTitle} channelId={track.channelId} /></p>
                  </div>
                ))}
              </Carousel>
            </div>
          )}

          {/* Top Charts Section */}
          {exploreCharts.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-xl font-bold text-white tracking-tight">Top charts</h2>
              <Carousel>
                {(hideExplicit ? exploreCharts.filter(t => !t.isExplicit) : exploreCharts).map((track) => (
                  <div
                    key={`chart-${track.id}`}
                    onClick={() => usePlayerStore.getState().playTrack(track, exploreCharts)}
                    className="group bg-[#0d0d0d] hover:bg-[#1a1a1a] p-3 rounded-lg transition-all duration-200 cursor-pointer relative shadow-lg flex-shrink-0 w-36 sm:w-44 snap-start border border-white/5"
                  >
                    <TrackCover track={track} contextTracks={exploreCharts} sizeClass="aspect-square w-full rounded-md mb-3" />
                    <h4 className="text-xs font-bold text-white truncate mb-0.5">{track.title}</h4>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5"><ArtistLinks channelTitle={track.channelTitle} channelId={track.channelId} /></p>
                  </div>
                ))}
              </Carousel>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
