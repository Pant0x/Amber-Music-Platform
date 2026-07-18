'use client';

import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Track } from '@/types/music-player';
import { cleanVisualName, parseFeaturedArtists } from '@/utils/text';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  Mic2,
  ListMusic,
  Laptop2,
  ExternalLink,
  Maximize2,
  PlusCircle,
  Check
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
  if (isNaN(secs) || secs === null) return '0:00';
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const BottomPlayerBar: React.FC = () => {
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
    playlists,
    createPlaylist
  } = usePlayerStore();

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  if (!currentTrack) return null;

  const isLiked = likedTracks.some((t) => t.id === currentTrack.id);
  const parsed = parseFeaturedArtists(currentTrack.title);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fraction = parseFloat(e.target.value);
    setSeekTrigger(fraction * duration);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume || 0.5);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (vol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleSidebarView = (view: 'now-playing' | 'queue' | 'connect') => {
    if (rightSidebarView === view) {
      setRightSidebarView('now-playing'); // revert to now-playing instead of hiding completely
    } else {
      setRightSidebarView(view);
    }
  };

  return (
    <div 
      className="h-[80px] w-screen bg-[#090909] text-white border-t border-white/5 px-4 flex items-center justify-between select-none relative z-50 flex-shrink-0 transition-all duration-1000"
      style={{ background: 'var(--theme-player-bg, #090909)' }}
    >
      {/* 1. LEFT SECTION: Track Info */}
      <div className="flex items-center gap-3 w-[30%] min-w-[200px]">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-900 border border-white/5 flex-shrink-0 shadow-md shadow-black/40">
          <img 
            src={upgradeThumbnailUrl(currentTrack.thumbnailUrl) || undefined} 
            alt="" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = currentTrack.thumbnailUrl || '';
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-white truncate leading-tight hover:underline cursor-pointer" title={parsed.title}>
            {parsed.title}
          </h4>
          <p className="text-[11px] text-zinc-400 truncate mt-1 leading-none font-semibold hover:text-white cursor-pointer" title={currentTrack.channelTitle}>
            {currentTrack.channelTitle}
          </p>
        </div>
        
        {/* Like and Add Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button 
            onClick={() => toggleLikeTrack(currentTrack)}
            className={`p-2 rounded-full hover:bg-white/5 transition-all ${
              isLiked ? 'text-[#1db954]' : 'text-zinc-400 hover:text-white'
            }`}
            title={isLiked ? 'Remove from Liked' : 'Save to Liked'}
          >
            {isLiked ? <Check className="w-4 h-4 text-[#1db954]" /> : <Heart className="w-4 h-4" />}
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
              className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all"
              title="Add to playlist"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
            {showPlaylistMenu && (
              <div className="absolute bottom-12 left-0 w-48 bg-zinc-950/95 border border-white/10 rounded-xl p-2 shadow-2xl z-50 text-xs">
                <p className="text-zinc-500 font-bold px-2 py-1 uppercase tracking-wider text-[9px] mb-1">Add to Playlist</p>
                <div className="max-h-36 overflow-y-auto space-y-0.5 custom-scrollbar">
                  {playlists.map(pl => {
                    const hasTrack = pl.tracks.some(t => t.id === currentTrack.id);
                    return (
                      <button
                        key={pl.id}
                        onClick={() => {
                          usePlayerStore.getState().addTrackToPlaylist(pl.id, currentTrack);
                          setShowPlaylistMenu(false);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-white/5 text-white truncate flex items-center justify-between"
                      >
                        <span>{pl.name}</span>
                        {hasTrack && <Check className="w-3.5 h-3.5 text-[#1db954]" />}
                      </button>
                    );
                  })}
                  {playlists.length === 0 && (
                    <button
                      onClick={() => {
                        const name = prompt('Enter Playlist Name:');
                        if (name) createPlaylist(name);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white"
                    >
                      + Create Playlist
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: Playback Controls & Progress */}
      <div className="flex flex-col items-center gap-1.5 w-[40%] max-w-[600px]">
        {/* Controls Button Row */}
        <div className="flex items-center gap-5">
          <button 
            onClick={() => setIsShuffle(!isShuffle)}
            className={`p-1 rounded-full transition-all ${
              isShuffle ? 'text-[#1db954]' : 'text-zinc-400 hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4.5 h-4.5" />
          </button>
          
          <button 
            onClick={prevTrack}
            className="p-1 text-zinc-400 hover:text-white transition-all"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all flex-shrink-0"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current text-black" />
            ) : (
              <Play className="w-4 h-4 fill-current text-black ml-0.5" />
            )}
          </button>
          
          <button 
            onClick={nextTrack}
            className="p-1 text-zinc-400 hover:text-white transition-all"
            title="Next"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          
          <button 
            onClick={() => {
              if (repeatMode === 'none') setRepeatMode('all');
              else if (repeatMode === 'all') setRepeatMode('one');
              else setRepeatMode('none');
            }}
            className={`p-1 rounded-full transition-all relative ${
              repeatMode !== 'none' ? 'text-[#1db954]' : 'text-zinc-400 hover:text-white'
            }`}
            title={`Repeat mode: ${repeatMode}`}
          >
            <Repeat className="w-4.5 h-4.5" />
            {repeatMode === 'one' && (
              <span className="absolute top-[-3px] right-[-3px] text-[7px] font-bold bg-[#1db954] text-black w-2.5 h-2.5 rounded-full flex items-center justify-center font-sans">
                1
              </span>
            )}
          </button>
        </div>

        {/* Timeline Seekbar progress */}
        <div className="flex items-center gap-2.5 w-full">
          <span className="text-[11px] text-zinc-400 font-semibold w-8 text-right font-mono">{formatTime(playedSeconds)}</span>
          <div className="relative flex-1 flex items-center group py-2">
            <input 
              type="range"
              min="0"
              max="0.999"
              step="any"
              value={duration > 0 ? playedSeconds / duration : 0}
              onChange={handleScrub}
              className="yt-deck-slider w-full z-10 cursor-pointer"
            />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[4px] rounded-full pointer-events-none transition-all duration-300"
              style={{ width: `${(duration > 0 ? playedSeconds / duration : 0) * 100}%`, backgroundColor: 'var(--theme-accent, #1db954)' }}
            />
          </div>
          <span className="text-[11px] text-zinc-400 font-semibold w-8 font-mono">{formatTime(duration)}</span>
        </div>
      </div>

      {/* 3. RIGHT SECTION: Extra Controls & Volume */}
      <div className="flex items-center gap-3 w-[30%] min-w-[200px] justify-end">
        {/* Lyrics Button */}
        <button 
          onClick={() => toggleSidebarView('now-playing')}
          className={`p-1.5 rounded-md hover:bg-white/5 transition-all ${
            rightSidebarView === 'now-playing' ? 'text-[#1db954]' : 'text-zinc-400 hover:text-white'
          }`}
          title="Lyrics / Now Playing"
        >
          <Mic2 className="w-4.5 h-4.5" />
        </button>

        {/* Queue Button */}
        <button 
          onClick={() => toggleSidebarView('queue')}
          className={`p-1.5 rounded-md hover:bg-white/5 transition-all ${
            rightSidebarView === 'queue' ? 'text-[#1db954]' : 'text-zinc-400 hover:text-white'
          }`}
          title="Queue"
        >
          <ListMusic className="w-4.5 h-4.5" />
        </button>

        {/* Connection Button */}
        <button 
          onClick={() => toggleSidebarView('connect')}
          className={`p-1.5 rounded-md hover:bg-white/5 transition-all ${
            rightSidebarView === 'connect' ? 'text-[#1db954]' : 'text-zinc-400 hover:text-white'
          }`}
          title="Connect to a device"
        >
          <Laptop2 className="w-4.5 h-4.5" />
        </button>

        {/* Volume controls */}
        <div className="flex items-center gap-2 max-w-[120px] flex-1">
          <button 
            onClick={toggleMute}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
          </button>
          <div className="relative flex-1 flex items-center group py-2">
            <input 
              type="range"
              min="0"
              max="1"
              step="any"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="yt-volume-slider w-full z-10 cursor-pointer"
            />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[3.5px] rounded-full pointer-events-none transition-all duration-300"
              style={{ width: `${(isMuted ? 0 : volume) * 100}%`, backgroundColor: 'var(--theme-accent, #1db954)' }}
            />
          </div>
        </div>

        {/* Picture in picture */}
        <button 
          className="p-1.5 text-zinc-400 hover:text-white transition-all hidden sm:block"
          title="Miniplayer (PiP)"
        >
          <ExternalLink className="w-4.5 h-4.5" />
        </button>

        {/* Fullscreen (Ignore logic for now, just show button) */}
        <button 
          className="p-1.5 text-zinc-400 hover:text-white transition-all hidden sm:block"
          title="Fullscreen"
        >
          <Maximize2 className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
};
