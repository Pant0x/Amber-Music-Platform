"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronUp, Play, Heart, Download, Share2, Copy, MoreHorizontal, Flag, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaybackStore, useCollectionStore } from "@/store/usePlayerStore";
import type { Track, Playlist } from "@/store/types";

interface TrackContextMenuProps {
  track: Track;
  x: number;
  y: number;
  onClose: () => void;
}

export function TrackContextMenu({ track, x, y, onClose }: TrackContextMenuProps) {
  const { addToQueue, setQueue } = usePlaybackStore();
  const { toggleLikeTrack, isTrackLiked, toggleDownload, isTrackDownloaded } = useCollectionStore();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        style={{ left: x, top: y, position: "fixed", zIndex: 100 }}
        className="glass-strong rounded-lg p-2 shadow-xl min-w-[200px] border border-border-primary"
        onClick={onClose}
      >
        <div className="px-3 py-2 border-b border-border-primary">
          <p className="font-medium truncate">{track.title}</p>
          <p className="text-sm text-text-muted truncate">{track.channelTitle}</p>
        </div>
        <div className="py-1 space-y-1">
          <ContextMenuItem icon={Play} label="Play" onClick={() => setQueue([track])} />
          <ContextMenuItem icon={Play} label="Play Next" onClick={() => addToQueue(track, "next")} />
          <ContextMenuItem icon={Play} label="Add to Queue" onClick={() => addToQueue(track)} />
          <hr className="border-border-primary my-1" />
          <ContextMenuItem
            icon={isTrackLiked(track.id) ? Heart : HeartOff}
            label={isTrackLiked(track.id) ? "Remove from Liked" : "Add to Liked"}
            onClick={() => toggleLikeTrack(track)}
          />
          <ContextMenuItem
            icon={Download}
            label={isTrackDownloaded(track.id) ? "Remove Download" : "Download"}
            onClick={() => toggleDownload(track.id)}
          />
          <ContextMenuItem icon={Share2} label="Share" onClick={() => {}} />
          <ContextMenuItem icon={Copy} label="Copy Link" onClick={() => {}} />
          <ContextMenuItem icon={Flag} label="Report" onClick={() => {}} />
          <ContextMenuItem icon={Trash2} label="Remove from Queue" variant="danger" onClick={onClose} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ContextMenuItem({
  icon: Icon,
  label,
  onClick,
  variant,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  return (
    <button
      onClick={() => {
        onClick();
      }}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-sm rounded transition-colors",
        variant === "danger"
          ? "text-error hover:bg-error/10"
          : "text-text-primary hover:bg-bg-hover"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}