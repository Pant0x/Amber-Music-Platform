"use client";

import { motion } from "framer-motion";
import { Compass, Music, Heart, Sparkles, Grid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigationStore } from "@/store/usePlayerStore";

export function BrowsePage() {
  const { activeTab, navigateWithParams } = useNavigationStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Explore</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[
          { icon: Sparkles, label: "New Releases", href: "new" },
          { icon: Music, label: "Charts", href: "charts" },
          { icon: Heart, label: "Moods & Genres", href: "moods" },
          { icon: Compass, label: "Podcasts", href: "podcasts" },
        ].map((item) => (
          <motion.button
            key={item.label}
            onClick={() => navigateWithParams("browse" as any)}
            whileHover={{ scale: 1.02 }}
            className="card-hover flex flex-col items-center gap-3 p-6 text-center aspect-square"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-amber-500/20">
              <item.icon className="h-8 w-8 text-amber-500" />
            </div>
            <span className="font-medium text-text-primary">{item.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}