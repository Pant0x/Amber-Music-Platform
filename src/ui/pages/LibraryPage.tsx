"use client";

import { motion } from "framer-motion";
import { Music, Heart, FileText, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigationStore } from "@/store/usePlayerStore";

interface LibraryPageProps {
  initialView?: string;
}

export function LibraryPage({ initialView }: LibraryPageProps) {
  const { activeTab, navigateWithParams } = useNavigationStore();

  const tabs = [
    { id: "playlists", icon: FileText, label: "Playlists" },
    { id: "artists", icon: Music, label: "Artists" },
    { id: "albums", icon: ChevronRight, label: "Albums" },
    { id: "liked", icon: Heart, label: "Liked Songs" },
    { id: "history", icon: Clock, label: "History" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Library</h1>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigateWithParams(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              "hover:bg-bg-hover",
              activeTab === tab.id
                ? "bg-amber-500/10 text-amber-400"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card p-8 text-center">
        <Music className="mx-auto h-16 w-16 text-text-muted mb-4" />
        <h2 className="text-xl font-medium text-text-primary mb-2">
          {tabs.find((t) => t.id === activeTab)?.label || "Library"}
        </h2>
        <p className="text-text-muted mb-4">Your {activeTab} will appear here</p>
      </div>
    </motion.div>
  );
}