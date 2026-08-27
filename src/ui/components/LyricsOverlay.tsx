"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Expand, Minimize, Globe, Volume2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLyricsStore, useUIStore, usePlaybackStore } from "@/store/usePlayerStore";
import { useTheme } from "@/components/providers/ThemeProvider";

export function LyricsOverlay() {
  const { currentLyrics, loading, error, offset, fontScale, translationLanguage, showTranslation, setOffset, setFontScale, setTranslationLanguage, setShowTranslation } = useLyricsStore();
  const { lyricsOpen, setLyricsOpen, minimized } = useUIStore();
  const { currentTrack, isPlaying, progress } = usePlaybackStore();
  const { resolvedTheme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (!lyricsOpen || !currentLyrics) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => setLyricsOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "glass-strong rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col",
            expanded && "max-w-none max-h-none rounded-none"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-primary">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden">
                <img
                  src={currentTrack?.thumbnailUrl || ""}
                  alt={currentTrack?.title || ""}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-text-primary truncate">{currentTrack?.title}</p>
                <p className="text-sm text-text-muted truncate">{currentTrack?.channelTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className={cn("btn-ghost h-8 w-8 p-0", showTranslation && "text-amber-500")}
                aria-label="Translation"
              >
                <Globe className="h-5 w-5" />
              </button>
              <button
                onClick={() => setFontScale(fontScale === 1 ? 1.2 : fontScale === 1.2 ? 1.4 : 1)}
                className="btn-ghost h-8 w-8 p-0"
                aria-label={`Font size: ${Math.round(fontScale * 100)}%`}
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={() => setExpanded(!expanded)}
                className="btn-ghost h-8 w-8 p-0"
                aria-label={expanded ? "Minimize" : "Expand"}
              >
                {expanded ? <Minimize className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setLyricsOpen(false)}
                className="btn-ghost h-8 w-8 p-0 text-error hover:text-error/80"
                aria-label="Close lyrics"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Lyrics Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent" />
              </div>
            )}
            {error && (
              <div className="text-center text-text-muted py-8">
                <p>Unable to load lyrics</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
            {currentLyrics && !loading && !error && (
              <LyricsContent
                lyrics={currentLyrics.lyrics}
                translation={currentLyrics.translation}
                showTranslation={showTranslation}
                fontScale={fontScale}
                currentTime={progress}
              />
            )}
          </div>

          {/* Progress Bar */}
          <div className="p-4 border-t border-border-primary">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted w-10">{formatTime(progress)}</span>
              <div className="flex-1 h-1 bg-bg-tertiary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      (progress / (Number(currentTrack?.duration) || 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <span className="text-xs text-text-muted w-10 text-right">
                {formatTime(currentTrack?.duration || 0)}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function LyricsContent({ lyrics, translation, showTranslation, fontScale, currentTime }: {
  lyrics: string;
  translation?: string;
  showTranslation: boolean;
  fontScale: number;
  currentTime: number;
}) {
  const lines = lyrics.split("\n").filter((line) => line.trim());
  
  return (
    <div className="space-y-2" style={{ fontSize: `${fontScale}rem` }}>
      {lines.map((line, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="relative"
        >
          <p className="text-text-primary leading-relaxed">{line}</p>
          {showTranslation && translation && (
            <p className="text-text-muted leading-relaxed mt-1">
              {translation.split("\n")[index] || ""}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function formatTime(seconds: number | string): string {
  if (!seconds) return "0:00";
  if (typeof seconds === "string") {
    if (seconds.includes(":")) return seconds;
    seconds = Number(seconds);
  }
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}