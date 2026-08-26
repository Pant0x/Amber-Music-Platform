"use client";

import { motion } from "framer-motion";
import { Music, ListMusic, Play, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaybackStore } from "@/store/usePlayerStore";
import { formatDuration } from "@/lib/utils";

interface PlaylistViewProps {
  playlistId?: string;
}

export function PlaylistView({ playlistId }: PlaylistViewProps) {
  const { setQueue } = usePlaybackStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Playlist</h1>
      </div>
      <div className="card p-8 text-center">
        <ListMusic className="mx-auto h-16 w-16 text-text-muted mb-4" />
        <h2 className="text-xl font-medium text-text-primary mb-2">Playlist View</h2>
        <p className="text-text-muted">Playlist page with tracklist, description, and actions</p>
      </div>
    </motion.div>
  );
}