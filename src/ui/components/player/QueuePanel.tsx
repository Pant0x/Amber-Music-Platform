"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronUp, ChevronDown, Music, Trash2, Heart, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaybackStore, useUIStore } from "@/store/usePlayerStore";
import { formatDuration } from "@/lib/utils";
import type { QueueItem } from "@/store/types";

export function QueuePanel() {
  const { queue, queueIndex, isPlaying, removeFromQueue, setQueueIndex, clearQueue, nextTrack, prevTrack } = usePlaybackStore();
  const { rightPanelOpen, setRightPanelOpen, setLyrics } = useUIStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setRightPanelOpen(false);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setRightPanelOpen]);

  if (!rightPanelOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="flex h-full flex-col bg-bg-secondary border-l border-border-primary"
    >
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-border-primary">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-amber-500" />
          <h3 className="font-medium text-text-primary">Up Next</h3>
          <span className="text-sm text-text-muted">({queue.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn-ghost h-8 w-8 p-0"
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          <button
            onClick={() => clearQueue()}
            className="btn-ghost h-8 w-8 p-0 text-error hover:text-error/80"
            aria-label="Clear queue"
            disabled={queue.length === 0}
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setRightPanelOpen(false)}
            className="btn-ghost h-8 w-8 p-0"
            aria-label="Close queue"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="flex h-full items-center justify-center text-text-muted">
            <p>Queue is empty</p>
          </div>
        ) : (
          <AnimatePresence>
            <motion.ul className="divide-y divide-border-primary" layout>
              {queue.map((item, index) => (
                <motion.li
                  key={item.queueId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 transition-colors",
                    index === queueIndex && "bg-amber-500/10"
                  )}
                >
                  <span className="text-sm text-text-muted w-6 text-right">
                    {index + 1}
                  </span>
                  <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {index === queueIndex && isPlaying && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center bg-black/50"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Music className="h-5 w-5 text-amber-500" />
                      </motion.div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("font-medium truncate", index === queueIndex && "text-amber-400")}>
                      {item.title}
                    </p>
                    <p className="text-xs text-text-muted truncate">{item.channelTitle}</p>
                  </div>
                  <span className="text-xs text-text-muted w-16 text-right">
                    {item.duration ? formatDuration(item.duration) : ""}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue(item.queueId);
                    }}
                    className="btn-ghost h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-error hover:text-error/80"
                    aria-label="Remove from queue"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          </AnimatePresence>
        )}
      </div>

      {/* Empty state when collapsed */}
      {collapsed && queue.length > 0 && (
        <div className="p-4 text-center text-text-muted border-t border-border-primary">
          Queue collapsed. Click to expand.
        </div>
      )}
    </motion.div>
  );
}