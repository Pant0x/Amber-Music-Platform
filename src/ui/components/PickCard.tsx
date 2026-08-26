"use client";

import { motion } from "framer-motion";
import { Play, ChevronRight, Clock, Music, Heart, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaybackStore } from "@/store/usePlayerStore";
import { formatDuration } from "@/lib/utils";
import type { Track } from "@/store/types";

interface PickCardProps {
  track: Track;
  index?: number;
}

export function PickCard({ track, index = 0 }: PickCardProps) {
  const { addToQueue, setQueue } = usePlaybackStore();

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQueue([track]);
  };

  const handleQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(track);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index || 0) * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group flex flex-col gap-2"
    >
      <div className="relative aspect-square rounded-lg overflow-hidden bg-bg-tertiary">
        <img
          src={track.thumbnailUrl}
          alt={track.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handlePlay}
            className="btn-primary h-12 w-12 p-0 rounded-full mr-2"
            aria-label={`Play ${track.title}`}
          >
            <Play className="h-6 w-6 ml-1" />
          </button>
          <button
            onClick={handleQueue}
            className="btn-secondary h-12 w-12 p-0 rounded-full"
            aria-label={`Add ${track.title} to queue`}
          >
            <Music className="h-5 w-5" />
          </button>
        </div>
        {track.duration && (
          <span className="absolute bottom-2 right-2 text-xs px-1.5 py-0.5 bg-black/80 text-white rounded">
            {formatDuration(track.duration)}
          </span>
        )}
        {track.isExplicit && (
          <span className="absolute top-2 left-2 text-xs px-1.5 py-0.5 bg-red-500/80 text-white rounded">
            E
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-text-primary truncate">{track.title}</p>
        <p className="text-sm text-text-muted truncate">{track.channelTitle}</p>
      </div>
    </motion.div>
  );
}