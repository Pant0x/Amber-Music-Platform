'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Play, ChevronLeft, ChevronRight, Clock, TrendingUp } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useRouter, usePathname } from 'next/navigation';

export const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    searchQuery,
    setSearchQuery,
    searchHistory,
    addSearchQueryToHistory,
    removeSearchQueryFromHistory,
    clearSearchHistory,
    setShowNowPlaying,
    displayName,
    setDisplayName,
    avatarUrl,
    setAvatarUrl,
    playlists,
    likedTracks,
    subscribedChannels,
    history
  } = usePlayerStore();

  const [mounted, setMounted] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [tempAvatarUrl, setTempAvatarUrl] = useState('');
  const [trendingQueries, setTrendingQueries] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch trending searches on mount
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch('/api/search/trending');
        if (res.ok) {
          const list = await res.json();
          setTrendingQueries(list);
        }
      } catch (err) {
        console.error('Trending fetch error:', err);
      }
    };
    fetchTrending();
  }, []);

  // Sync edit states when displayName/avatarUrl resolve
  useEffect(() => {
    setNewName(displayName || '');
  }, [displayName]);

  useEffect(() => {
    setTempAvatarUrl(avatarUrl || '');
  }, [avatarUrl]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Autocomplete suggestions fetcher
  useEffect(() => {
    if (!searchQuery || !searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const list = await res.json();
          setSuggestions(list);
        }
      } catch (err) {
        console.error('Suggestions fetch error:', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside detection to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectQuery = (query: string) => {
    setSearchQuery(query);
    addSearchQueryToHistory(query);
    setShowDropdown(false);
    if (pathname !== '/search') {
      setShowNowPlaying(false);
      router.push('/search');
    }
  };

  const handleSearchClear = () => {
    setSearchQuery('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
    if (e.key === 'Enter') {
      const q = searchQuery.trim();
      if (q) {
        selectQuery(q);
      }
    }
  };

  const handleLogoClick = () => {
    setShowNowPlaying(false);
    router.push('/');
  };

  return (
    <header className="h-16 w-full bg-[#030303] border-b border-white/5 px-6 flex items-center justify-between select-none z-30 flex-shrink-0">

      {/* 1. LEFT SIDE: Brand Logo & Navigation Chevrons */}
      <div className="flex items-center gap-6 flex-shrink-0">
        <div onClick={handleLogoClick} className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#ff0000] flex items-center justify-center text-white">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
            Pantooty <span className="font-light text-zinc-400">Music</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 p-1 rounded-full min-h-[30px] min-w-[70px]">
          {mounted && (
            <>
              <button
                onClick={() => router.back()}
                className="p-1.5 rounded-full transition-colors hover:bg-white/10 text-zinc-400 hover:text-white"
                title="Back"
                aria-label="Back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.forward()}
                className="p-1.5 rounded-full transition-colors hover:bg-white/10 text-zinc-400 hover:text-white"
                title="Forward"
                aria-label="Forward"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. CENTER SIDE: Wide Search Pill */}
      <div className="flex-1 max-w-2xl mx-12 hidden md:block" ref={dropdownRef}>
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
              if (pathname !== '/search') {
                setShowNowPlaying(false);
                router.push('/search');
              }
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search songs, albums, artists, channels..."
            className="w-full bg-[#1f1f1f] text-white text-sm pl-12 pr-10 py-2.5 rounded-full outline-none placeholder-zinc-400 border border-transparent focus:border-zinc-850 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={handleSearchClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Suggestions Dropdown */}
          {showDropdown && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#161616]/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 py-3 animate-fade-in max-h-[420px] overflow-y-auto custom-scrollbar select-none">
              
              {/* Context: Query is NOT empty - display autocomplete suggestions */}
              {searchQuery.trim().length > 0 ? (
                <div className="space-y-1">
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={`suggestion-${idx}`}
                      onClick={() => selectQuery(suggestion)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 cursor-pointer text-sm text-zinc-200 hover:text-white transition-colors"
                    >
                      <Search className="w-4 h-4 text-zinc-500" />
                      <span className="font-medium truncate">{suggestion}</span>
                    </div>
                  ))}
                  {suggestions.length === 0 && (
                    <div className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-500">
                      <Search className="w-4 h-4" />
                      <span className="font-medium truncate">Search for "{searchQuery}"</span>
                    </div>
                  )}
                </div>
              ) : (
                // Context: Query IS empty - display Recent Searches & Recommended/Trending
                <div className="space-y-4">
                  {/* Recent Searches */}
                  {searchHistory && searchHistory.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-4 pb-1">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Recent searches</span>
                        <button
                          onClick={clearSearchHistory}
                          className="text-[10px] font-semibold text-zinc-400 hover:text-white transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="space-y-0.5 max-h-[160px] overflow-y-auto">
                        {[...searchHistory].reverse().map((item, idx) => (
                          <div
                            key={`history-${idx}`}
                            onClick={() => selectQuery(item)}
                            className="group flex items-center justify-between px-4 py-2 hover:bg-white/5 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3 text-sm text-zinc-300 group-hover:text-white truncate">
                              <Clock className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                              <span className="truncate font-medium">{item}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSearchQueryFromHistory(item);
                              }}
                              className="text-zinc-500 hover:text-white p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete from history"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended/Trending Artists & Genres */}
                  <div>
                    <div className="px-4 pb-1">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" /> Recommended
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-3">
                      {(trendingQueries && trendingQueries.length > 0
                        ? trendingQueries
                        : [
                            { name: 'Yeat', type: 'Artist' },
                            { name: 'Drake', type: 'Artist' },
                            { name: 'Don Toliver', type: 'Artist' },
                            { name: 'The Beatles', type: 'Artist' },
                            { name: 'Travis Scott', type: 'Artist' },
                            { name: 'Lofi Chill', type: 'Genre' }
                          ]
                      ).map((item) => (
                        <div
                          key={item.name}
                          onClick={() => selectQuery(item.name)}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer border border-white/5 transition-all text-left group"
                        >
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-zinc-200 group-hover:text-white truncate transition-colors">{item.name}</h4>
                            <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-wider font-semibold">{item.type}</p>
                          </div>
                          <Search className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* 3. RIGHT SIDE: Profile Avatar */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Mobile Search Button */}
        <button
          onClick={() => {
            if (pathname !== '/search') {
              setShowNowPlaying(false);
              router.push('/search');
            }
          }}
          className="p-2 text-zinc-400 hover:text-white md:hidden"
        >
          <Search className="w-5 h-5" />
        </button>

        <div
          onClick={() => {
            setShowNowPlaying(false);
            router.push('/profile');
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:scale-105 transition-transform uppercase select-none relative overflow-hidden shadow-md ${
            avatarUrl && avatarUrl.startsWith('bg-') ? avatarUrl : 'bg-[#0055ff]'
          }`}
          title={`Profile: ${displayName || 'Anonymous Listener'}`}
        >
          {avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('/')) ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            displayName ? displayName.charAt(0) : 'A'
          )}
        </div>
      </div>

    </header>
  );
};
