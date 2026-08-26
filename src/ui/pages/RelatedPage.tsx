"use client";

import { motion } from "framer-motion";
import { Music, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function RelatedPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Related</h1>
      </div>
      <div className="card p-8 text-center">
        <Music className="mx-auto h-16 w-16 text-text-muted mb-4" />
        <h2 className="text-xl font-medium text-text-primary mb-2">Related Content</h2>
        <p className="text-text-muted">Related songs, artists, and playlists will appear here</p>
      </div>
    </motion.div>
  );
}