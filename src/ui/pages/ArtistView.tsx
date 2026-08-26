"use client";

import { motion } from "framer-motion";
import { Music, Users, ChevronRight, Clock, Play, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaybackStore } from "@/store/usePlayerStore";
import { formatDuration } from "@/lib/utils";

interface ArtistViewProps {
  artistId?: string;
}

export function ArtistView({ artistId }: ArtistViewProps) {
  const { setQueue } = usePlaybackStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Artist</h1>
      </div>
      <div className="card p-8 text-center">
        <Users className="mx-auto h-16 w-16 text-text-muted mb-4" />
        <h2 className="text-xl font-medium text-text-primary mb-2">Artist View</h2>
        <p className="text-text-muted">Artist page with popular songs, albums, and related artists</p>
      </div>
    </motion.div>
  );
}