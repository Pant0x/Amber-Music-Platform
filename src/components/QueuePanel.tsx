'use client';

import React from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Trash, X, Play, ListMusic, History } from 'lucide-react';
import { Track } from '@/types/music-player';
import { cleanVisualName, parseFeaturedArtists, splitArtistNames } from '@/utils/text';
import { ExplicitBadge } from './pages/shared';

export const QueuePanel: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    queue,
    history,
    showQueuePanel,
    toggleQueuePanel,
    removeFromQueue,
    clearQueue,
    playTrack,
    viewChannel
  } = usePlayerStore();

  if (!showQueuePanel) return null;

  const handleTrackClick = (track: Track, context?: Track[]) => {
    playTrack(track, context);
  };

  return (
    <aside className="w-80 bg-[#121212] rounded-lg h-full flex flex-col overflow-hidden select-none relative z-20 flex-shrink-0 animate-slide-in">
      
      {/* Header Panel */}
      <div className="h-16 px-5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">
            Play Queue
          </h3>
          <span className="text-[10px] font-bold bg-[#242424] px-2 py-0.5 rounded-full text-zinc-400">
            {queue.length}
          </span>
        </div>
        <button
          onClick={toggleQueuePanel}
          className="p-1 rounded-full hover:bg-[#242424] text-zinc-400 hover:text-white transition-all"
          title="Close Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Lists Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        
        {/* Section A: Currently Playing */}
        {currentTrack && (
          <div>
            <h4 className="text-xs font-bold text-zinc-400 mb-3">
              Now playing
            </h4>
            <div className="p-3 bg-[#181818] hover:bg-[#282828] rounded-md flex items-center gap-3 transition-colors duration-200 group border border-white/5">
              <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden">
                <img
                  src={currentTrack.thumbnailUrl   || undefined}
                  referrerPolicy="no-referrer"
                  alt=""
                  className="w-full h-full object-cover"
                />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex items-end gap-0.5 h-3">
                      <span className="w-0.5 bg-[#ff0000] rounded animate-wave-1 h-3"></span>
                      <span className="w-0.5 bg-[#ff0000]/80 rounded animate-wave-2 h-2"></span>
                      <span className="w-0.5 bg-[#ff0000]/55 rounded animate-wave-3 h-1"></span>
                    </div>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {(() => {
                  const parsed = parseFeaturedArtists(currentTrack.title);
                  return (
                    <>
                      <p className="text-sm font-bold text-white truncate hover:underline cursor-pointer">
                        {parsed.title}
                      </p>
                      {parsed.featured.length > 0 && (
                        <p className="text-[10px] text-zinc-500 truncate font-medium leading-none mb-0.5">
                          feat.{' '}
                          {parsed.featured.map((featName, idx) => (
                            <React.Fragment key={featName}>
                              {idx > 0 && ', '}
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewChannel(featName);
                                }}
                                className="hover:underline hover:text-white cursor-pointer"
                              >
                                {featName}
                              </span>
                            </React.Fragment>
                          ))}
                        </p>
                      )}
                    </>
                  );
                })()}
                <p className="text-xs text-zinc-400 truncate mt-0.5 font-medium">
                  {(() => {
                    const artistNames = currentTrack.channelTitle
                      ? currentTrack.channelTitle.split(/,|\s+&\s+|\s+and\s+/i).map((n: string) => n.trim()).filter(Boolean)
                      : [];
                    if (artistNames.length === 0) return 'Unknown Artist';
                    return artistNames.map((name: string, idx: number) => {
                      const cleanName = cleanVisualName(name);
                      return (
                        <React.Fragment key={name}>
                          {idx > 0 && <span className="text-zinc-500">, </span>}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              const artistId = idx === 0 ? currentTrack.channelId || currentTrack.artistId : undefined;
                              viewChannel(cleanName, artistId);
                            }}
                            className="hover:underline hover:text-white cursor-pointer"
                          >
                            {cleanName}
                          </span>
                        </React.Fragment>
                      );
                    });
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section B: Next Up Queue */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-zinc-400">
              Next in queue
            </h4>
            {queue.length > 0 && (
               <button
                 onClick={clearQueue}
                 className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 font-bold"
               >
                 <Trash className="w-3.5 h-3.5" /> Clear queue
               </button>
            )}
          </div>

          <div className="space-y-1">
            {queue.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 italic border border-dashed border-white/5 rounded-lg">
                Queue is empty
              </div>
            ) : (
              queue.slice(0, 20).map((track, index) => (
                <div
                  key={`${track.id}-${index}`}
                  className="group/item flex items-center justify-between p-2 rounded-md hover:bg-[#1a1a1a] transition-colors"
                >
                  <div
                    onClick={() => handleTrackClick(track, queue)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <span className="text-xs font-bold text-zinc-500 w-4 text-center group-hover/item:text-white">
                      {index + 1}
                    </span>
                    <img
                      src={track.thumbnailUrl   || undefined}
                      referrerPolicy="no-referrer"
                      alt=""
                      className="w-10 h-10 object-cover rounded bg-[#242424] flex-shrink-0 shadow-md border border-white/5"
                    />
                    <div className="min-w-0 flex-1">
                      {(() => {
                        const parsed = parseFeaturedArtists(track.title);
                        return (
                          <>
                            <p className="text-sm font-bold text-white truncate">
                              {parsed.title}
                              {track.isExplicit && <ExplicitBadge />}
                            </p>
                            {parsed.featured.length > 0 && (
                              <p className="text-[10px] text-zinc-500 truncate font-medium mt-0.5">
                                feat.{' '}
                                {parsed.featured.map((featName, idx) => (
                                  <React.Fragment key={featName}>
                                    {idx > 0 && ', '}
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        viewChannel(featName);
                                      }}
                                      className="hover:underline hover:text-white cursor-pointer"
                                    >
                                      {featName}
                                    </span>
                                  </React.Fragment>
                                ))}
                              </p>
                            )}
                          </>
                        );
                      })()}
                      <p className="text-xs text-zinc-400 truncate mt-0.5 font-medium">
                        {(() => {
                          const artistNames = track.channelTitle
                            ? track.channelTitle.split(/,|\s+&\s+|\s+and\s+/i).map((n: string) => n.trim()).filter(Boolean)
                            : [];
                          if (artistNames.length === 0) return 'Unknown Artist';
                          return artistNames.map((name: string, idx: number) => {
                            const cleanName = cleanVisualName(name);
                            return (
                              <React.Fragment key={name}>
                                {idx > 0 && <span className="text-zinc-500">, </span>}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const artistId = idx === 0 ? track.channelId || track.artistId : undefined;
                                    viewChannel(cleanName, artistId);
                                  }}
                                  className="hover:underline hover:text-white cursor-pointer"
                                >
                                  {cleanName}
                                </span>
                              </React.Fragment>
                            );
                          });
                        })()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromQueue(track.id)}
                    className="opacity-0 group-hover/item:opacity-100 p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-[#242424] transition-all flex-shrink-0 ml-1"
                    title="Remove from queue"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section C: Recently Played */}
        <div>
          <h4 className="text-xs font-bold text-zinc-400 mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-400" /> Recently played
          </h4>
          
          <div className="space-y-1">
            {history.length <= 1 ? (
              <div className="py-6 text-center text-xs text-zinc-500 italic border border-dashed border-white/5 rounded-lg">
                No history recorded
              </div>
            ) : (
              history
                .filter((t) => t.id !== currentTrack?.id)
                .slice(0, 10)
                .map((track) => (
                  <div
                    key={`hist-${track.id}`}
                    onClick={() => handleTrackClick(track, history)}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
                  >
                    <img
                      src={track.thumbnailUrl   || undefined}
                      referrerPolicy="no-referrer"
                      alt=""
                      className="w-10 h-10 object-cover rounded bg-[#242424] flex-shrink-0 shadow-md border border-white/5"
                    />
                    <div className="min-w-0 flex-1">
                      {(() => {
                        const parsed = parseFeaturedArtists(track.title);
                        return (
                          <>
                            <p className="text-sm font-bold text-zinc-300 truncate group-hover:text-white">
                              {parsed.title}
                            </p>
                            {parsed.featured.length > 0 && (
                              <p className="text-[10px] text-zinc-500 truncate font-medium mt-0.5">
                                feat.{' '}
                                {parsed.featured.map((featName, idx) => (
                                  <React.Fragment key={featName}>
                                    {idx > 0 && ', '}
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        viewChannel(featName);
                                      }}
                                      className="hover:underline hover:text-white cursor-pointer"
                                    >
                                      {featName}
                                    </span>
                                  </React.Fragment>
                                ))}
                              </p>
                            )}
                          </>
                        );
                      })()}
                      <p className="text-xs text-zinc-400 truncate mt-0.5 font-medium">
                        {(() => {
                          const artistNames = track.channelTitle
                            ? track.channelTitle.split(/,|\s+&\s+|\s+and\s+/i).map((n: string) => n.trim()).filter(Boolean)
                            : [];
                          if (artistNames.length === 0) return 'Unknown Artist';
                          return artistNames.map((name: string, idx: number) => {
                            const cleanName = cleanVisualName(name);
                            return (
                              <React.Fragment key={name}>
                                {idx > 0 && <span className="text-zinc-500">, </span>}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const artistId = idx === 0 ? track.channelId || track.artistId : undefined;
                                    viewChannel(cleanName, artistId);
                                  }}
                                  className="hover:underline hover:text-white cursor-pointer"
                                >
                                  {cleanName}
                                </span>
                              </React.Fragment>
                            );
                          });
                        })()}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

      </div>
    </aside>
  );
};

