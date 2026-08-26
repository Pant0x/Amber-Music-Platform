"use client";

import { motion } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaybackStore } from "@/store/usePlayerStore";

export function MediaDeck() {
  const {
    currentTrack,
    isPlaying,
    volume,
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
  } = usePlaybackStore();

  if (!currentTrack) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 glass-strong rounded-xl p-4 shadow-xl border border-border-primary max-w-md w-full mx-4"
    >
      <div className="flex items-center gap-4">
        <img
          src={currentTrack.thumbnailUrl}
          alt={currentTrack.title}
          className="h-16 w-16 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary truncate">{currentTrack.title}</p>
          <p className="text-sm text-text-muted truncate">{currentTrack.channelTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevTrack} className="btn-ghost h-10 w-10 p-0" aria-label="Previous">
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            onClick={togglePlay}
            className="btn-primary h-12 w-12 p-0 rounded-full"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
          </button>
          <button onClick={nextTrack} className="btn-ghost h-10 w-10 p-0" aria-label="Next">
            <SkipForward className="h-5 w-5" />
          </button>
          <div className="w-20 ml-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 appearance-none bg-bg-tertiary rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
              aria-label="Volume"
            />
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              className="ml-2 text-text-muted hover:text-text-primary"
              aria-label={volume > 0 ? "Mute" : "Unmute"}
            >
              {volume > 0 ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}