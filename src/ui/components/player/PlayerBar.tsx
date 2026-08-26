"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
  Mic,
  Expand,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaybackStore, useUIStore, useLyricsStore } from "@/store/usePlayerStore";
import { formatDuration } from "@/lib/utils";

export function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    shuffle,
    repeat,
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
    setProgress,
    setShuffle,
    setRepeat,
  } = usePlaybackStore();
  const { lyricsOpen, setLyrics, rightPanelOpen, setRightPanelOpen } = useUIStore();
  const { currentLyrics, offset } = useLyricsStore();
  const progressRef = useRef<HTMLInputElement>(null);
  const volumeRef = useRef<HTMLInputElement>(null);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setProgress(value);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " ") {
      e.preventDefault();
      togglePlay();
    }
    if (e.key === "ArrowRight") nextTrack();
    if (e.key === "ArrowLeft") prevTrack();
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, nextTrack, prevTrack]);

  if (!currentTrack) {
    return (
      <div className="flex h-16 items-center justify-center border-t border-border-primary bg-bg-secondary/80 backdrop-blur-xl">
        <p className="text-text-muted">No track playing</p>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="flex h-16 items-center gap-4 border-t border-border-primary bg-bg-secondary/80 backdrop-blur-xl px-4">
      {/* Track Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1" style={{ minWidth: 0 }}>
        <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden">
          <img
            src={currentTrack.thumbnailUrl}
            alt={currentTrack.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {isPlaying && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/50"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500">
                <Pause className="h-5 w-5 text-black" />
              </div>
            </motion.div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-text-primary truncate">{currentTrack.title}</p>
          <p className="text-sm text-text-muted truncate">{currentTrack.channelTitle}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-2 flex-1">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShuffle(!shuffle)}
            className={cn("btn-ghost h-8 w-8 p-0", shuffle && "text-amber-500")}
            aria-label="Shuffle"
          >
            <Shuffle className="h-5 w-5" />
          </button>
          <button onClick={prevTrack} className="btn-ghost h-10 w-10 p-0" aria-label="Previous">
            <SkipBack className="h-6 w-6" />
          </button>
          <button
            onClick={togglePlay}
            className="btn-primary h-12 w-12 p-0 rounded-full"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
          </button>
          <button onClick={nextTrack} className="btn-ghost h-10 w-10 p-0" aria-label="Next">
            <SkipForward className="h-6 w-6" />
          </button>
          <button
            onClick={() => setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off")}
            className={cn("btn-ghost h-8 w-8 p-0", repeat !== "off" && "text-amber-500")}
            aria-label={`Repeat: ${repeat}`}
          >
            <Repeat className={cn("h-5 w-5", repeat === "one" && "text-amber-500")} />
          </button>
        </div>
        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-xs text-text-muted w-10 text-right">{formatDuration(progress)}</span>
          <input
            ref={progressRef}
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={handleProgressChange}
            className="flex-1 h-2 appearance-none bg-bg-tertiary rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-500"
            style={{
              background: `linear-gradient(to right, #f59e0b ${progressPercent}%, #333 ${progressPercent}%)`,
            }}
            aria-label="Seek"
          />
          <span className="text-xs text-text-muted w-10">{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 min-w-0" style={{ minWidth: 200 }}>
        <button
          onClick={() => setLyrics(!lyricsOpen)}
          className={cn("btn-ghost h-8 w-8 p-0", lyricsOpen && "text-amber-500")}
          aria-label="Lyrics"
        >
          <Mic className="h-5 w-5" />
        </button>
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className={cn("btn-ghost h-8 w-8 p-0", rightPanelOpen && "text-amber-500")}
          aria-label="Queue"
        >
          <ListMusic className="h-5 w-5" />
        </button>
        <div className="relative">
          <input
            ref={volumeRef}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-2 appearance-none bg-bg-tertiary rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
            aria-label="Volume"
          />
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
            className="absolute left-0 top-1/2 -translate-y-1/2 ml-2 text-text-muted hover:text-text-primary"
            aria-label={volume > 0 ? "Mute" : "Unmute"}
          >
            {volume > 0 ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </div>
        <button
          className="btn-ghost h-8 w-8 p-0"
          aria-label="Expand player"
        >
          <Expand className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}