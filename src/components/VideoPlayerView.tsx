'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePlayback } from '@/context/PlaybackContext';
import { useTrackMetadata } from '@/hooks/useTrackMetadata';
import { Tv, X, Minimize2, Maximize2, Play, Pause, VolumeX, Volume1, Volume2 } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

export const VideoPlayerView: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    setPlaying,
    volume,
    isMuted,
    setProgress,
    activeTab,
    setActiveTab,
    progress,
    togglePlay,
    setVolume,
    toggleMute,
    seekTo,
    ...ctx
  } = usePlayback();

  const { hydrateTrackMetadata, loading: metaLoading } = useTrackMetadata();
  const playerRef = useRef<any>(null);
  const [showMiniPlayer, setShowMiniPlayer] = useState<boolean>(true);
  const [duration, setDuration] = useState<number>(180);

  const setStorePlayedSeconds = usePlayerStore((s) => s.setPlayedSeconds);
  const setStoreDuration = usePlayerStore((s) => s.setDuration);

  const seekTrigger = (ctx as any).seekTrigger;
  const seekFraction = (ctx as any).seekFraction;

  useEffect(() => {
    if (currentTrack?.id) {
      hydrateTrackMetadata(currentTrack.id);
    }
  }, [currentTrack?.id, hydrateTrackMetadata]);

  useEffect(() => {
    if (seekTrigger > 0 && playerRef.current) {
      playerRef.current.seekTo(seekFraction, 'fraction');
    }
  }, [seekTrigger, seekFraction]);

  if (!currentTrack) return null;

  const handleProgress = (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
    loadedSeconds: number;
  }) => {
    setProgress(state);
    setStorePlayedSeconds(state.playedSeconds);
  };

  const handleProgressScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const fraction = Math.max(0, Math.min(1, clickX / width));
    seekTo(fraction);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const youtubeUrl = `https://www.youtube.com/watch?v=${currentTrack.id}`;
  const isVideoMode = activeTab === 'video';
  const isHiddenVisually = !isVideoMode && !showMiniPlayer;

  const containerClasses = isVideoMode
    ? 'w-full h-full aspect-video md:max-h-[500px] bg-black border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative transition-all duration-300'
    : isHiddenVisually
    ? 'w-1 h-1 absolute opacity-0 pointer-events-none'
    : 'fixed bottom-28 left-6 w-56 aspect-video bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-2xl z-40 transition-all duration-300 group hover:scale-[1.03]';

  return (
    <div className={isVideoMode ? 'p-8 max-w-5xl mx-auto' : 'absolute'}>
      {isVideoMode && (
        <div className="flex justify-between items-center mb-4 select-none">
          <div>
            <h3 className="text-xs font-bold tracking-wider text-zinc-400 uppercase">Video Canvas</h3>
            <p className="text-[10px] text-zinc-600 mt-0.5">High-fidelity active video stream</p>
          </div>
          {metaLoading && (
            <span className="text-[9px] font-mono text-zinc-500 animate-pulse">
              Hydrating tags...
            </span>
          )}
        </div>
      )}

      <div className={containerClasses}>
        {!isVideoMode && !isHiddenVisually && (
          <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 to-transparent p-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 select-none">
            <span className="text-[8px] font-mono text-zinc-300 truncate max-w-[120px] ml-1">
              {currentTrack.title}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('video')}
                className="p-0.5 rounded bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300"
                title="Expand to Canvas"
              >
                <Maximize2 className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={() => setShowMiniPlayer(false)}
                className="p-0.5 rounded bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300"
                title="Hide mini player (keep audio)"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        )}

        <ReactPlayer
          ref={playerRef}
          url={youtubeUrl}
          playing={isPlaying}
          volume={volume}
          muted={isMuted}
          onProgress={handleProgress}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onDuration={(d: number) => {
            setDuration(d);
            setStoreDuration(d);
          }}
          width="100%"
          height="100%"
          controls={false}
          config={{
            youtube: {
              playerVars: {
                autoplay: 1,
                controls: 0,
                modestbranding: 1,
                rel: 0,
                disablekb: 1,
                fs: 0
              },
            },
          }}
          className="absolute top-0 left-0"
        />

        {isVideoMode && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-4 px-6 flex flex-col gap-3 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-20 select-none">
            <div 
              className="group/scrub flex items-center gap-3 cursor-pointer w-full py-1" 
              onClick={handleProgressScrub}
            >
              <span className="text-[10px] font-mono text-zinc-400 select-none">
                {formatTime(progress.playedSeconds)}
              </span>
              <div className="flex-1 h-1 bg-zinc-800 rounded-full relative group-hover/scrub:h-1.5 transition-all">
                <div 
                  className="absolute inset-y-0 left-0 bg-zinc-700 rounded-full" 
                  style={{ width: `${progress.loaded * 100}%` }}
                />
                <div 
                  className="absolute inset-y-0 left-0 bg-[#ff0000] rounded-full flex items-center justify-end" 
                  style={{ width: `${progress.played * 100}%` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-white scale-0 group-hover/scrub:scale-100 transition-transform shadow" />
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 select-none">
                {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <div className="flex items-center gap-2 group/volume">
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-[#ff0000] hover:accent-red-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('home')}
                  className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                  title="Minimize View"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {isVideoMode && !isPlaying && (
          <div className="absolute inset-0 bg-black/40 pointer-events-none flex items-center justify-center select-none">
            <div className="bg-zinc-950/90 border border-zinc-800 px-4 py-2 rounded-lg flex items-center gap-2">
              <Tv className="w-4 h-4 text-zinc-400" />
              <span className="text-[10px] font-mono text-zinc-300 tracking-wider">
                DECK PAUSED
              </span>
            </div>
          </div>
        )}
      </div>

      {!isVideoMode && isHiddenVisually && isPlaying && (
        <div className="fixed bottom-28 left-6 flex items-center gap-2 bg-zinc-950/90 border border-zinc-800 px-3 py-1.5 rounded-full z-40 select-none shadow-xl animate-fade-in">
          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-[9px] font-mono text-zinc-400">
            Background audio decoding active
          </span>
          <button
            onClick={() => setShowMiniPlayer(true)}
            className="text-[9px] text-zinc-300 font-bold hover:text-white underline ml-1"
          >
            Show PIP
          </button>
        </div>
      )}
    </div>
  );
};
