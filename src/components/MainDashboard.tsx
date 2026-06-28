'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Track, Playlist } from '@/types/music-player';
import { cleanVisualName, parseFeaturedArtists } from '@/utils/text';
import {
  Play,
  Pause,
  Clock,
  Music,
  Heart,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  PlusCircle,
  Disc,
  MoreHorizontal,
  Compass,
  Library,
  User,
  Check,
  Radio,
  Shuffle,
  Search
} from 'lucide-react';

const MOOD_CHIPS = [
  { id: 'focus', label: 'Focus' },
  { id: 'energize', label: 'Energize' },
  { id: 'relax', label: 'Relax' },
  { id: 'commute', label: 'Commute' },
  { id: 'workout', label: 'Workout' }
];



const ExplicitBadge = () => (
  <span className="inline-flex items-center justify-center bg-zinc-600/80 text-white text-[9px] font-bold px-1 py-0.5 rounded-sm mx-1.5 leading-none h-[14px]">
    E
  </span>
);

const Carousel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = 'gap-4' }) => {
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

export const MainDashboard: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    addToQueue,
    playlists,
    likedTracks,
    toggleLikeTrack,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    activeTab,
    setActiveTab,
    currentPlaylistId,
    setCurrentPlaylistId,
    deletePlaylist,
    createPlaylist,
    searchQuery,
    setSearchQuery,
    selectedMood,
    setSelectedMood,
    searchHistory,
    addSearchQueryToHistory,
    history,
    currentChannelId,
    currentChannelDetails,
    setCurrentChannelId,
    fetchChannelDetails,
    viewChannel,
    subscribedChannels,
    toggleSubscribeChannel,
    playArtistRadio
  } = usePlayerStore();

  const [loading, setLoading] = useState(false);
  const [searchTopResult, setSearchTopResult] = useState<any>(null);
  const [searchSongs, setSearchSongs] = useState<Track[]>([]);
  const [searchVideos, setSearchVideos] = useState<any[]>([]);
  const [searchArtists, setSearchArtists] = useState<any[]>([]);
  const [searchAlbums, setSearchAlbums] = useState<any[]>([]);
  const [searchPlaylists, setSearchPlaylists] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState<'all' | 'songs' | 'videos' | 'artists' | 'albums' | 'playlists'>('all');
  
  // Recommendations state
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Explore states
  const [exploreCharts, setExploreCharts] = useState<Track[]>([]);
  const [exploreNewReleases, setExploreNewReleases] = useState<Track[]>([]);
  const [exploreLoading, setExploreLoading] = useState(false);

  // Artist view sub-tab
  const [artistSubTab, setArtistSubTab] = useState<'overview' | 'songs' | 'albums' | 'videos' | 'about'>('overview');

  const renderArtistLinks = (channelTitle: string, channelId?: string, extraClass = "") => {
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

  // YouTube Playlist state
  const [ytPlaylistDetails, setYtPlaylistDetails] = useState<any>(null);
  const [ytPlaylistLoading, setYtPlaylistLoading] = useState(false);

  // Album filter for Albums tab
  const [albumFilter, setAlbumFilter] = useState<'All' | 'Albums' | 'Singles & EPs'>('All');

  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Sync Recommendations (Stage 1 & 2 via server POST)
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

  // Explore Tab Loader
  useEffect(() => {
    if (activeTab === 'explore') {
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
    }
  }, [activeTab]);

  // Hydrate Channel Details
  useEffect(() => {
    if (activeTab === 'channel' && currentChannelId) {
      const isName = !currentChannelId.startsWith('UC');
      fetchChannelDetails(currentChannelId, isName);
      setArtistSubTab('overview');
    }
  }, [activeTab, currentChannelId, fetchChannelDetails]);

  // Load YouTube Playlist Details & Tracks if not local
  useEffect(() => {
    if (activeTab === 'playlist' && currentPlaylistId) {
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
            console.error('Error fetching YouTube playlist details:', err);
          })
          .finally(() => {
            setYtPlaylistLoading(false);
          });
      } else {
        setYtPlaylistDetails(null);
      }
    } else {
      setYtPlaylistDetails(null);
    }
  }, [activeTab, currentPlaylistId, playlists]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handlePlayAction = (track: Track, contextTracks: Track[] = []) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, contextTracks);
    }
  };

  const activePlaylist = activeTab === 'playlist' ? playlists.find(p => p.id === currentPlaylistId) : null;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 select-none bg-[#030303] custom-scrollbar">
      
      {/* VIEW A: HOME VIEW */}
      {activeTab === 'home' && (
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
              <div className="flex items-center gap-2 py-16 text-xs text-zinc-500 font-semibold">
                <Disc className="w-5 h-5 animate-spin text-[#ff0000]" /> Generating candidate pool...
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
                        const isActive = currentTrack?.id === track.id;
                        const isCurrentPlaying = isActive && isPlaying;
                        return (
                          <div
                            key={`qp-${track.id}`}
                            onClick={() => handlePlayAction(track, recommendations)}
                            className={`group flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer ${
                              isActive ? 'bg-white/5' : ''
                            }`}
                          >
                            <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden shadow">
                              <img src={track.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayAction(track, recommendations);
                                }}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                              >
                                {isCurrentPlaying ? (
                                  <Pause className="w-5 h-5 fill-current text-[#ff0000]" />
                                ) : (
                                  <Play className="w-5 h-5 fill-current ml-0.5 text-white" />
                                )}
                              </button>
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-bold truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                                {track.title}
                                {track.isExplicit && <ExplicitBadge />}
                              </p>
                              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{renderArtistLinks(track.channelTitle, track.channelId)}</p>
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
                    onClick={() => handlePlayAction(track, history)}
                    className="group bg-[#0d0d0d] hover:bg-[#1a1a1a] p-3 rounded-lg transition-all duration-200 cursor-pointer relative shadow-lg flex-shrink-0 w-36 sm:w-44 snap-start border border-white/5"
                  >
                    <div className="relative aspect-square w-full rounded-md mb-3 overflow-hidden bg-[#1f1f1f]">
                      <img src={track.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAction(track, history);
                        }}
                        className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#ff0000] text-white shadow-xl flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 hover:scale-105 z-10"
                      >
                        {isPlaying && currentTrack?.id === track.id ? (
                          <Pause className="w-3.5 h-3.5 fill-current text-white" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5 text-white" />
                        )}
                      </button>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate mb-0.5">{track.title}</h4>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">{renderArtistLinks(track.channelTitle, track.channelId)}</p>
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
                    onClick={() => handlePlayAction(track, recommendations)}
                    className="group bg-[#0d0d0d] hover:bg-[#1a1a1a] p-3 rounded-lg transition-all duration-200 cursor-pointer relative shadow-lg flex-shrink-0 w-36 sm:w-44 snap-start border border-white/5"
                  >
                    <div className="relative aspect-square w-full rounded-md mb-3 overflow-hidden bg-[#1f1f1f]">
                      <img src={track.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAction(track, recommendations);
                        }}
                        className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#ff0000] text-white shadow-xl flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 hover:scale-105 z-10"
                      >
                        {isPlaying && currentTrack?.id === track.id ? (
                          <Pause className="w-3.5 h-3.5 fill-current text-white" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5 text-white" />
                        )}
                      </button>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate mb-0.5">{track.title}</h4>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">{renderArtistLinks(track.channelTitle, track.channelId)}</p>
                  </div>
                ))}
              </Carousel>
            </div>
          )}
        </div>
      )}

      {/* VIEW B: EXPLORE VIEW */}
      {activeTab === 'explore' && (
        <div className="animate-fade-in space-y-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Explore</h1>

          {exploreLoading ? (
            <div className="flex items-center gap-2 py-16 text-xs text-zinc-500 font-semibold">
              <Disc className="w-5 h-5 animate-spin text-[#ff0000]" /> Loading real-time music trends...
            </div>
          ) : (
            <>
              {/* New Releases Section */}
              {exploreNewReleases.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h2 className="text-xl font-bold text-white tracking-tight">New releases</h2>
                  <Carousel>
                    {exploreNewReleases.map((track) => (
                      <div
                        key={`new-rel-${track.id}`}
                        onClick={() => handlePlayAction(track, exploreNewReleases)}
                        className="group bg-[#0d0d0d] hover:bg-[#1a1a1a] p-3 rounded-lg transition-all duration-200 cursor-pointer relative shadow-lg flex-shrink-0 w-36 sm:w-44 snap-start border border-white/5"
                      >
                        <div className="relative aspect-square w-full rounded-md mb-3 overflow-hidden bg-[#1f1f1f]">
                          <img src={track.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayAction(track, exploreNewReleases);
                            }}
                            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#ff0000] text-white shadow-xl flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 hover:scale-105 z-10"
                          >
                            {isPlaying && currentTrack?.id === track.id ? (
                              <Pause className="w-3.5 h-3.5 fill-current text-white" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5 text-white" />
                            )}
                          </button>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate mb-0.5">{track.title}</h4>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">{renderArtistLinks(track.channelTitle, track.channelId)}</p>
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
                    {exploreCharts.map((track) => (
                      <div
                        key={`chart-${track.id}`}
                        onClick={() => handlePlayAction(track, exploreCharts)}
                        className="group bg-[#0d0d0d] hover:bg-[#1a1a1a] p-3 rounded-lg transition-all duration-200 cursor-pointer relative shadow-lg flex-shrink-0 w-36 sm:w-44 snap-start border border-white/5"
                      >
                        <div className="relative aspect-square w-full rounded-md mb-3 overflow-hidden bg-[#1f1f1f]">
                          <img src={track.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayAction(track, exploreCharts);
                            }}
                            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#ff0000] text-white shadow-xl flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 hover:scale-105 z-10"
                          >
                            {isPlaying && currentTrack?.id === track.id ? (
                              <Pause className="w-3.5 h-3.5 fill-current text-white" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5 text-white" />
                            )}
                          </button>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate mb-0.5">{track.title}</h4>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">{renderArtistLinks(track.channelTitle, track.channelId)}</p>
                      </div>
                    ))}
                  </Carousel>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* VIEW C: SEARCH RESULTS VIEW — YouTube Music Style */}
      {activeTab === 'search' && (
        <div className="animate-fade-in space-y-6">
          {/* Search Header */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Mobile Search Input */}
            <div className="relative w-full max-w-md md:hidden">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    addSearchQueryToHistory(searchQuery);
                  }
                }}
                placeholder="Search songs, albums, artists..."
                className="w-full bg-[#1f1f1f] text-white text-sm pl-11 pr-10 py-2.5 rounded-full outline-none placeholder-zinc-500 border border-white/5 focus:border-zinc-800 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {loading && <Disc className="w-5 h-5 text-zinc-500 animate-spin" />}
            </div>
          </div>

          {/* Filter Chips */}
          {searchQuery && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {(['all', 'songs', 'videos', 'artists', 'albums', 'playlists'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setSearchFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                    searchFilter === f
                      ? 'bg-white text-black border-white'
                      : 'bg-[#1f1f1f] text-zinc-300 border-white/10 hover:bg-[#2a2a2a] hover:border-white/20'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}

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
                          src={searchTopResult.thumbnailUrl   || undefined}
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
                          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
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
                              <img src={track.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-10 h-10 object-cover rounded bg-[#1f1f1f] flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-medium truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                                  {track.title}
                                  {track.isExplicit && <ExplicitBadge />}
                                </p>
                                <p className="text-xs text-zinc-400 truncate mt-0.5">{renderArtistLinks(track.channelTitle, track.channelId)}</p>
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
                          <img src={album.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-[#ff0000] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-lg">
                              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                            </div>
                          </div>
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
                          <img src={vid.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
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
                        <div className="aspect-square rounded-lg overflow-hidden bg-[#1f1f1f] mb-2 shadow-md group-hover:shadow-xl transition-shadow">
                          <img src={pl.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
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
                    <img src={track.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-10 h-10 object-cover rounded bg-[#1f1f1f] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                        {track.title}{track.isExplicit && <ExplicitBadge />}
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{renderArtistLinks(track.channelTitle, track.channelId)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleLikeTrack(track)} className={`p-1 transition-colors opacity-0 group-hover/row:opacity-100 ${likedTracks.some(t => t.id === track.id) ? 'opacity-100 text-[#ff0000]' : 'text-zinc-400 hover:text-white'}`}><Heart className="w-4 h-4 fill-current" /></button>
                      <button onClick={() => addToQueue(track)} className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10">+ Queue</button>
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
                    <img src={vid.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
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
                    <img src={album.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#ff0000] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-lg">
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      </div>
                    </div>
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
                  <div className="aspect-square rounded-lg overflow-hidden bg-[#1f1f1f] mb-2 shadow-md group-hover:shadow-xl transition-shadow">
                    <img src={pl.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
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

      {/* VIEW D: PLAYLIST VIEW */}
      {activeTab === 'playlist' && (
        activePlaylist ? (
          <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row items-end gap-6 bg-gradient-to-b from-zinc-900/50 to-[#030303] -mx-6 p-6 pt-12">
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
                  const isActive = currentTrack?.id === track.id;
                  const isCurrentPlaying = isActive && isPlaying;
                  return (
                    <div
                      key={track.id}
                      onDoubleClick={() => handlePlayAction(track, activePlaylist.tracks)}
                      className={`group/row flex items-center gap-4 p-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors duration-150 ${
                        isActive ? 'bg-white/5' : ''
                      }`}
                    >
                      <div className="w-8 flex items-center justify-center text-xs text-zinc-500 relative flex-shrink-0">
                        <span className="group-hover/row:hidden">{i + 1}</span>
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
                      </div>

                      <img
                        src={track.thumbnailUrl   || undefined}
                        referrerPolicy="no-referrer"
                        alt=""
                        className="w-10 h-10 object-cover rounded bg-[#1f1f1f] flex-shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                          {track.title}
                          {track.isExplicit && <ExplicitBadge />}
                        </p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5 inline-block">{renderArtistLinks(track.channelTitle, track.channelId)}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTrackFromPlaylist(activePlaylist.id, track.id);
                          }}
                          className="opacity-0 group-hover/row:opacity-100 text-zinc-500 hover:text-white p-1"
                          title="Remove track"
                        >
                          <X className="w-4 h-4" />
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
            <div className="flex flex-col md:flex-row items-end gap-6 bg-gradient-to-b from-zinc-900/10 to-[#030303] -mx-6 p-6 pt-12 border-b border-white/5">
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
            <div className="flex flex-col md:flex-row items-end gap-6 bg-gradient-to-b from-zinc-900/40 to-[#030303] -mx-6 p-6 pt-12 border-b border-white/5">
              {ytPlaylistDetails.metadata?.thumbnailUrl ? (
                <img
                  src={ytPlaylistDetails.metadata.thumbnailUrl   || undefined}
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
                  {renderArtistLinks(
                    ytPlaylistDetails.metadata?.channelTitle || '',
                    ytPlaylistDetails.metadata?.channelId,
                    "text-white font-bold inline-flex flex-wrap text-xs"
                  )}
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
                  const isActive = currentTrack?.id === track.id;
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
                        <span className="group-hover/row:hidden">{i + 1}</span>
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
                      </div>

                      <img
                        src={track.thumbnailUrl   || undefined}
                        referrerPolicy="no-referrer"
                        alt=""
                        className="w-10 h-10 object-cover rounded bg-[#1f1f1f] flex-shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                          {track.title}
                          {track.isExplicit && <ExplicitBadge />}
                        </p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5 inline-block">{renderArtistLinks(track.channelTitle, track.channelId)}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLikeTrack(track);
                          }}
                          className={`p-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity ${
                            likedTracks.some(t => t.id === track.id) ? 'opacity-100 text-[#ff0000]' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToQueue(track);
                          }}
                          className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
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
        )
      )}

      {/* VIEW E: LIKED MUSIC VIEW */}
      {activeTab === 'liked' && (
        <div className="animate-fade-in space-y-6">
          <div className="flex flex-col md:flex-row items-end gap-6 bg-gradient-to-b from-[#b30000]/40 to-[#030303] -mx-6 p-6 pt-12">
            <div className="w-48 h-48 bg-gradient-to-br from-[#ff0000] to-[#b30000] rounded-lg flex items-center justify-center shadow-2xl border border-white/10 flex-shrink-0 animate-pulse">
              <Heart className="w-20 h-20 text-white fill-current" />
            </div>
            <div className="space-y-2 min-w-0">
              <span className="text-xs font-bold text-[#ff0000] uppercase tracking-widest font-mono">Auto Playlist</span>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight truncate">
                Liked Music
              </h1>
              <div className="text-xs text-zinc-400 font-semibold flex items-center gap-1.5">
                <span>Guest</span>
                <span>•</span>
                <span>{likedTracks.length} songs</span>
              </div>
            </div>
          </div>

          {/* Action play */}
          {likedTracks.length > 0 && (
            <button
              onClick={() => handlePlayAction(likedTracks[0], likedTracks)}
              className="flex items-center gap-2 bg-[#ff0000] hover:bg-[#cc0000] text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-lg uppercase tracking-wider"
            >
              <Play className="w-4 h-4 fill-current text-white" /> Play
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
                const isActive = currentTrack?.id === track.id;
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
                      <span className="group-hover/row:hidden">{i + 1}</span>
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
                    </div>

                    <img
                      src={track.thumbnailUrl   || undefined}
                      referrerPolicy="no-referrer"
                      alt=""
                      className="w-10 h-10 object-cover rounded bg-[#1f1f1f] flex-shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                        {track.title}
                        {track.isExplicit && <ExplicitBadge />}
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5 inline-block">{renderArtistLinks(track.channelTitle, track.channelId)}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLikeTrack(track);
                        }}
                        className="text-[#ff0000] hover:text-white p-1 transition-colors"
                        title="Unlike"
                      >
                        <Heart className="w-4.5 h-4.5 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW F: YOUTUBE CHANNEL EXPLORER */}
      {activeTab === 'channel' && (
        currentChannelDetails ? (
          <div className="animate-fade-in space-y-0">
            
            {/* Header Banner - Spotify/YT Music 1:1 Layout */}
            <div 
              className="min-h-[350px] sm:min-h-[500px] -mx-6 -mt-6 bg-cover bg-center relative flex flex-col justify-end p-6 sm:p-10"
              style={{ backgroundImage: `url(${currentChannelDetails.profile?.bannerUrl || currentChannelDetails.profile?.avatarUrl})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030303]/40 to-[#030303]"></div>
              
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
                        const isActive = currentTrack?.id === track.id;
                        const isCurrentPlaying = isActive && isPlaying;
                        return (
                          <div
                            key={`ov-song-${track.id}`}
                            onClick={() => handlePlayAction(track, currentChannelDetails.topSongs)}
                            className={`group/row flex items-center gap-4 px-2 py-2.5 rounded-sm hover:bg-white/5 transition-colors cursor-pointer ${isActive ? 'bg-white/5' : ''}`}
                          >
                            <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden">
                              <img src={track.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center">
                                {isCurrentPlaying ? <Pause className="w-5 h-5 fill-current text-white" /> : <Play className="w-5 h-5 fill-current ml-0.5 text-white" />}
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>
                                {track.title}
                                {track.isExplicit && <ExplicitBadge />}
                              </p>
                              <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-400 w-48 truncate flex-shrink-0">
                               <Music className="w-3.5 h-3.5 flex-shrink-0" />
                               {renderArtistLinks(track.channelTitle, track.channelId, "w-full")}
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
                          onClick={() => { setCurrentPlaylistId(album.id); setActiveTab('playlist'); }}
                          className="group flex-shrink-0 w-[180px] cursor-pointer">
                          <div className="relative aspect-square w-full rounded-sm overflow-hidden mb-2 bg-[#1f1f1f]">
                            <img src={album.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
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
                          onClick={() => { setCurrentPlaylistId(album.id); setActiveTab('playlist'); }}
                          className="group flex-shrink-0 w-[180px] cursor-pointer">
                          <div className="relative aspect-square w-full rounded-sm overflow-hidden mb-2 bg-[#1f1f1f]">
                            <img src={album.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
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
                            <img src={track.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
                            <img src={ch.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
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
                    const isActive = currentTrack?.id === track.id;
                    const isCurrentPlaying = isActive && isPlaying;
                    return (
                      <div key={`tab-song-${track.id}`}
                        onClick={() => handlePlayAction(track, currentChannelDetails.topSongs)}
                        className={`group/row flex items-center gap-4 px-2 py-2.5 rounded-sm hover:bg-white/5 transition-colors cursor-pointer ${isActive ? 'bg-white/5' : ''}`}>
                        <div className="w-12 flex items-center justify-center text-sm text-zinc-500 flex-shrink-0">
                          <span className="group-hover/row:hidden">{idx + 1}</span>
                          <button onClick={(e) => { e.stopPropagation(); handlePlayAction(track, currentChannelDetails.topSongs); }}
                            className="hidden group-hover/row:flex items-center justify-center text-white">
                            {isCurrentPlaying ? <Pause className="w-4 h-4 fill-current text-white" /> : <Play className="w-4 h-4 fill-current ml-0.5 text-white" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img src={track.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" />
                          <p className={`text-sm truncate ${isActive ? 'text-[#ff0000]' : 'text-white'}`}>{track.title}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-400 w-48 truncate flex-shrink-0">
                          <Music className="w-3.5 h-3.5 flex-shrink-0" />
                          {renderArtistLinks(track.channelTitle, track.channelId, "w-full")}
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
                          onClick={() => { setCurrentPlaylistId(album.id); setActiveTab('playlist'); }}
                          className="group cursor-pointer">
                          <div className="relative aspect-square w-full rounded-sm overflow-hidden mb-2 bg-[#1f1f1f]">
                            <img src={album.thumbnailUrl  || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
                    const isActive = currentTrack?.id === track.id;
                    return (
                      <div key={`tab-vid-${track.id}`}
                        onClick={() => handlePlayAction(track, currentChannelDetails.videos)}
                        className="group cursor-pointer">
                        <div className="relative aspect-video w-full rounded-sm overflow-hidden mb-2 bg-[#1f1f1f]">
                          <img src={track.thumbnailUrl   || undefined} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
        ) : (
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
        )
      )}

      {/* VIEW G: GENERAL LIBRARY FALLBACK VIEW */}
      {activeTab === 'library' && (
        <div className="animate-fade-in space-y-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Library</h1>
          
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight">Playlists</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              
              {/* Liked songs card */}
              <div
                onClick={() => {
                  setActiveTab('liked');
                  setCurrentPlaylistId(null);
                }}
                className="group bg-[#0d0d0d] hover:bg-[#1a1a1a] p-4 rounded-lg transition-all duration-200 cursor-pointer shadow-lg relative"
              >
                <div className="aspect-square w-full rounded bg-gradient-to-br from-[#ff0000] to-[#b30000] flex items-center justify-center mb-3">
                  <Heart className="w-12 h-12 text-white fill-current" />
                </div>
                <h4 className="text-xs font-bold text-white truncate mb-0.5">Liked Music</h4>
                <p className="text-[10px] text-zinc-400">Playlist • {likedTracks.length} songs</p>
              </div>

              {/* User playlists */}
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => {
                    setCurrentPlaylistId(pl.id);
                    setActiveTab('playlist');
                  }}
                  className="group bg-[#0d0d0d] hover:bg-[#1a1a1a] p-4 rounded-lg transition-all duration-200 cursor-pointer shadow-lg relative border border-white/5"
                >
                  <div className="aspect-square w-full rounded bg-[#1f1f1f] flex items-center justify-center mb-3">
                    <Music className="w-10 h-10 text-zinc-600" />
                  </div>
                  <h4 className="text-xs font-bold text-white truncate mb-0.5">{pl.name}</h4>
                  <p className="text-[10px] text-zinc-400">Playlist • {pl.tracks.length} songs</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
