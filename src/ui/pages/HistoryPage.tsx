"use client";

import { motion } from "framer-motion";
import { Clock, Music, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePersistenceStore } from "@/store/usePlayerStore";
import { formatDuration, formatDate } from "@/lib/utils";

export function HistoryPage() {
  const { playHistory, clearPlayHistory } = usePersistenceStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">History</h1>
        {playHistory.length > 0 && (
          <button onClick={clearPlayHistory} className="btn-ghost text-sm text-error">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
          </button>
        )}
      </div>

      {playHistory.length === 0 ? (
        <div className="card p-8 text-center">
          <Clock className="mx-auto h-16 w-16 text-text-muted mb-4" />
          <h2 className="text-xl font-medium text-text-primary mb-2">No history yet</h2>
          <p className="text-text-muted">Your recently played tracks will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {playHistory.slice(0, 50).map((item, index) => (
            <motion.div
              key={`${item.trackId}-${item.playedAt}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors group"
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
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text-primary truncate">{item.title}</p>
                <p className="text-sm text-text-muted truncate">{item.artist}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-text-muted">
                <span className="w-16 text-right">{formatDate(item.playedAt)}</span>
                <span className="w-10 text-right">{formatDuration(item.duration)}</span>
                <span className="w-10 text-right">{Math.round(item.progress * 100)}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}