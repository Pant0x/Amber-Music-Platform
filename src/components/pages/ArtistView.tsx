import React, { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Track } from '@/types/music-player';
import { Play, Pause, Shuffle, Disc, Heart, Compass, Radio, Check, Clock, Music, PlusCircle } from 'lucide-react';
import { TrackCover } from '../TrackCover';
import { ExplicitBadge, ArtistLinks, Carousel, isActiveTrack, PlayingEqualizer } from './shared';
import { cleanVisualName } from '@/utils/text';
import { AlbumCoverPlayOverlay } from '../AlbumCoverPlayOverlay';
import { useRouter, useSearchParams } from 'next/navigation';

export const ArtistView: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    likedTracks,
    toggleLikeTrack,
    addToQueue,
    activeTab,
    currentChannelId,
    currentChannelDetails,
    fetchChannelDetails,
    viewChannel,
    subscribedChannels,
    toggleSubscribeChannel,
    playArtistRadio,
    playTrack,
    togglePlay,
    setCurrentPlaylistId,
    setActiveTab,
    artistSubTab,
    setArtistSubTab
  } = usePlayerStore();

  const router = useRouter();
  const searchParams = useSearchParams();
  const [albumFilter, setAlbumFilter] = useState<'All' | 'Albums' | 'Singles & EPs'>('All');

  const handlePlayAction = (track: Track, contextTracks: Track[] = []) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, contextTracks);
    }
  };

  const lastLoadedChannelIdRef = useRef<string | null>(null);

  // Hydrate Channel Details
  useEffect(() => {
    if (currentChannelId) {
      const isName = !currentChannelId.startsWith('UC');
      fetchChannelDetails(currentChannelId, isName);
      if (lastLoadedChannelIdRef.current !== currentChannelId) {
        // Read URL param on initial channel load if present
        const urlParams = new URLSearchParams(window.location.search);
        const initialTab = urlParams.get('tab') as any;
        const validTabs = ['overview', 'songs', 'albums', 'videos', 'about'];
        if (initialTab && validTabs.includes(initialTab)) {
          setArtistSubTab(initialTab);
        } else {
          setArtistSubTab('overview');
        }
        lastLoadedChannelIdRef.current = currentChannelId;
      }
    }
  }, [currentChannelId, fetchChannelDetails, setArtistSubTab]);

  // Synchronize artist sub-tab with ?tab= query parameter in URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tabParam = searchParams.get('tab') as any;
    const validTabs = ['overview', 'songs', 'albums', 'videos', 'about'];
    if (tabParam && validTabs.includes(tabParam) && tabParam !== artistSubTab) {
      setArtistSubTab(tabParam);
    }
  }, [searchParams, setArtistSubTab, artistSubTab]);

  // Update URL query parameters when artistSubTab changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const currentTab = params.get('tab');
    if (artistSubTab && artistSubTab !== 'overview') {
      if (currentTab !== artistSubTab) {
        params.set('tab', artistSubTab);
        const newSearch = params.toString();
        window.history.pushState(null, '', window.location.pathname + `?${newSearch}`);
      }
    } else {
      if (currentTab) {
        params.delete('tab');
        const newSearch = params.toString();
        window.history.pushState(null, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''));
      }
    }
  }, [artistSubTab]);

  if (!currentChannelDetails) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="min-h-[350px] sm:min-h-[500px] -mx-6 -mt-6 bg-zinc-900 flex flex-col justify-end p-6 sm:p-10 relative">
          <div className="space-y-4 z-10">
            <div className="w-72 h-16 bg-zinc-800 rounded" />
            <div className="w-36 h-4 bg-zinc-800 rounded" />
            <div className="w-96 h-12 bg-zinc-800 rounded" />
          </div>
        </div>
        <div className="space-y-3 mt-8">
          <div className="w-32 h-6 bg-zinc-900 rounded mb-4" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-white/5">
              <div className="w-6 h-4 bg-zinc-900 rounded" />
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
    );
  }

  return (
    <div className="animate-fade-in space-y-0">
      
      {/* Header Banner - Spotify/YT Music 1:1 Layout */}
      <div 
        className="min-h-[350px] sm:min-h-[500px] -mx-6 -mt-6 bg-cover bg-center relative flex flex-col justify-end p-6 sm:p-10"
        style={{ backgroundImage: `url(${currentChannelDetails.profile?.bannerUrl || currentChannelDetails.profile?.avatarUrl})` }}
      >
        <div 
          className="absolute inset-0 transition-all duration-1000"
          style={{ backgroundImage: 'linear-gradient(to bottom, transparent, rgba(3, 3, 3, 0.3), var(--theme-main-bg, #030303))' }}
        ></div>
        
        <div className="relative z-10 w-full max-w-5xl">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-tighter drop-shadow-2xl mb-2">
            {cleanVisualName(currentChannelDetails.profile?.title || '')}
          </h1>
          
          <div className="text-sm sm:text-base text-zinc-300 font-medium flex items-center gap-2 drop-shadow mb-4">
            <span>
              {(() => {
                const count = Number(currentChannelDetails.profile.subscriberCount || 0);
                const adjusted = subscribedChannels.includes(currentChannelDetails.profile.id) ? count + 1 : count;
                if (adjusted >= 1000000) return `${(adjusted / 1000000).toFixed(adjusted >= 10000000 ? 0 : 1)}M`;
                if (adjusted >= 1000) return `${(adjusted / 1000).toFixed(0)}K`;
                return adjusted.toLocaleString();
              })()} monthly audience
            </span>
          </div>

          {currentChannelDetails.profile?.description && (
            <p className="text-zinc-300 text-sm sm:text-base max-w-3xl line-clamp-3 mb-6 drop-shadow-md">
              {currentChannelDetails.profile.description}
            </p>
          )}
        </div>

        {/* Floating circular Shuffle Play button on banner */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            playArtistRadio(currentChannelDetails.profile?.id || currentChannelDetails.profile?.title);
          }}
          className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 z-20 w-14 h-14 rounded-full bg-[#ff0000] hover:bg-[#cc0000] flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:rotate-6 active:scale-95 cursor-pointer"
          title="Shuffle Play Artist"
        >
          <Shuffle className="w-7 h-7 fill-none text-white" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 py-5 flex-wrap">
        {currentChannelDetails.topSongs?.length > 0 && (
          <button
            onClick={() => {
              playArtistRadio(currentChannelDetails.profile?.id || currentChannelDetails.profile?.title);
            }}
            className="flex items-center gap-2 border border-white/20 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-white/5 transition-colors"
          >
            <Compass className="w-4 h-4" /> Shuffle
          </button>
        )}
        {currentChannelDetails.profile?.title && (
          <button
            onClick={async () => {
              const artistName = currentChannelDetails.profile?.title;
              if (!artistName) return;
              try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(artistName + ' mix')}`);
                if (res.ok) {
                  const data = await res.json();
                  const tracks = data.items?.filter((t: Track) => t.type !== 'channel') || [];
                  if (tracks.length > 0) handlePlayAction(tracks[0], tracks);
                  else if (currentChannelDetails.topSongs?.length > 0) handlePlayAction(currentChannelDetails.topSongs[0], currentChannelDetails.topSongs);
                }
              } catch (e) { console.error('Radio fetch failed:', e); }
            }}
            className="flex items-center gap-2 border border-white/20 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-white/5 transition-colors"
          >
            <Radio className="w-4 h-4" /> Radio
          </button>
        )}
        {currentChannelDetails.profile?.id && (
          <button
            onClick={() => toggleSubscribeChannel(currentChannelDetails.profile.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all border flex items-center gap-1.5 ${
              subscribedChannels.includes(currentChannelDetails.profile.id)
                ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                : 'bg-white text-black border-white hover:bg-zinc-200'
            }`}
          >
            {subscribedChannels.includes(currentChannelDetails.profile.id) ? (
              <><Check className="w-4 h-4" /> Subscribed</>
            ) : 'Subscribe'}
          </button>
        )}
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-0 border-b border-white/10 mb-6">
        {(['overview', 'songs', 'albums', 'videos', 'about'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setArtistSubTab(tab)}
            className={`px-5 py-3 text-sm font-medium uppercase tracking-wide transition-colors relative ${
              artistSubTab === tab ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab}
            {artistSubTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-t-sm" />
            )}
          </button>
        ))}
      </div>

      {/* ========== TAB: OVERVIEW ========== */}
      {artistSubTab === 'overview' && (
        <div className="space-y-10 animate-fade-in">
          
          {/* Songs */}
          {currentChannelDetails.topSongs?.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Songs</h2>
              <div className="space-y-0">
                {currentChannelDetails.topSongs.slice(0, 4).map((track: Track, idx: number) => {
                  const isActive = isActiveTrack(currentTrack, track);
                  return (
                    <div
                      key={`ov-song-${track.id}`}
                      onClick={() => handlePlayAction(track, currentChannelDetails.topSongs)}
                      className={`group/row flex items-center gap-4 px-2 py-2.5 rounded-sm hover:bg-white/5 transition-colors cursor-pointer ${isActive ? 'bg-white/5' : ''}`}
                    >
                      <TrackCover track={track} contextTracks={currentChannelDetails.topSongs} sizeClass="w-12 h-12 rounded" />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                          {track.title}
                          {track.isExplicit && <ExplicitBadge />}
                        </p>
                        <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-400 w-48 truncate flex-shrink-0">
                         <Music className="w-3.5 h-3.5 flex-shrink-0" />
                         <ArtistLinks channelTitle={track.channelTitle} channelId={track.channelId} extraClass="w-full" />
                       </div>
                      </div>
                      {track.views && (
                        <div className="hidden md:block text-sm text-zinc-400 w-28 text-right flex-shrink-0">
                          {track.views.replace(' views', ' plays')}
                        </div>
                      )}
                      {track.duration && (
                        <div className="text-sm text-zinc-400 w-12 text-right flex-shrink-0 font-mono">{track.duration}</div>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); toggleLikeTrack(track); }}
                          className={`p-1.5 ${likedTracks.some(t => t.id === track.id) ? 'opacity-100 text-[#ff0000]' : 'text-zinc-400 hover:text-white'}`}>
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); addToQueue(track); }}
                          className="p-1.5 text-zinc-400 hover:text-white" title="Add to queue">
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setArtistSubTab('songs')}
                className="mt-3 border border-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/5 transition-colors">
                Show all
              </button>
            </div>
          )}

          {/* Albums */}
          {currentChannelDetails.albums?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Albums</h2>
                <button onClick={() => setArtistSubTab('albums')}
                  className="border border-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/5 transition-colors">
                  More
                </button>
              </div>
              <Carousel className="gap-6">
                {currentChannelDetails.albums.map((album: any) => (
                  <div key={`ov-album-${album.id}`}
                    onClick={() => {
                      if (album.type === 'music') {
                        handlePlayAction(album, [album]);
                      } else {
                        setCurrentPlaylistId(album.id);
                        setActiveTab('playlist');
                      }
                    }}
                    className="group flex-shrink-0 w-[180px] cursor-pointer">
                    <div className="relative aspect-square w-full rounded-sm overflow-hidden mb-2 bg-[#1f1f1f]">
                      <img src={album.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <AlbumCoverPlayOverlay item={album} />
                    </div>
                    <h4 className="text-sm text-white truncate">{album.title}</h4>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5" title={album.channelTitle}>{cleanVisualName(album.channelTitle)}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
                      <Disc className="w-3 h-3 flex-shrink-0" />
                      {album.publishedAt ? new Date(album.publishedAt).getFullYear() : ''}
                    </p>
                  </div>
                ))}
              </Carousel>
            </div>
          )}

          {/* Singles & EPs */}
          {currentChannelDetails.singles?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Singles & EPs</h2>
                <button onClick={() => setArtistSubTab('albums')}
                  className="border border-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/5 transition-colors">
                  More
                </button>
              </div>
              <Carousel className="gap-6">
                {currentChannelDetails.singles.map((album: any) => (
                  <div key={`ov-single-${album.id}`}
                    onClick={() => {
                      if (album.type === 'music') {
                        handlePlayAction(album, [album]);
                      } else {
                        setCurrentPlaylistId(album.id);
                        setActiveTab('playlist');
                      }
                    }}
                    className="group flex-shrink-0 w-[180px] cursor-pointer">
                    <div className="relative aspect-square w-full rounded-sm overflow-hidden mb-2 bg-[#1f1f1f]">
                      <img src={album.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <AlbumCoverPlayOverlay item={album} />
                    </div>
                    <h4 className="text-sm text-white truncate">{album.title}</h4>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5" title={album.channelTitle}>{cleanVisualName(album.channelTitle)}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
                      <Disc className="w-3 h-3 flex-shrink-0" />
                      {album.publishedAt ? new Date(album.publishedAt).getFullYear() : ''}
                    </p>
                  </div>
                ))}
              </Carousel>
            </div>
          )}

          {/* Featured In */}
          {currentChannelDetails.featuredPlaylists?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Featured In</h2>
              </div>
              <Carousel className="gap-6">
                {currentChannelDetails.featuredPlaylists.map((album: any) => (
                  <div key={`ov-featured-${album.id}`}
                    onClick={() => { setCurrentPlaylistId(album.id); setActiveTab('playlist'); }}
                    className="group flex-shrink-0 w-[180px] cursor-pointer">
                    <div className="relative aspect-square w-full rounded-sm overflow-hidden mb-2 bg-[#1f1f1f]">
                      <img src={album.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <AlbumCoverPlayOverlay item={album} />
                    </div>
                    <h4 className="text-sm text-white truncate">{album.title}</h4>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5" title={album.channelTitle}>{cleanVisualName(album.channelTitle)}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
                      <Disc className="w-3 h-3 flex-shrink-0" />
                      Playlist
                    </p>
                  </div>
                ))}
              </Carousel>
            </div>
          )}

          {/* Videos */}
          {currentChannelDetails.videos?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Videos</h2>
                <button onClick={() => setArtistSubTab('videos')}
                  className="border border-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/5 transition-colors">
                  More
                </button>
              </div>
              <Carousel className="gap-6">
                {currentChannelDetails.videos.slice(0, 8).map((track: Track) => (
                  <div key={`ov-vid-${track.id}`}
                    onClick={() => handlePlayAction(track, currentChannelDetails.videos)}
                    className="group flex-shrink-0 w-[240px] cursor-pointer">
                    <div className="relative aspect-video w-full rounded-sm overflow-hidden mb-2 bg-[#1f1f1f]">
                      <img src={track.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className="absolute top-1.5 left-1.5 bg-red-600/90 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm tracking-wider shadow">Video</span>
                      {track.views && (
                        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">{track.views}</span>
                      )}
                    </div>
                    <h4 className="text-sm text-white line-clamp-2">{cleanVisualName(track.title)}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">{track.views ? track.views : (track.publishedAt?.slice(0, 10) || '')}</p>
                  </div>
                ))}
              </Carousel>
            </div>
          )}

          {/* Fans might also like */}
          {currentChannelDetails.relatedArtists?.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Fans might also like</h2>
              <Carousel className="gap-6">
                {currentChannelDetails.relatedArtists.map((ch: any) => (
                  <div key={`ov-rel-${ch.id}`}
                    onClick={() => viewChannel(ch.title, ch.id)}
                    className="group flex-shrink-0 w-[150px] cursor-pointer text-center">
                    <div className="w-[150px] h-[150px] rounded-full overflow-hidden bg-[#1f1f1f] mx-auto mb-3 group-hover:scale-105 transition-transform duration-200">
                      <img src={ch.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                    </div>
                    <h4 className="text-sm text-white truncate">{cleanVisualName(ch.title)}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Artist</p>
                  </div>
                ))}
              </Carousel>
            </div>
          )}

          {/* About card */}
          {currentChannelDetails.profile?.description && (
            <div onClick={() => setArtistSubTab('about')}
              className="bg-white/5 p-5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors max-w-3xl">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">About</h4>
              <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3">{currentChannelDetails.profile.description}</p>
              <span className="text-xs font-medium text-zinc-400 mt-3 inline-block hover:text-white">Read more</span>
            </div>
          )}
        </div>
      )}

      {/* ========== TAB: SONGS ========== */}
      {artistSubTab === 'songs' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Songs</h2>
            {currentChannelDetails.topSongs?.length > 0 && (
              <button onClick={() => handlePlayAction(currentChannelDetails.topSongs[0], currentChannelDetails.topSongs)}
                className="flex items-center gap-1.5 border border-white/20 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/5 transition-colors">
                <Play className="w-3.5 h-3.5 fill-current" /> Play all
              </button>
            )}
          </div>
          {/* Table header */}
          <div className="flex items-center gap-4 px-2 py-2 text-xs text-zinc-500 uppercase tracking-wider border-b border-white/5">
            <span className="w-12 text-center flex-shrink-0">#</span>
            <span className="flex-1">Title</span>
            <span className="hidden sm:block w-48 flex-shrink-0">Artist</span>
            <span className="hidden md:block w-28 text-right flex-shrink-0">Plays</span>
            <span className="w-12 text-right flex-shrink-0"><Clock className="w-3.5 h-3.5 inline" /></span>
            <span className="w-16 flex-shrink-0"></span>
          </div>
          <div className="space-y-0">
            {currentChannelDetails.topSongs?.map((track: Track, idx: number) => {
              const isActive = isActiveTrack(currentTrack, track);
              const isCurrentPlaying = isActive && isPlaying;
              return (
                <div key={`tab-song-${track.id}`}
                  onClick={() => handlePlayAction(track, currentChannelDetails.topSongs)}
                  className={`group/row flex items-center gap-4 px-2 py-2.5 rounded-sm hover:bg-white/5 transition-colors cursor-pointer ${isActive ? 'bg-white/5' : ''}`}>
                  <div className="w-12 flex items-center justify-center text-sm text-zinc-500 flex-shrink-0">
                    {isActive ? (
                      <>
                        <div className="group-hover/row:hidden flex items-center justify-center">
                          <PlayingEqualizer isPlaying={isPlaying} />
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handlePlayAction(track, currentChannelDetails.topSongs); }}
                          className="hidden group-hover/row:flex items-center justify-center text-white">
                          {isCurrentPlaying ? <Pause className="w-4 h-4 fill-current text-[#ff0000]" /> : <Play className="w-4 h-4 fill-current ml-0.5 text-white" />}
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="group-hover/row:hidden">{idx + 1}</span>
                        <button onClick={(e) => { e.stopPropagation(); handlePlayAction(track, currentChannelDetails.topSongs); }}
                          className="hidden group-hover/row:flex items-center justify-center text-white">
                          <Play className="w-4 h-4 fill-current ml-0.5 text-white" />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <TrackCover track={track} contextTracks={currentChannelDetails.topSongs} sizeClass="w-10 h-10 rounded" />
                    <p className={`text-sm truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>{track.title}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-400 w-48 truncate flex-shrink-0">
                    <Music className="w-3.5 h-3.5 flex-shrink-0" />
                    <ArtistLinks channelTitle={track.channelTitle} channelId={track.channelId} extraClass="w-full" />
                  </div>
                  {track.views ? (
                    <div className="hidden md:block text-sm text-zinc-400 w-28 text-right flex-shrink-0">{track.views.replace(' views', ' plays')}</div>
                  ) : <div className="hidden md:block w-28 flex-shrink-0" />}
                  <div className="text-sm text-zinc-400 w-12 text-right flex-shrink-0 font-mono">{track.duration || '—'}</div>
                  <div className="flex items-center gap-1 w-16 justify-end opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); toggleLikeTrack(track); }}
                      className={`p-1 ${likedTracks.some(t => t.id === track.id) ? 'opacity-100 text-[#ff0000]' : 'text-zinc-400 hover:text-white'}`}>
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); addToQueue(track); }}
                      className="p-1 text-zinc-400 hover:text-white">
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========== TAB: ALBUMS ========== */}
      {artistSubTab === 'albums' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            {(['All', 'Albums', 'Singles & EPs'] as const).map((filter) => (
              <button key={filter} onClick={() => setAlbumFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  albumFilter === filter ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/15'
                }`}>
                {filter}
              </button>
            ))}
          </div>
          {(() => {
            const sortReleases = (items: any[]) => {
              const getReleaseTime = (dateStr: string) => {
                if (!dateStr) return 0;
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                  return date.getTime();
                }
                const match = dateStr.match(/\b(19|20)\d{2}\b/);
                if (match) {
                  const year = parseInt(match[0], 10);
                  return new Date(`${year}-01-01T00:00:00Z`).getTime();
                }
                return 0;
              };

              const getReleasePriority = (item: any) => {
                const type = (item.releaseType || 'Album').toLowerCase();
                if (type.includes('album')) return 3;
                if (type.includes('ep')) return 2;
                if (type.includes('single')) return 1;
                return 0;
              };

              return [...items].sort((a, b) => {
                const timeA = getReleaseTime(a.publishedAt);
                const timeB = getReleaseTime(b.publishedAt);
                if (timeA !== timeB) {
                  return timeB - timeA;
                }
                const prioA = getReleasePriority(a);
                const prioB = getReleasePriority(b);
                if (prioA !== prioB) {
                  return prioB - prioA;
                }
                return (a.title || '').localeCompare(b.title || '');
              });
            };

            const albumsList = (currentChannelDetails.albums || []).map((a: any) => ({ ...a, releaseType: a.releaseType || 'Album' }));
            const singlesList = (currentChannelDetails.singles || []).map((a: any) => ({ ...a, releaseType: a.releaseType || 'Single' }));
            const allPlaylists = sortReleases(
              (currentChannelDetails.allPlaylists || [...albumsList, ...singlesList]).map((item: any) => {
                if (!item.releaseType) {
                  const count = item.videoCount || 0;
                  item.releaseType = count === 1 ? 'Single' : count <= 6 ? 'EP' : 'Album';
                }
                return item;
              })
            );

            let filtered = allPlaylists;
            if (albumFilter === 'Albums') {
              filtered = allPlaylists.filter((a: any) => a.releaseType === 'Album');
            } else if (albumFilter === 'Singles & EPs') {
              filtered = allPlaylists.filter((a: any) => a.releaseType === 'Single' || a.releaseType === 'EP' || a.releaseType === 'Single/EP');
            }
            if (filtered.length === 0) return <div className="py-20 text-center text-sm text-zinc-500">No items found for this filter.</div>;
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-8">
                {filtered.map((album: any) => (
                  <div key={`tab-album-${album.id}`}
                    onClick={() => {
                      if (album.type === 'music') {
                        handlePlayAction(album, [album]);
                      } else {
                        setCurrentPlaylistId(album.id);
                        setActiveTab('playlist');
                      }
                    }}
                    className="group cursor-pointer">
                    <div className="relative aspect-square w-full rounded-sm overflow-hidden mb-2 bg-[#1f1f1f]">
                      <img src={album.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <AlbumCoverPlayOverlay item={album} />
                    </div>
                    <h4 className="text-sm text-white truncate">{album.title}</h4>
                    <p className="text-xs text-zinc-400 truncate mt-0.5" title={album.channelTitle}>{cleanVisualName(album.channelTitle)}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                      <Disc className="w-3 h-3 flex-shrink-0" />
                      <span>{(() => {
                        const label = album.releaseType || 'Album';
                        const year = album.publishedAt ? new Date(album.publishedAt).getFullYear() : null;
                        return `${label}${year ? ` · ${year}` : ''}`;
                      })()}</span>
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========== TAB: VIDEOS ========== */}
      {artistSubTab === 'videos' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Videos</h2>
            {currentChannelDetails.videos?.length > 0 && (
              <button onClick={() => handlePlayAction(currentChannelDetails.videos[0], currentChannelDetails.videos)}
                className="flex items-center gap-1.5 border border-white/20 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/5 transition-colors">
                <Play className="w-3.5 h-3.5 fill-current" /> Play all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6">
            {currentChannelDetails.videos?.map((track: Track) => {
              const isActive = isActiveTrack(currentTrack, track);
              return (
                <div key={`tab-vid-${track.id}`}
                  onClick={() => handlePlayAction(track, currentChannelDetails.videos)}
                  className="group cursor-pointer">
                  <div className="relative aspect-video w-full rounded-sm overflow-hidden mb-2 bg-[#1f1f1f]">
                    <img src={track.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute top-1.5 left-1.5 bg-red-600/90 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm tracking-wider shadow">Video</span>
                    {track.views && <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">{track.views}</span>}
                    {track.duration && <span className="absolute bottom-1.5 right-3 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded font-mono">{track.duration}</span>}
                  </div>
                  <h4 className={`text-sm line-clamp-2 ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>{track.title}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{track.views ? track.views : (track.publishedAt?.slice(0, 10) || '')}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========== TAB: ABOUT ========== */}
      {artistSubTab === 'about' && (
        <div className="space-y-6 animate-fade-in max-w-4xl">
          <h2 className="text-2xl font-bold text-white">{cleanVisualName(currentChannelDetails.profile?.title || '')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {currentChannelDetails.profile?.description || "No description available."}
              </p>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-2xl font-bold text-white">
                  {(() => {
                    const count = Number(currentChannelDetails.profile.subscriberCount || 0);
                    const adjusted = subscribedChannels.includes(currentChannelDetails.profile.id) ? count + 1 : count;
                    if (adjusted >= 1000000) return `${(adjusted / 1000000).toFixed(adjusted >= 10000000 ? 0 : 1)}M`;
                    if (adjusted >= 1000) return `${(adjusted / 1000).toFixed(0)}K`;
                    return adjusted.toLocaleString();
                  })()}
                </p>
                <p className="text-xs text-zinc-500 uppercase font-medium mt-0.5">Subscribers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{Number(currentChannelDetails.profile?.videoCount || 0).toLocaleString()}</p>
                <p className="text-xs text-zinc-500 uppercase font-medium mt-0.5">Videos</p>
              </div>
              {currentChannelDetails.profile?.customUrl && (
                <div>
                  <p className="text-sm font-medium text-white">{currentChannelDetails.profile.customUrl}</p>
                  <p className="text-xs text-zinc-500 uppercase font-medium mt-0.5">Channel URL</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
