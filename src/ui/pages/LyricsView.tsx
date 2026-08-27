"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Music, Mic, Globe, Settings, Expand, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLyricsStore, usePlaybackStore } from "@/store/usePlayerStore";
import { formatDuration } from "@/lib/utils";

export function LyricsView() {
  const { currentLyrics, loading, error, offset, fontScale, translationLanguage, showTranslation, setOffset, setFontScale, setTranslationLanguage, setShowTranslation } = useLyricsStore();
  const { currentTrack, isPlaying, progress } = usePlaybackStore();
  const [expanded, setExpanded] = useState(false);

  if (!currentLyrics) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-full items-center justify-center"
      >
        <div className="text-center">
          <Music className="mx-auto h-16 w-16 text-text-muted mb-4" />
          <h2 className="text-xl font-medium text-text-primary mb-2">No lyrics available</h2>
          <p className="text-text-muted">Play a song to see lyrics</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col"
    >
      <div className="flex h-12 items-center justify-between px-4 border-b border-border-primary bg-bg-secondary/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden">
            <img
              src={currentTrack?.thumbnailUrl || ""}
              alt={currentTrack?.title || ""}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="font-medium text-text-primary truncate">{currentTrack?.title}</p>
            <p className="text-sm text-text-muted truncate">{currentTrack?.channelTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost h-8 w-8 p-0" aria-label="Translation">
            <Globe className="h-5 w-5" />
          </button>
          <button className="btn-ghost h-8 w-8 p-0" aria-label="Font size">
            <Settings className="h-5 w-5" />
          </button>
          <button className="btn-ghost h-8 w-8 p-0" aria-label="Close">
            <Mic className="h-5 w-5" />
          </button>
        </div>
      </div>

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