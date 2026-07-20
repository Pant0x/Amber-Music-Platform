import React, { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Track } from '@/types/music-player';
import { Play, Pause, Music, Trash2, X, Disc, Heart, GripVertical } from 'lucide-react';
import { TrackCover } from '../TrackCover';
import { ExplicitBadge, ArtistLinks, PlayingEqualizer, isActiveTrack } from './shared';
import { AnimatedPage } from '../AnimatedPage';

export const PlaylistView: React.FC<{ mode: 'custom' | 'liked' }> = ({ mode }) => {
  const {
    currentTrack,
    isPlaying,
    playlists,
    likedTracks,
    toggleLikeTrack,
    addToQueue,
    currentPlaylistId,
    deletePlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    setActiveTab,
    setCurrentPlaylistId,
    playTrack,
    togglePlay
  } = usePlayerStore();

  const [ytPlaylistDetails, setYtPlaylistDetails] = useState<any>(null);
  const [ytPlaylistLoading, setYtPlaylistLoading] = useState(false);
  const dragIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  const activePlaylist = mode === 'custom' && currentPlaylistId ? playlists.find(p => p.id === currentPlaylistId) : null;

  const handlePlayAction = (track: Track, contextTracks: Track[] = []) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
      if (contextTracks.length > 0) {
        const idx = contextTracks.findIndex(t => t.id === track.id);
        if (idx !== -1) {
           usePlayerStore.setState({ queue: contextTracks.slice(idx + 1), contextQueue: contextTracks });
        }
      }
    } else {
      playTrack(track, contextTracks);
    }
  };

  // Load YouTube Playlist Details & Tracks if not local
  useEffect(() => {
    if (mode === 'custom' && currentPlaylistId) {
      const isLocal = playlists.some(p => p.id === currentPlaylistId);
      if (!isLocal) {
        setYtPlaylistLoading(true);
        setYtPlaylistDetails(null);
        fetch(`/api/youtube/playlist?id=${currentPlaylistId}`)
          .then(res => {
            if (res.ok) return res.json();
            throw new Error('Failed to load playlist');
          })
          .then(data => {
            setYtPlaylistDetails(data);
          })
          .catch(err => {
            console.error('Failed fetching YT playlist:', err);
          })
          .finally(() => {
            setYtPlaylistLoading(false);
          });
      }
    }
  }, [currentPlaylistId, playlists, mode]);

  if (mode === 'liked') {
    return (
      <AnimatedPage className="space-y-6">
        <div 
          className="flex flex-col md:flex-row items-end gap-6 -mx-6 p-6 pt-12 transition-all duration-1000 bg-transparent"
        >
          <div className="w-56 h-56 bg-gradient-to-br from-[var(--theme-accent)] to-[#b30000] rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 flex-shrink-0">
            <Heart className="w-24 h-24 text-white fill-current" />
          </div>
          <div className="space-y-2 min-w-0 pb-2">
            <span className="text-[13px] font-bold text-[var(--theme-accent)] uppercase tracking-widest">Playlist</span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight truncate pb-1">
              Liked Music
            </h1>
            <div className="text-sm text-zinc-400 font-medium flex items-center gap-2">
              <span className="text-white">Kiwi</span>
              <span>•</span>
              <span>{likedTracks.length} songs</span>
            </div>
          </div>
        </div>

        {/* Action play */}
        {likedTracks.length > 0 && (
          <button
            onClick={() => handlePlayAction(likedTracks[0], likedTracks)}
            className="flex items-center gap-2 bg-[var(--theme-accent)] hover:opacity-80 text-white px-8 py-3 rounded-full font-bold text-[13px] shadow-lg transition-opacity"
          >
            <Play className="w-5 h-5 fill-current text-white" /> Play
          </button>
        )}

        {/* Liked Tracks list */}
        <div className="space-y-1">
          {likedTracks.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center text-zinc-500 space-y-3 border border-dashed border-white/5 rounded-lg">
              <Heart className="w-10 h-10 text-zinc-600 animate-bounce" />
              <p className="text-xs font-semibold">No liked videos yet.</p>
              <button
                onClick={() => setActiveTab('search')}
                className="text-xs font-bold bg-[#ff0000] text-white px-4 py-2 rounded-full hover:bg-[#cc0000] transition-colors"
              >
                Find videos
              </button>
            </div>
          ) : (
            likedTracks.map((track, i) => {
              const isActive = isActiveTrack(currentTrack, track);
              const isCurrentPlaying = isActive && isPlaying;
              return (
                <div
                  key={track.id}
                  onDoubleClick={() => handlePlayAction(track, likedTracks)}
                  className={`group/row flex items-center gap-4 p-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors duration-150 ${
                    isActive ? 'bg-white/5' : ''
                  }`}
                >
                  <div className="w-8 flex items-center justify-center text-xs text-zinc-500 relative flex-shrink-0">
                    {isActive ? (
                      <>
                        <div className="group-hover/row:hidden flex items-center justify-center">
                          <PlayingEqualizer isPlaying={isPlaying} />
                        </div>
                        <button
                          onClick={() => handlePlayAction(track, likedTracks)}
                          className="hidden group-hover/row:flex text-white items-center justify-center"
                        >
                          {isCurrentPlaying ? (
                            <Pause className="w-4 h-4 fill-current text-[#ff0000]" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5 text-white" />
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="group-hover/row:hidden">{i + 1}</span>
                        <button
                          onClick={() => handlePlayAction(track, likedTracks)}
                          className="hidden group-hover/row:flex text-white items-center justify-center"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5 text-white" />
                        </button>
                      </>
                    )}
                  </div>

                  <TrackCover track={track} contextTracks={likedTracks} sizeClass="w-10 h-10 rounded" noOverlay />

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                      {track.title}
                      {track.isExplicit && <ExplicitBadge />}
                    </p>
                    <p className="text-xs text-zinc-400 truncate mt-0.5 inline-block"><ArtistLinks channelTitle={track.channelTitle} channelId={track.channelId} /></p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeTrack(track);
                      }}
                      className="text-[#ff0000] hover:text-white p-1 transition-colors flex-shrink-0"
                      title="Unlike"
                    >
                      <Heart className="w-4.5 h-4.5 fill-current" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        usePlayerStore.getState().playNext(track);
                      }}
                      className="opacity-0 group-hover/row:opacity-100 text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10 flex-shrink-0"
                    >
                      + Next
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToQueue(track);
                      }}
                      className="opacity-0 group-hover/row:opacity-100 text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10 flex-shrink-0"
                    >
                      + Queue
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
    </AnimatedPage>
    );
  }

  // Otherwise, custom or YouTube playlist details
  return (
    <AnimatedPage className="space-y-6">
      {activePlaylist ? (
        <div className="animate-fade-in space-y-6">
          <div 
            className="flex flex-col md:flex-row items-end gap-6 -mx-6 p-6 pt-12 transition-all duration-1000"
            style={{ backgroundImage: 'linear-gradient(to bottom, rgba(24, 24, 27, 0.4), var(--theme-main-bg, #030303))' }}
          >
            <div className="w-48 h-48 bg-[#1f1f1f] rounded-lg flex items-center justify-center shadow-2xl border border-white/10 flex-shrink-0">
              <Music className="w-20 h-20 text-zinc-600" />
            </div>
            <div className="space-y-2 min-w-0">
              <span className="text-xs font-bold text-[#ff0000] uppercase tracking-widest font-mono">Playlist</span>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight truncate">
                {activePlaylist.name}
              </h1>
              <div className="text-xs text-zinc-400 font-semibold flex items-center gap-1.5">
                <span>Guest</span>
                <span>•</span>
                <span>{activePlaylist.tracks.length} songs</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-4">
            {activePlaylist.tracks.length > 0 && (
              <button
                onClick={() => handlePlayAction(activePlaylist.tracks[0], activePlaylist.tracks)}
                className="flex items-center gap-2 bg-[#ff0000] hover:bg-[#cc0000] text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-lg uppercase tracking-wider"
              >
                <Play className="w-4 h-4 fill-current text-white" /> Play
              </button>
            )}

            <button
              onClick={() => {
                if (confirm(`Delete playlist "${activePlaylist.name}"?`)) deletePlaylist(activePlaylist.id);
              }}
              className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"
              title="Delete Playlist"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Tracks list */}
          <div className="space-y-1">
            {activePlaylist.tracks.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center text-zinc-500 space-y-3 border border-dashed border-white/5 rounded-lg">
                <Music className="w-10 h-10 text-zinc-600" />
                <p className="text-xs font-semibold">This playlist is empty.</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="text-xs font-bold bg-[#ff0000] text-white px-4 py-2 rounded-full hover:bg-[#cc0000] transition-colors"
                >
                  Find videos
                </button>
              </div>
            ) : (
              activePlaylist.tracks.map((track, i) => {
                const isActive = isActiveTrack(currentTrack, track);
                const isCurrentPlaying = isActive && isPlaying;
                return (
                  <div
                    key={track.id}
                    draggable
                    onDragStart={() => { dragIndexRef.current = i; }}
                    onDragEnter={() => { dragOverIndexRef.current = i; }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnd={() => {
                      const from = dragIndexRef.current;
                      const to = dragOverIndexRef.current;
                      if (from !== null && to !== null && from !== to) {
                        reorderPlaylistTracks(activePlaylist.id, from, to);
                      }
                      dragIndexRef.current = null;
                      dragOverIndexRef.current = null;
                    }}
                    onDoubleClick={() => handlePlayAction(track, activePlaylist.tracks)}
                    className={`group/row flex items-center gap-4 p-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors duration-150 ${
                      isActive ? 'bg-white/5' : ''
                    }`}
                  >
                    {/* Drag handle */}
                    <div className="opacity-0 group-hover/row:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex-shrink-0 text-zinc-600 hover:text-zinc-400 px-0.5">
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    <div className="w-8 flex items-center justify-center text-xs text-zinc-500 relative flex-shrink-0">
                      {isActive ? (
                        <>
                          <div className="group-hover/row:hidden flex items-center justify-center">
                            <PlayingEqualizer isPlaying={isPlaying} />
                          </div>
                          <button
                            onClick={() => handlePlayAction(track, activePlaylist.tracks)}
                            className="hidden group-hover/row:flex text-white items-center justify-center"
                          >
                            {isCurrentPlaying ? (
                              <Pause className="w-4 h-4 fill-current text-[#ff0000]" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5 text-white" />
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="group-hover/row:hidden">{i + 1}</span>
                          <button
                            onClick={() => handlePlayAction(track, activePlaylist.tracks)}
                            className="hidden group-hover/row:flex text-white items-center justify-center"
                          >
                            <Play className="w-4 h-4 fill-current ml-0.5 text-white" />
                          </button>
                        </>
                      )}
                    </div>

                    <TrackCover track={track} contextTracks={activePlaylist.tracks} sizeClass="w-10 h-10 rounded" noOverlay />

                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                        {track.title}
                        {track.isExplicit && <ExplicitBadge />}
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5 inline-block"><ArtistLinks channelTitle={track.channelTitle} channelId={track.channelId} /></p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTrackFromPlaylist(activePlaylist.id, track.id);
                        }}
                        className="opacity-0 group-hover/row:opacity-100 text-zinc-500 hover:text-rose-500 p-1 flex-shrink-0"
                        title="Remove track"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          usePlayerStore.getState().playNext(track);
                        }}
                        className="opacity-0 group-hover/row:opacity-100 text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10 flex-shrink-0"
                      >
                        + Next
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToQueue(track);
                        }}
                        className="opacity-0 group-hover/row:opacity-100 text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10 flex-shrink-0"
                      >
                        + Queue
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : ytPlaylistLoading ? (
        <div className="animate-pulse space-y-6">
          <div 
            className="flex flex-col md:flex-row items-end gap-6 -mx-6 p-6 pt-12 border-b border-white/5 transition-all duration-1000"
            style={{ backgroundImage: 'linear-gradient(to bottom, rgba(24, 24, 27, 0.1), var(--theme-main-bg, #030303))' }}
          >
            <div className="w-48 h-48 bg-zinc-900 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="w-20 h-4 bg-zinc-900 rounded" />
              <div className="w-64 h-8 bg-zinc-900 rounded" />
              <div className="w-40 h-4 bg-zinc-900 rounded" />
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-white/5">
                <div className="w-8 h-4 bg-zinc-900 rounded" />
                <div className="w-10 h-10 bg-zinc-900 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="w-48 h-4 bg-zinc-900 rounded" />
                  <div className="w-32 h-3 bg-zinc-900 rounded" />
                </div>
                <div className="w-12 h-4 bg-zinc-900 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : ytPlaylistDetails ? (
        <div className="animate-fade-in space-y-6">
          <div 
            className="flex flex-col md:flex-row items-end gap-6 -mx-6 p-6 pt-12 border-b transition-all duration-1000"
            style={{ backgroundImage: 'linear-gradient(to bottom, rgba(24, 24, 27, 0.3), var(--theme-main-bg, #030303))', borderBottomColor: 'var(--theme-border)' }}
          >
            {ytPlaylistDetails.metadata?.thumbnailUrl ? (
              <img
                src={ytPlaylistDetails.metadata.thumbnailUrl || undefined}
                referrerPolicy="no-referrer"
                alt=""
                className="w-48 h-48 object-cover rounded-lg shadow-2xl border border-white/10 flex-shrink-0"
              />
            ) : (
              <div className="w-48 h-48 bg-[#1f1f1f] rounded-lg flex items-center justify-center shadow-2xl border border-white/10 flex-shrink-0">
                <Music className="w-20 h-20 text-zinc-600" />
              </div>
            )}
            <div className="space-y-2 min-w-0">
              <span className="text-xs font-bold text-[#ff0000] uppercase tracking-widest font-mono">
                {(() => {
                  const id = currentPlaylistId || '';
                  const count = ytPlaylistDetails.tracks?.length || 0;
                  const isOfficialRelease = id.startsWith('MPRE') || (id.length === 22 && !id.startsWith('VL'));
                  if (isOfficialRelease) {
                    if (count === 1) return 'Single';
                    if (count <= 6) return 'EP';
                    return 'Album';
                  }
                  return 'Playlist';
                })()}
              </span>
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight truncate">
                {ytPlaylistDetails.metadata?.title}
              </h1>
              <div className="text-xs text-zinc-400 font-semibold flex items-center gap-1.5 flex-wrap">
                <ArtistLinks
                  channelTitle={ytPlaylistDetails.metadata?.channelTitle || ''}
                  channelId={ytPlaylistDetails.metadata?.channelId}
                  extraClass="text-white font-bold inline-flex flex-wrap text-xs"
                />
                <span>•</span>
                <span>{ytPlaylistDetails.tracks?.length || 0} songs</span>
                {ytPlaylistDetails.metadata?.description && (
                  <>
                    <span>•</span>
                    <span className="text-zinc-500 line-clamp-1 max-w-md">{ytPlaylistDetails.metadata.description}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-4">
            {ytPlaylistDetails.tracks?.length > 0 && (
              <button
                onClick={() => handlePlayAction(ytPlaylistDetails.tracks[0], ytPlaylistDetails.tracks)}
                className="flex items-center gap-2 bg-[#ff0000] hover:bg-[#cc0000] text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-lg uppercase tracking-wider transition-all duration-200"
              >
                <Play className="w-4 h-4 fill-current text-white" /> Play
              </button>
            )}
          </div>

          {/* Tracks list */}
          <div className="space-y-1">
            {ytPlaylistDetails.tracks?.length === 0 ? (
              <div className="py-20 text-center text-xs text-zinc-500 italic">No tracks found.</div>
            ) : (
              ytPlaylistDetails.tracks.map((track: Track, i: number) => {
                const isActive = isActiveTrack(currentTrack, track);
                const isCurrentPlaying = isActive && isPlaying;
                return (
                  <div
                    key={track.id}
                    onClick={() => handlePlayAction(track, ytPlaylistDetails.tracks)}
                    className={`group/row flex items-center gap-4 p-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors duration-150 ${
                      isActive ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className="w-8 flex items-center justify-center text-xs text-zinc-500 relative flex-shrink-0">
                      {isActive ? (
                        <>
                          <div className="group-hover/row:hidden flex items-center justify-center">
                            <PlayingEqualizer isPlaying={isPlaying} />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayAction(track, ytPlaylistDetails.tracks);
                            }}
                            className="hidden group-hover/row:flex text-white items-center justify-center"
                          >
                            {isCurrentPlaying ? (
                              <Pause className="w-4 h-4 fill-current text-[#ff0000]" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5 text-white" />
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="group-hover/row:hidden">{i + 1}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayAction(track, ytPlaylistDetails.tracks);
                            }}
                            className="hidden group-hover/row:flex text-white items-center justify-center"
                          >
                            <Play className="w-4 h-4 fill-current ml-0.5 text-white" />
                          </button>
                        </>
                      )}
                    </div>

                    <TrackCover track={track} contextTracks={ytPlaylistDetails.tracks} sizeClass="w-10 h-10 rounded" noOverlay />

                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                        {track.title}
                        {track.isExplicit && <ExplicitBadge />}
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5 inline-block"><ArtistLinks channelTitle={track.channelTitle} channelId={track.channelId} /></p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLikeTrack(track);
                        }}
                        className={`p-1.5 transition-opacity ${
                          likedTracks.some(t => t.id === track.id) ? 'text-[#ff0000]' : 'opacity-0 group-hover/row:opacity-100 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          usePlayerStore.getState().playNext(track);
                        }}
                        className="opacity-0 group-hover/row:opacity-100 text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors flex-shrink-0"
                      >
                        + Next
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToQueue(track);
                        }}
                        className="opacity-0 group-hover/row:opacity-100 text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors flex-shrink-0"
                      >
                        + Queue
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-xs text-zinc-500 italic">Playlist not found.</div>
      )}
    </AnimatedPage>
  );
};
