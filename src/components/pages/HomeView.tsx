import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Track } from '@/types/music-player';
import { Disc } from 'lucide-react';
import { TrackCover } from '../TrackCover';
import { Carousel, ArtistLinks, isActiveTrack } from './shared';

const MOOD_CHIPS = [
  { id: 'focus', label: 'Focus' },
  { id: 'energize', label: 'Energize' },
  { id: 'relax', label: 'Relax' },
  { id: 'commute', label: 'Commute' },
  { id: 'workout', label: 'Workout' }
];

export const HomeView: React.FC = () => {
  const {
    history,
    searchHistory,
    selectedMood,
    setSelectedMood
  } = usePlayerStore();

  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);

  const loadRecommendations = async () => {
    setRecsLoading(true);
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: history.map(t => ({ id: t.id, title: t.title, channelTitle: t.channelTitle })),
          searchHistory,
          mood: selectedMood
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          setRecommendations(data.items);
          setRecsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to resolve recommendations:', e);
    }
    setRecommendations([]);
    setRecsLoading(false);
  };

  useEffect(() => {
    loadRecommendations();
  }, [selectedMood, history.length, searchHistory.length]);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Mood/Filter Chips */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
        {MOOD_CHIPS.map((chip) => {
          const isSelected = selectedMood === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setSelectedMood(isSelected ? 'none' : chip.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border border-white/10 ${
                isSelected
                  ? 'bg-white text-black border-white'
                  : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Quick Picks grid (YT Music layout) */}
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Start Radio from a song</p>
            <h2 className="text-xl font-bold text-white tracking-tight">Quick picks</h2>
          </div>
          <button
            onClick={loadRecommendations}
            className="text-xs font-bold text-zinc-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/5"
          >
            Refresh
          </button>
        </div>

        {recsLoading ? (
          <div className="flex overflow-x-auto no-scrollbar gap-x-6 pb-2 w-full">
            {[...Array(4)].map((_, groupIdx) => (
              <div key={`skel-group-${groupIdx}`} className="flex-shrink-0 w-[calc(100%-24px)] md:w-[calc(50%-24px)] lg:w-[calc(33.33%-24px)] xl:w-[calc(25%-24px)] space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={`skel-${groupIdx}-${i}`} className="flex items-center gap-3 p-2 rounded-md border border-white/0">
                    <div className="w-12 h-12 rounded bg-white/5 animate-pulse flex-shrink-0" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-3 w-3/4 bg-white/5 animate-pulse rounded" />
                      <div className="h-2 w-1/2 bg-white/5 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-500 font-semibold">
            No recommendations resolved. Select a song or check search to build history.
          </div>
        ) : (() => {
          // Split recommendations.slice(0, 16) into groups of 4 for vertical rows inside horizontal column groups
          const quickPicksGroups = [];
          const recSlice = recommendations.slice(0, 16);
          for (let i = 0; i < recSlice.length; i += 4) {
            quickPicksGroups.push(recSlice.slice(i, i + 4));
          }

          return (
            <div className="flex overflow-x-auto no-scrollbar gap-x-6 pb-2 w-full snap-x snap-mandatory">
              {quickPicksGroups.map((group, groupIdx) => (
                <div key={`qp-group-${groupIdx}`} className="flex-shrink-0 w-[calc(100%-24px)] md:w-[calc(50%-24px)] lg:w-[calc(33.33%-24px)] xl:w-[calc(25%-24px)] space-y-3 snap-start">
                  {group.map((track) => {
                    const isActive = isActiveTrack(usePlayerStore.getState().currentTrack, track);
                    return (
                      <div
                        key={`qp-${track.id}`}
                        onClick={() => usePlayerStore.getState().playTrack(track, recommendations)}
                        className={`group flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer ${
                          isActive ? 'bg-white/5' : ''
                        }`}
                      >
                        <TrackCover track={track} contextTracks={recommendations} sizeClass="w-12 h-12 rounded" />
                        
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                            {track.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5"><ArtistLinks channelTitle={track.channelTitle} channelId={track.channelId} /></p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Shelves A: Listen Again */}
      {history.length > 0 && (
        <div className="space-y-4 pt-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Listen again</h2>
          <Carousel>
            {history
              .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
              .slice(0, 12)
              .map((track) => (
                <div
                  key={`la-${track.id}`}
                  onClick={() => usePlayerStore.getState().playTrack(track, history)}
                  className="group bg-[#0d0d0d] hover:bg-[#1a1a1a] p-3 rounded-lg transition-all duration-200 cursor-pointer relative shadow-lg flex-shrink-0 w-36 sm:w-44 snap-start border border-white/5"
                >
                  <TrackCover track={track} contextTracks={history} sizeClass="aspect-square w-full rounded-md mb-3" />
                  <h4 className="text-xs font-bold text-white truncate mb-0.5">{track.title}</h4>
                  <p className="text-[10px] text-zinc-400 truncate mt-0.5"><ArtistLinks channelTitle={track.channelTitle} channelId={track.channelId} /></p>
                </div>
              ))}
          </Carousel>
        </div>
      )}

      {/* Shelves B: Mixed For You */}
      {recommendations.length > 8 && (
        <div className="space-y-4 pt-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Mixed for you</h2>
          <Carousel>
            {recommendations.slice(8, 20).map((track) => (
              <div
                key={`mix-${track.id}`}
                onClick={() => usePlayerStore.getState().playTrack(track, recommendations)}
                className="group bg-[#0d0d0d] hover:bg-[#1a1a1a] p-3 rounded-lg transition-all duration-200 cursor-pointer relative shadow-lg flex-shrink-0 w-36 sm:w-44 snap-start border border-white/5"
              >
                <TrackCover track={track} contextTracks={recommendations} sizeClass="aspect-square w-full rounded-md mb-3" />
                <h4 className="text-xs font-bold text-white truncate mb-0.5">{track.title}</h4>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5"><ArtistLinks channelTitle={track.channelTitle} channelId={track.channelId} /></p>
              </div>
            ))}
          </Carousel>
        </div>
      )}
    </div>
  );
};
