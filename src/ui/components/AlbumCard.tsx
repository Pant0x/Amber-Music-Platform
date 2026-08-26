"use client";

import { motion } from "framer-motion";
import { Play, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaybackStore } from "@/store/usePlayerStore";
import type { Album } from "@/store/types";

interface AlbumCardProps {
  album: Album;
  size?: "small" | "medium" | "large";
}

const SIZE_CLASSES = {
  small: "h-24 w-24",
  medium: "h-40 w-40",
  large: "h-56 w-56",
};

export function AlbumCard({ album, size = "medium" }: AlbumCardProps) {
  const { addToQueue, setQueue } = usePlaybackStore();

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (album.tracks && album.tracks.length > 0) {
      setQueue(album.tracks);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={cn("flex flex-col items-center gap-2 text-center group", SIZE_CLASSES[size].replace("h-", "min-h-"))}
    >
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-bg-tertiary">
        <img
          src={album.thumbnailUrl}
          alt={album.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Play ${album.title}`}
        >
          <Play className="h-10 w-10 text-white" />
        </button>
      </div>
      <div className="w-full space-y-1">
        <p className="font-medium text-text-primary truncate">{album.title}</p>
        <p className="text-sm text-text-muted truncate">{album.channelTitle}</p>
        {album.releaseType && (
          <span className="text-xs text-text-muted px-2 py-0.5 bg-bg-tertiary rounded-full">
            {album.releaseType}
          </span>
        )}
      </div>
    </motion.div>
  );
}