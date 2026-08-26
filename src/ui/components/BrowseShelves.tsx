"use client";

import { motion } from "framer-motion";
import { Play, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaybackStore } from "@/store/usePlayerStore";
import { formatDuration } from "@/lib/utils";

interface BrowseShelvesProps {
  title: string;
  items: any[];
  onViewAll?: () => void;
  itemRenderer?: (item: any) => React.ReactNode;
}

export function BrowseShelves({ title, items, onViewAll, itemRenderer }: BrowseShelvesProps) {
  const { addToQueue, setQueue } = usePlaybackStore();

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        {onViewAll && (
          <button onClick={onViewAll} className="btn-ghost text-sm">
            View all
            <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:grid-cols-5">
        {items.map((item, index) => (
          <motion.div
            key={item.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
          >
            {itemRenderer ? (
              itemRenderer(item)
            ) : (
              <div className="group flex flex-col gap-2">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-bg-tertiary">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.tracks) setQueue(item.tracks);
                      else addToQueue(item);
                    }}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="h-10 w-10 text-white" />
                  </button>
                  {item.duration && (
                    <span className="absolute bottom-2 right-2 text-xs px-1.5 py-0.5 bg-black/80 text-white rounded">
                      {formatDuration(item.duration)}
                    </span>
                  )}
                </div>
                <p className="font-medium text-text-primary truncate">{item.title}</p>
                <p className="text-sm text-text-muted truncate">{item.channelTitle || item.subtitle}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}