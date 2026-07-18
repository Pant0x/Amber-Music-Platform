'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { ExplicitBadge, PlayingEqualizer } from './pages/shared';
import { cleanVisualName, parseFeaturedArtists } from '@/utils/text';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Heart,
  Music,
  Video,
  Volume2,
  VolumeX,
  Trash2,
  X,
  ListMusic,
  History,
  Laptop,
  Tv,
  HelpCircle,
  Info,
  ExternalLink
} from 'lucide-react';

const upgradeThumbnailUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.includes('googleusercontent.com')) {
    return url.replace(/=w\d+-h\d+.*$/, '=w544-h544-l90-rj').replace(/=s\d+.*$/, '=w544-h544-l90-rj');
  }
  if (url.includes('i.ytimg.com/vi/') || url.includes('img.youtube.com/vi/')) {
    const cleanUrl = url.split('?')[0];
    return cleanUrl.replace(/\/(default|mqdefault|sddefault|hqdefault|maxresdefault)\.jpg/, '/hqdefault.jpg');
  }
  return url;
};

const formatTime = (secs: number) => {
  if (isNaN(secs)) return '0:00';
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const PlayerDock: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    likedTracks,
    toggleLikeTrack,
    nextTrack,
    prevTrack,
    togglePlay,
    playedSeconds,
    duration,
    setSeekTrigger,
    repeatMode,
    setRepeatMode,
    volume,
    setVolume,
    rightSidebarView,
    setRightSidebarView,
    queue,
    history,
    removeFromQueue,
    clearQueue,
    playTrack,
    viewChannel,
    currentChannelDetails,
    subscribedChannels,
    toggleSubscribeChannel,
    currentChannelId,
    fetchChannelDetails
  } = usePlayerStore();

  // Fetch artist channel details (PFP, monthly listeners, bio) when track changes
  useEffect(() => {
    if (currentTrack?.channelTitle) {
      fetchChannelDetails(currentTrack.channelTitle, true);
    }
  }, [currentTrack?.id, currentTrack?.channelTitle, fetchChannelDetails]);

  if (!currentTrack) return null;

  const parsed = parseFeaturedArtists(currentTrack.title);
  const isLiked = likedTracks.some((t) => t.id === currentTrack.id);

  // 1. QUEUE SIDEBAR VIEW
  if (rightSidebarView === 'queue') {
    return (
      <div 
        className="hidden lg:flex w-[380px] flex-col select-none h-full flex-shrink-0 overflow-hidden relative z-20 transition-all duration-1000 p-6"
        style={{ background: 'var(--theme-player-bg, #0a0909)' }}
      >
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Play Queue</h3>
            <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-zinc-300">
              {queue.length}
            </span>
          </div>
          <button 
            onClick={() => setRightSidebarView('now-playing')}
            className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all"
            title="Close Queue"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pr-1">
          {/* Currently Playing Track */}
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Now playing</span>
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
              <img 
                src={upgradeThumbnailUrl(currentTrack.thumbnailUrl) || undefined} 
                className="w-10 h-10 rounded-md object-cover flex-shrink-0" 
                alt="" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = currentTrack.thumbnailUrl || '';
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{parsed.title}</p>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5 font-semibold">{currentTrack.channelTitle}</p>
              </div>
              <PlayingEqualizer isPlaying={isPlaying} />
            </div>
          </div>

          {/* Next Up */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Next up</span>
              {queue.length > 0 && (
                <button onClick={clearQueue} className="text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-all">
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
            
            <div className="space-y-1">
              {queue.map((track, idx) => {
                const trParsed = parseFeaturedArtists(track.title);
                return (
                  <div 
                    key={`q-${track.id}-${idx}`}
                    onClick={() => playTrack(track, queue.slice(idx + 1))}
                    className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all duration-200"
                  >
                    <img 
                      src={upgradeThumbnailUrl(track.thumbnailUrl) || undefined} 
                      className="w-9 h-9 rounded-md object-cover flex-shrink-0" 
                      alt="" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = track.thumbnailUrl || '';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{trParsed.title}</p>
                      <p className="text-[10px] text-zinc-450 truncate mt-0.5 font-medium">{track.channelTitle}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFromQueue(track.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white hover:bg-white/5 rounded-md transition-all"
                      title="Remove from queue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              {queue.length === 0 && (
                <p className="text-zinc-500 text-xs italic py-4 text-center">Queue is empty.</p>
              )}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Recently played</span>
              <div className="space-y-1">
                {history.slice(-10).reverse().map((track, idx) => {
                  const histParsed = parseFeaturedArtists(track.title);
                  return (
                    <div 
                      key={`h-${track.id}-${idx}`}
                      onClick={() => playTrack(track)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all duration-200"
                    >
                      <img 
                        src={upgradeThumbnailUrl(track.thumbnailUrl) || undefined} 
                        className="w-9 h-9 rounded-md object-cover flex-shrink-0" 
                        alt="" 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = track.thumbnailUrl || '';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{histParsed.title}</p>
                        <p className="text-[10px] text-zinc-450 truncate mt-0.5 font-medium">{track.channelTitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. CONNECT SIDEBAR VIEW
  if (rightSidebarView === 'connect') {
    return (
      <div 
        className="hidden lg:flex w-[380px] flex-col select-none h-full flex-shrink-0 overflow-hidden relative z-20 transition-all duration-1000 p-6"
        style={{ background: 'var(--theme-player-bg, #0a0909)' }}
      >
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h3 className="text-base font-bold text-white">Connect to a device</h3>
          <button 
            onClick={() => setRightSidebarView('now-playing')}
            className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all"
            title="Close Connect"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
          {/* Active device */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-[#1db954]/25 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-[#1db954]/10 flex items-center justify-center flex-shrink-0 text-[#1db954]">
              <Laptop className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#1db954]">Wired Connection</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">Active Listening</p>
            </div>
          </div>

          {/* LG TV Available Device */}
          <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition-all duration-200">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 text-zinc-400">
              <Tv className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-350">[LG] webOS TV UP7750PVB</p>
            </div>
          </div>
        </div>

        {/* Bottom Menu help triggers */}
        <div className="mt-auto border-t border-white/5 pt-4 space-y-3 flex-shrink-0 text-[11px] font-semibold text-zinc-400">
          <a href="#" className="flex items-center justify-between hover:text-white transition-colors py-1">
            <span>Don't see your device?</span>
            <HelpCircle className="w-3.5 h-3.5" />
          </a>
          <a href="#" className="flex items-center justify-between hover:text-white transition-colors py-1">
            <span>What can I connect to?</span>
            <Info className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // 3. NOW PLAYING SIDEBAR VIEW (DEFAULT)

  return (
    <div 
      className="hidden lg:flex w-[380px] flex-col select-none h-full flex-shrink-0 overflow-hidden relative z-20 transition-all duration-1000"
      style={{ background: 'var(--theme-player-bg, #0a0909)' }}
    >
      
      {/* Scrollable Container for Player & Lyrics */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-6">
        
        {/* Album Art / Video Player Frame */}
        <div 
          className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-900 border flex-shrink-0 transition-all duration-1000"
          style={{ boxShadow: '0 20px 45px -10px var(--theme-glow)', borderColor: 'var(--theme-border)' }}
        >
          <img
            src={upgradeThumbnailUrl(currentTrack.thumbnailUrl) || undefined}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = currentTrack.thumbnailUrl || '';
            }}
            alt={currentTrack.title}
            className="w-full h-full object-cover select-none"
          />
        </div>

        {/* Title, Artist, & Like Button */}
        <div className="mt-5 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1 pr-4">
              <h2 className="text-lg font-bold text-white leading-snug truncate flex items-center gap-1.5" title={parsed.title}>
                {parsed.title}
                {currentTrack.isExplicit && <ExplicitBadge />}
              </h2>
              <p className="text-sm font-semibold text-zinc-400 truncate mt-0.5" title={currentTrack.channelTitle}>
                {currentTrack.channelTitle}
              </p>
            </div>
            
            <button
              onClick={() => toggleLikeTrack(currentTrack)}
              className={`p-2 rounded-full hover:bg-white/5 transition-all flex-shrink-0 ${
                isLiked ? 'text-[#1db954]' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-white/5 my-5 flex-shrink-0" />

        {/* Dynamic "About the artist" Card */}
        <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 flex flex-col flex-shrink-0 shadow-lg relative group/artist-card">
          {/* Header text */}
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider p-4 pb-2">About the artist</p>
          
          {/* Artist photo (large) */}
          <div className="w-full aspect-[16/9] relative overflow-hidden bg-zinc-950">
            <img 
              src={upgradeThumbnailUrl(currentChannelDetails?.thumbnail) || upgradeThumbnailUrl(currentTrack.thumbnailUrl) || ''} 
              alt={currentTrack.channelTitle}
              className="w-full h-full object-cover select-none transition-transform duration-700 group-hover/artist-card:scale-105"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = currentTrack.thumbnailUrl || '';
              }}
            />
            {/* Soft dark vignette gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
          </div>

          {/* Details & Interactive Actions */}
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <h4 className="text-sm font-bold text-white leading-tight truncate hover:underline cursor-pointer" onClick={() => viewChannel(currentChannelId || currentTrack.channelTitle)}>
                  {currentTrack.channelTitle}
                </h4>
                <p className="text-[10px] text-zinc-450 mt-1 font-semibold">
                  {currentChannelDetails?.subscriberCountText || '12.4M monthly listeners'}
                </p>
              </div>

              {/* Follow Toggle button */}
              <button
                onClick={() => toggleSubscribeChannel(currentChannelId || currentTrack.channelTitle)}
                className={`text-[10px] font-bold tracking-wide uppercase px-4 py-1.5 rounded-full border transition-all duration-200 ${
                  subscribedChannels.includes(currentChannelId || currentTrack.channelTitle)
                    ? 'bg-transparent text-white border-white/20 hover:border-white/50'
                    : 'bg-white text-black border-white hover:bg-zinc-200'
                }`}
              >
                {subscribedChannels.includes(currentChannelId || currentTrack.channelTitle) ? 'Following' : 'Follow'}
              </button>
            </div>

            {/* Optional Bio snippet if available */}
            {currentChannelDetails?.description && (
              <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed mt-1 font-medium select-text">
                {currentChannelDetails.description}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
