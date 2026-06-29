import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Track } from '@/types/music-player';
import { Play, Pause, Shuffle, Disc, Heart } from 'lucide-react';
import { TrackCover } from '../TrackCover';
import { ExplicitBadge, ArtistLinks } from './shared';
import { cleanVisualName } from '@/utils/text';
import { AlbumCoverPlayOverlay } from '../AlbumCoverPlayOverlay';

export const SearchView: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    likedTracks,
    toggleLikeTrack,
    addToQueue,
    searchQuery,
    setActiveTab,
    setCurrentPlaylistId,
    viewChannel,
    playArtistRadio,
    playTrack,
    togglePlay
  } = usePlayerStore();

  const [loading, setLoading] = useState(false);
  const [searchTopResult, setSearchTopResult] = useState<any>(null);
  const [searchSongs, setSearchSongs] = useState<Track[]>([]);
  const [searchVideos, setSearchVideos] = useState<any[]>([]);
  const [searchArtists, setSearchArtists] = useState<any[]>([]);
  const [searchAlbums, setSearchAlbums] = useState<any[]>([]);
  const [searchPlaylists, setSearchPlaylists] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState<'all' | 'songs' | 'videos' | 'artists' | 'albums' | 'playlists'>('all');

  const handlePlayAction = (track: Track, contextTracks: Track[] = []) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, contextTracks);
    }
  };

  // Sync Search results
  useEffect(() => {
    if (!searchQuery) {
      setSearchTopResult(null);
      setSearchSongs([]);
      setSearchVideos([]);
      setSearchArtists([]);
      setSearchAlbums([]);
      setSearchPlaylists([]);
      setSearchFilter('all');
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchTopResult(data.topResult || null);
          setSearchSongs(data.songs || []);
          setSearchVideos(data.videos || []);
          setSearchArtists(data.artists || []);
          setSearchAlbums(data.albums || []);
          setSearchPlaylists(data.communityPlaylists || []);
        }
      } catch (e) {
        console.error('Search query failure:', e);
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Search filters chips */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 select-none">
        {([
          { id: 'all', label: 'All' },
          { id: 'songs', label: 'Songs' },
          { id: 'videos', label: 'Videos' },
          { id: 'artists', label: 'Artists' },
          { id: 'albums', label: 'Albums' },
          { id: 'playlists', label: 'Playlists' }
        ] as const).map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSearchFilter(filter.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border border-white/10 ${
              searchFilter === filter.id
                ? 'bg-white text-black border-white'
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-xs text-zinc-500 font-semibold">
          <Disc className="w-5 h-5 animate-spin text-[#ff0000]" /> Resolving search index...
        </div>
      ) : (
        <div className="space-y-8">
          {/* "All" filter — YT Music-style mixed layout */}
          {searchFilter === 'all' && (
            <div className="space-y-8">
              {/* Top Result + Top Songs row */}
              {(searchTopResult || searchSongs.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,1fr)_minmax(0,2fr)] gap-6">
                  {/* Top Result Card */}
                  {searchTopResult && (
                    <div
                      onClick={() => {
                        if (searchTopResult.type === 'channel') {
                          viewChannel(searchTopResult.title, searchTopResult.id);
                        } else if (searchTopResult.type === 'music') {
                          handlePlayAction(searchTopResult, searchSongs);
                        } else if (searchTopResult.type === 'playlist') {
                          setActiveTab('playlist');
                          setCurrentPlaylistId(searchTopResult.id);
                        }
                      }}
                      className="group bg-[#1a1a1a] hover:bg-[#222] rounded-xl p-5 cursor-pointer transition-all duration-200 border border-white/5 hover:border-white/10 relative overflow-hidden"
                    >
                      <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Top result</h3>
                      <div className="flex flex-col items-start gap-4">
                        <img
                          src={searchTopResult.thumbnailUrl || undefined}
                          referrerPolicy="no-referrer"
                          alt=""
                          className={`w-24 h-24 object-cover shadow-xl ${searchTopResult.resultType === 'artist' ? 'rounded-full' : 'rounded-lg'}`}
                        />
                        <div>
                          <h4 className="text-2xl font-bold text-white mb-1 leading-tight">{cleanVisualName(searchTopResult.title)}</h4>
                          <p className="text-sm text-zinc-400 capitalize">
                            {searchTopResult.resultType || 'Artist'}
                            {searchTopResult.subtitle && <span className="text-zinc-500"> • {cleanVisualName(searchTopResult.subtitle)}</span>}
                          </p>
                        </div>
                      </div>
                      {/* Play button on hover */}
                      <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <div className="w-12 h-12 rounded-full bg-[#ff0000] flex items-center justify-center shadow-xl shadow-red-900/30">
                          {isPlaying && currentTrack?.id === searchTopResult.id ? (
                            <Pause className="w-5 h-5 fill-white text-white" />
                          ) : (
                            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Songs column */}
                  {searchSongs.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Songs</h3>
                      <div className="space-y-0.5">
                        {searchSongs.slice(0, 4).map((track, i) => {
                          const isActive = currentTrack?.id === track.id;
                          const isCurrentPlaying = isActive && isPlaying;
                          return (
                            <div
                              key={`s-${track.id}`}
                              onDoubleClick={() => handlePlayAction(track, searchSongs)}
                              className={`group/row flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors ${isActive ? 'bg-white/5' : ''}`}
                            >
                              <TrackCover track={track} contextTracks={searchSongs} sizeClass="w-10 h-10 rounded" />
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-medium truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                                  {track.title}
                                  {track.isExplicit && <ExplicitBadge />}
                                </p>
                                <p className="text-xs text-zinc-400 truncate mt-0.5"><ArtistLinks channelTitle={track.channelTitle} channelId={track.channelId} /></p>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                <button onClick={() => handlePlayAction(track, searchSongs)} className="text-white">
                                  {isCurrentPlaying ? <Pause className="w-4 h-4 fill-current text-[#ff0000]" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                                </button>
                                <button onClick={() => addToQueue(track)} className="text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10">+ Queue</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Artists Section */}
              {searchArtists.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Artists</h3>
                  <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2">
                    {searchArtists.slice(0, 6).map(artist => (
                      <div
                        key={`a-${artist.id}`}
                        onClick={() => viewChannel(artist.title, artist.id)}
                        className="group flex-shrink-0 w-[150px] bg-[#0d0d0d] hover:bg-[#1a1a1a] p-4 rounded-xl transition-all duration-200 cursor-pointer text-center border border-white/5 hover:border-white/10"
                      >
                        <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-[#1f1f1f] mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow relative">
                          <img src={artist.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playArtistRadio(artist.id || artist.title);
                            }}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full"
                          >
                            <div className="w-9 h-9 rounded-full bg-[#ff0000] flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-transform">
                              <Shuffle className="w-4 h-4 fill-none text-white" />
                            </div>
                          </button>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate">{artist.title}</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{artist.subtitle || 'Artist'}</p>

                        {artist.possibleChannels && artist.possibleChannels.length > 0 && (
                          <div className="mt-2 flex items-center justify-center gap-2">
                            {artist.possibleChannels.slice(0, 3).map((c: any) => (
                              <button
                                key={c.id || c.channelId}
                                onClick={(e) => { e.stopPropagation(); viewChannel(c.title || c.channelTitle || c.name, c.id || c.channelId); }}
                                className="flex items-center gap-2 px-2 py-1 bg-[#0b0b0b] hover:bg-[#141414] rounded-full border border-white/5 text-xs text-zinc-400"
                                aria-label={`Open ${c.title || c.channelTitle || c.name}`}
                              >
                                <img src={c.thumbnailUrl || c.thumbnail || (c.thumbnails && c.thumbnails[0]?.url)} referrerPolicy="no-referrer" alt="" className="w-6 h-6 rounded-full object-cover" />
                                <span className="truncate max-w-[90px]">{c.title || c.channelTitle || c.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Albums Section */}
              {searchAlbums.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Albums</h3>
                  <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2">
                    {searchAlbums.slice(0, 6).map(album => (
                      <div
                        key={`al-${album.id}`}
                        onClick={() => { setActiveTab('playlist'); setCurrentPlaylistId(album.id); }}
                        className="group flex-shrink-0 w-[160px] cursor-pointer"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-[#1f1f1f] mb-2 shadow-md group-hover:shadow-xl transition-shadow relative">
                          <img src={album.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                          <AlbumCoverPlayOverlay item={album} />
                        </div>
                        <h4 className="text-xs font-semibold text-white truncate">{album.title}</h4>
                        <p className="text-[10px] text-zinc-500 truncate">
                          {album.releaseType || 'Album'} • {cleanVisualName(album.channelTitle)}
                          {album.isExplicit && <ExplicitBadge />}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos Section */}
              {searchVideos.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Videos</h3>
                  <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2">
                    {searchVideos.slice(0, 5).map(vid => (
                      <div
                        key={`v-${vid.id}`}
                        onClick={() => handlePlayAction(vid, searchVideos)}
                        className="group flex-shrink-0 w-[240px] cursor-pointer"
                      >
                        <div className="aspect-video rounded-lg overflow-hidden bg-[#1f1f1f] mb-2 shadow-md relative">
                          <img src={vid.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-[#ff0000]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <h4 className="text-xs font-semibold text-white truncate">{vid.title}</h4>
                        <p className="text-[10px] text-zinc-500 truncate">{cleanVisualName(vid.channelTitle)}{vid.views ? ` • ${vid.views}` : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Community Playlists */}
              {searchPlaylists.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Community playlists</h3>
                  <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2">
                    {searchPlaylists.slice(0, 6).map(pl => (
                      <div
                        key={`cp-${pl.id}`}
                        onClick={() => { setActiveTab('playlist'); setCurrentPlaylistId(pl.id); }}
                        className="group flex-shrink-0 w-[160px] cursor-pointer"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-[#1f1f1f] mb-2 shadow-md group-hover:shadow-xl transition-shadow relative">
                          <img src={pl.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                          <AlbumCoverPlayOverlay item={pl} />
                        </div>
                        <h4 className="text-xs font-semibold text-white truncate">{pl.title}</h4>
                        <p className="text-[10px] text-zinc-500 truncate">{cleanVisualName(pl.channelTitle)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Songs filter — full song list */}
          {searchFilter === 'songs' && (
            <div className="space-y-1">
              {searchSongs.map((track, i) => {
                const isActive = currentTrack?.id === track.id;
                const isCurrentPlaying = isActive && isPlaying;
                return (
                  <div
                    key={`sf-${track.id}`}
                    onDoubleClick={() => handlePlayAction(track, searchSongs)}
                    className={`group/row flex items-center gap-4 p-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors ${isActive ? 'bg-white/5' : ''}`}
                  >
                    <div className="w-8 flex items-center justify-center text-xs text-zinc-500 flex-shrink-0">
                      <span className="group-hover/row:hidden">{i + 1}</span>
                      <button onClick={() => handlePlayAction(track, searchSongs)} className="hidden group-hover/row:flex text-white items-center justify-center">
                        {isCurrentPlaying ? <Pause className="w-4 h-4 fill-current text-[#ff0000]" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>
                    </div>
                    <TrackCover track={track} contextTracks={searchSongs} sizeClass="w-10 h-10 rounded" />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                        {track.title}{track.isExplicit && <ExplicitBadge />}
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5"><ArtistLinks channelTitle={track.channelTitle} channelId={track.channelId} /></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleLikeTrack(track)} className={`p-1 transition-colors opacity-0 group-hover/row:opacity-100 ${likedTracks.some(t => t.id === track.id) ? 'opacity-100 text-[#ff0000]' : 'text-zinc-400 hover:text-white'}`}><Heart className="w-4 h-4 fill-current" /></button>
                      <button onClick={() => addToQueue(track)} className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10 + Queue">+ Queue</button>
                    </div>
                  </div>
                );
              })}
              {searchSongs.length === 0 && <p className="text-sm text-zinc-500 py-10 text-center">No songs found.</p>}
            </div>
          )}

          {/* Videos filter */}
          {searchFilter === 'videos' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchVideos.map(vid => (
                <div key={`vf-${vid.id}`} onClick={() => handlePlayAction(vid, searchVideos)} className="group cursor-pointer">
                  <div className="aspect-video rounded-lg overflow-hidden bg-[#1f1f1f] mb-2 shadow-md relative">
                    <img src={vid.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#ff0000]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                        <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate">{vid.title}{vid.isExplicit && <ExplicitBadge />}</h4>
                  <p className="text-xs text-zinc-500 truncate">{cleanVisualName(vid.channelTitle)}{vid.views ? ` • ${vid.views}` : ''}</p>
                </div>
              ))}
              {searchVideos.length === 0 && <p className="text-sm text-zinc-500 py-10 text-center col-span-full">No videos found.</p>}
            </div>
          )}

          {/* Artists filter */}
          {searchFilter === 'artists' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchArtists.map(artist => (
                <div key={`af-${artist.id}`} onClick={() => viewChannel(artist.title, artist.id)} className="group bg-[#0d0d0d] hover:bg-[#1a1a1a] p-4 rounded-xl transition-all duration-200 cursor-pointer text-center border border-white/5 hover:border-white/10">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-[#1f1f1f] mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow relative">
                    <img src={artist.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playArtistRadio(artist.id || artist.title);
                      }}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#ff0000] flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-transform">
                        <Shuffle className="w-5 h-5 fill-none text-white" />
                      </div>
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">{cleanVisualName(artist.title)}</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{artist.subtitle || 'Artist'}</p>

                  {artist.possibleChannels && artist.possibleChannels.length > 0 && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      {artist.possibleChannels.slice(0, 4).map((c: any) => (
                        <button
                          key={c.id || c.channelId}
                          onClick={(e) => { e.stopPropagation(); viewChannel(c.title || c.channelTitle || c.name, c.id || c.channelId); }}
                          className="flex items-center gap-2 px-2 py-1 bg-[#0b0b0b] hover:bg-[#141414] rounded-full border border-white/5 text-xs text-zinc-400"
                          aria-label={`Open ${c.title || c.channelTitle || c.name}`}
                        >
                          <img src={c.thumbnailUrl || c.thumbnail || (c.thumbnails && c.thumbnails[0]?.url)} referrerPolicy="no-referrer" alt="" className="w-6 h-6 rounded-full object-cover" />
                          <span className="truncate max-w-[96px]">{c.title || c.channelTitle || c.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {searchArtists.length === 0 && <p className="text-sm text-zinc-500 py-10 text-center col-span-full">No artists found.</p>}
            </div>
          )}

          {/* Albums filter */}
          {searchFilter === 'albums' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchAlbums.map(album => (
                <div key={`alf-${album.id}`} onClick={() => { setActiveTab('playlist'); setCurrentPlaylistId(album.id); }} className="group cursor-pointer">
                  <div className="aspect-square rounded-lg overflow-hidden bg-[#1f1f1f] mb-2 shadow-md group-hover:shadow-xl transition-shadow relative">
                    <img src={album.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                    <AlbumCoverPlayOverlay item={album} />
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate">{album.title}</h4>
                  <p className="text-[10px] text-zinc-500 truncate">{album.releaseType || 'Album'} • {cleanVisualName(album.channelTitle)}{album.isExplicit && <ExplicitBadge />}</p>
                </div>
              ))}
              {searchAlbums.length === 0 && <p className="text-sm text-zinc-500 py-10 text-center col-span-full">No albums found.</p>}
            </div>
          )}

          {/* Playlists filter */}
          {searchFilter === 'playlists' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchPlaylists.map(pl => (
                <div key={`plf-${pl.id}`} onClick={() => { setActiveTab('playlist'); setCurrentPlaylistId(pl.id); }} className="group cursor-pointer">
                  <div className="aspect-square rounded-lg overflow-hidden bg-[#1f1f1f] mb-2 shadow-md group-hover:shadow-xl transition-shadow relative">
                    <img src={pl.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                    <AlbumCoverPlayOverlay item={pl} />
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate">{pl.title}</h4>
                  <p className="text-[10px] text-zinc-500 truncate">{cleanVisualName(pl.channelTitle)}</p>
                </div>
              ))}
              {searchPlaylists.length === 0 && <p className="text-sm text-zinc-500 py-10 text-center col-span-full">No playlists found.</p>}
            </div>
          )}

          {/* Empty state */}
          {searchSongs.length === 0 && searchArtists.length === 0 && searchAlbums.length === 0 && searchVideos.length === 0 && !searchTopResult && searchQuery && !loading && (
            <div className="py-20 text-center text-sm text-zinc-500 font-semibold">
              No results found. Try another query.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
