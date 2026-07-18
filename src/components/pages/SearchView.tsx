import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Track } from '@/types/music-player';
import { Play, Pause, Shuffle, Disc, Heart } from 'lucide-react';
import { TrackCover } from '../TrackCover';
import { ExplicitBadge, ArtistLinks, PlayingEqualizer, isActiveTrack } from './shared';
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
    setSearchQuery,
    setActiveTab,
    setCurrentPlaylistId,
    viewChannel,
    playArtistRadio,
    playTrack,
    togglePlay,
    history,
    searchHistory,
    selectedMood,
    addSearchQueryToHistory,
    hideExplicit
  } = usePlayerStore();

  const [loading, setLoading] = useState(false);
  const [searchTopResult, setSearchTopResult] = useState<any>(null);
  const [searchSongs, setSearchSongs] = useState<Track[]>([]);
  const [searchArtists, setSearchArtists] = useState<any[]>([]);
  const [searchAlbums, setSearchAlbums] = useState<any[]>([]);
  const [searchPlaylists, setSearchPlaylists] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState<'all' | 'songs' | 'artists' | 'albums' | 'playlists'>('all');

  const [landingRecs, setLandingRecs] = useState<Track[]>([]);
  const [landingTrends, setLandingTrends] = useState<any[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);

  const historyRef = React.useRef(history);
  const searchHistoryRef = React.useRef(searchHistory);

  useEffect(() => {
    historyRef.current = history;
    searchHistoryRef.current = searchHistory;
  }, [history, searchHistory]);

  useEffect(() => {
    if (searchQuery) return;

    const fetchLandingData = async () => {
      setRecsLoading(true);
      try {
        const recPromise = fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            history: historyRef.current.map(t => ({ id: t.id, title: t.title, channelTitle: t.channelTitle })),
            searchHistory: searchHistoryRef.current,
            mood: selectedMood
          })
        }).then(r => r.ok ? r.json() : null).catch(() => null);

        const trendPromise = fetch('/api/search/trending')
          .then(r => r.ok ? r.json() : null).catch(() => null);

        const [recData, trendData] = await Promise.all([recPromise, trendPromise]);
        
        if (recData && recData.items) {
          setLandingRecs(recData.items.slice(0, 10));
        }
        if (trendData) {
          setLandingTrends(trendData.slice(0, 6));
        }
      } catch (err) {
        console.error('Failed to fetch landing recommendations/trends:', err);
      } finally {
        setRecsLoading(false);
      }
    };

    fetchLandingData();
  }, [searchQuery, selectedMood]);

  const handlePlayAction = (track: Track, contextTracks: Track[] = []) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, contextTracks);
    }
  };

  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Sync Search results
  useEffect(() => {
    if (!searchQuery) {
      setSearchTopResult(null);
      setSearchSongs([]);
      setSearchArtists([]);
      setSearchAlbums([]);
      setSearchPlaylists([]);
      setSearchFilter('all');
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&t=${Date.now()}`, {
          signal: abortControllerRef.current.signal
        });
        if (res.ok) {
          const data = await res.json();
          setSearchTopResult(data.topResult || null);
          setSearchSongs(data.songs || []);
          setSearchArtists(data.artists || []);
          setSearchAlbums(data.albums || []);
          setSearchPlaylists(data.communityPlaylists || []);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Search query failure:', e);
        }
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
        <div className="space-y-6">
          <div className="h-4 w-48 bg-white/5 animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={`search-skel-${i}`} className="flex items-center gap-3 p-2 bg-white/5 rounded-md animate-pulse">
                <div className="w-12 h-12 rounded bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 bg-white/5 rounded" />
                  <div className="h-2 w-1/2 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !searchQuery ? (
        <div className="space-y-10 animate-fade-in pb-16">
          {/* Trending Searches */}
          {landingTrends.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Trending Searches</h3>
              <div className="flex flex-wrap gap-2">
                {landingTrends.map((trend) => (
                  <button
                    key={trend.name}
                    onClick={() => {
                      setSearchQuery(trend.name);
                      addSearchQueryToHistory(trend.name);
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-full text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    🔥 {trend.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Explore Moods */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Explore Genres & Moods</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 select-none">
              {[
                { name: 'Focus Beats', query: 'lofi study focus beats', gradient: 'from-[#1e3c72] to-[#2a5298]' },
                { name: 'Hype Rap', query: 'hype trap rap hip hop hits', gradient: 'from-[#ff416c] to-[#ff4b2b]' },
                { name: 'Chill Vibes', query: 'chill lofi sleep relax music', gradient: 'from-[#11998e] to-[#38ef7d]' },
                { name: 'Commute Drive', query: 'happy acoustic pop roadtrip', gradient: 'from-[#00c6ff] to-[#0072ff]' },
                { name: 'Gym Energy', query: 'workout training synthwave techno', gradient: 'from-[#f857a6] to-[#ff5858]' },
                { name: 'Late Night Jazz', query: 'ambient jazz blues chill lounge', gradient: 'from-[#8a2387] to-[#e94057]' }
              ].map((item) => (
                <div
                  key={item.name}
                  onClick={() => {
                    setSearchQuery(item.query);
                    addSearchQueryToHistory(item.query);
                  }}
                  className={`relative p-5 rounded-2xl bg-gradient-to-br ${item.gradient} hover:scale-[1.03] active:scale-95 transition-all cursor-pointer shadow-lg aspect-[4/3] flex flex-col justify-end border border-white/10`}
                >
                  <div className="absolute inset-0 bg-black/10 rounded-2xl" />
                  <span className="relative z-10 text-xs font-black text-white leading-tight drop-shadow">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended for You */}
          {recsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={`search-rec-skel-${i}`} className="flex items-center gap-3.5 p-2 rounded-xl bg-white/5 animate-pulse">
                  <div className="w-12 h-12 rounded-lg bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 bg-white/5 rounded" />
                    <div className="h-2 w-1/2 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : landingRecs.length > 0 ? (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Tailored to your taste</p>
                <h3 className="text-xl font-bold text-white tracking-tight">Recommended for you</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(landingRecs.filter(t => hideExplicit ? !t.isExplicit : !/\b(clean|censored|radio\s+edit)\b/i.test(t.title))).map((track, idx) => {
                  const isActive = isActiveTrack(currentTrack, track);
                  return (
                    <div
                      key={`recs-${track.id}-${idx}`}
                      onClick={() => handlePlayAction(track, landingRecs)}
                      className={`group flex items-center gap-3.5 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-white/5 ${
                        isActive ? 'bg-white/5 border-white/5' : ''
                      }`}
                    >
                      <TrackCover track={track} contextTracks={landingRecs} sizeClass="w-12 h-12 rounded-lg" />
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                          {track.title}
                          {track.isExplicit && <ExplicitBadge />}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5"><ArtistLinks channelTitle={track.channelTitle} channelId={track.channelId} /></p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            usePlayerStore.getState().playNext(track);
                          }}
                          className="px-2 py-1 text-[9px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider rounded bg-white/5 hover:bg-white/10"
                        >
                          + Next
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToQueue(track);
                          }}
                          className="px-2 py-1 text-[9px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider rounded bg-white/5 hover:bg-white/10"
                        >
                          + Queue
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            searchHistory.length === 0 && (
              <div className="py-10 text-center text-xs text-zinc-500">
                Your recommendations will appear here once you play songs or search.
              </div>
            )
          )}
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
                        {(searchSongs.filter(t => hideExplicit ? !t.isExplicit : !/\b(clean|censored|radio\s+edit)\b/i.test(t.title))).slice(0, 4).map((track, i) => {
                          const isActive = isActiveTrack(currentTrack, track);
                          const isCurrentPlaying = isActive && isPlaying;
                          return (
                            <div
                              key={`s-${track.id}`}
                              onDoubleClick={() => handlePlayAction(track, searchSongs)}
                              className={`group/row flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors ${isActive ? 'bg-white/5' : ''}`}
                            >
                              <TrackCover track={track} contextTracks={searchSongs} sizeClass="w-10 h-10 rounded" noOverlay />
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-medium truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                                  {track.title}
                                  {track.isExplicit && <ExplicitBadge />}
                                </p>
                                <p className="text-xs text-zinc-400 truncate mt-0.5"><ArtistLinks channelTitle={track.channelTitle} channelId={track.channelId} /></p>
                              </div>
                              <div className="flex items-center gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0">
                                <button onClick={() => handlePlayAction(track, searchSongs)} className="text-white p-1">
                                  {isCurrentPlaying ? <Pause className="w-4 h-4 fill-current text-[#ff0000]" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                                </button>
                                <button onClick={() => usePlayerStore.getState().playNext(track)} className="text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10">+ Next</button>
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
                        <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-[#1f1f1f] mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-all duration-300 relative group">
                          <img src={artist.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                          <AlbumCoverPlayOverlay item={{ id: artist.id || artist.title, title: artist.title, type: 'artist' }} />
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
                    {(searchAlbums.filter(a => hideExplicit ? !a.isExplicit : !/\b(clean|censored|radio\s+edit)\b/i.test(a.title))).slice(0, 6).map(album => (
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
              {(searchSongs.filter(t => hideExplicit ? !t.isExplicit : !/\b(clean|censored|radio\s+edit)\b/i.test(t.title))).map((track, i) => {
                const isActive = isActiveTrack(currentTrack, track);
                const isCurrentPlaying = isActive && isPlaying;
                return (
                  <div
                    key={`sf-${track.id}`}
                    onDoubleClick={() => handlePlayAction(track, searchSongs)}
                    className={`group/row flex items-center gap-4 p-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors ${isActive ? 'bg-white/5' : ''}`}
                  >
                    <div className="w-8 flex items-center justify-center text-xs text-zinc-500 flex-shrink-0">
                      {isActive ? (
                        <>
                          <div className="group-hover/row:hidden flex items-center justify-center">
                            <PlayingEqualizer isPlaying={isPlaying} />
                          </div>
                          <button onClick={() => handlePlayAction(track, searchSongs)} className="hidden group-hover/row:flex text-white items-center justify-center">
                            {isCurrentPlaying ? <Pause className="w-4 h-4 fill-current text-[#ff0000]" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="group-hover/row:hidden">{i + 1}</span>
                          <button onClick={() => handlePlayAction(track, searchSongs)} className="hidden group-hover/row:flex text-white items-center justify-center">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </button>
                        </>
                      )}
                    </div>
                    <TrackCover track={track} contextTracks={searchSongs} sizeClass="w-10 h-10 rounded" noOverlay />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                        {track.title}{track.isExplicit && <ExplicitBadge />}
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5"><ArtistLinks channelTitle={track.channelTitle} channelId={track.channelId} /></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleLikeTrack(track)} className={`p-1 transition-colors opacity-0 group-hover/row:opacity-100 ${likedTracks.some(t => t.id === track.id) ? 'opacity-100 text-[#ff0000]' : 'text-zinc-400 hover:text-white'}`}><Heart className="w-4 h-4 fill-current" /></button>
                      <button onClick={() => usePlayerStore.getState().playNext(track)} className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10">+ Next</button>
                      <button onClick={() => addToQueue(track)} className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10">+ Queue</button>
                    </div>
                  </div>
                );
              })}
              {searchSongs.length === 0 && <p className="text-sm text-zinc-500 py-10 text-center col-span-full">No songs found.</p>}
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
          {searchSongs.length === 0 && searchArtists.length === 0 && searchAlbums.length === 0 && !searchTopResult && searchQuery && !loading && (
            <div className="py-20 text-center text-sm text-zinc-500 font-semibold">
              No results found. Try another query.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
