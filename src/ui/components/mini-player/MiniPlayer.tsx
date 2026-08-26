"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, X, ChevronUp, ChevronDown, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaybackStore, useUIStore } from "@/store/usePlayerStore";
import { formatDuration } from "@/lib/utils";

export function MiniPlayer() {
  const { currentTrack, isPlaying, volume, togglePlay, nextTrack, prevTrack, setVolume } = usePlaybackStore();
  const { minimized, setMinimized } = useUIStore();
  const [expanded, setExpanded] = useState(false);

  if (!currentTrack || minimized) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-2xl mx-auto"
      >
        <motion.div
          initial={false}
          animate={{ height: expanded ? "auto" : 80 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="glass-strong rounded-xl overflow-hidden shadow-xl border border-border-primary"
        >
          {/* Compact View */}
          <div className="flex h-20 items-center gap-4 p-4">
            <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden">
              <img
                src={currentTrack.thumbnailUrl}
                alt={currentTrack.title}
                className="h-full w-full object-cover"
              />
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-black/50"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Pause className="h-6 w-6 text-white" />
                </motion.div>
              )}
            </div>
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
                className="btn-primary h-10 w-10 p-0 rounded-full"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
              </button>
              <button onClick={nextTrack} className="btn-ghost h-10 w-10 p-0" aria-label="Next">
                <SkipForward className="h-5 w-5" />
              </button>
              <div className="w-24 ml-2">
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
              </div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="btn-ghost h-8 w-8 p-0 ml-2"
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setMinimized(true)}
                className="btn-ghost h-8 w-8 p-0 ml-1"
                aria-label="Minimize to tray"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Expanded View */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-border-primary p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden">
                    <img
                      src={currentTrack.thumbnailUrl}
                      alt={currentTrack.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary truncate">{currentTrack.title}</p>
                    <p className="text-sm text-text-muted truncate">{currentTrack.channelTitle}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-text-muted">{formatDuration(0)}</span>
                      <div className="flex-1 h-1 bg-bg-tertiary rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: "0%" }}
                        />
                      </div>
                      <span className="text-xs text-text-muted">
                        {formatDuration(currentTrack.duration || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}