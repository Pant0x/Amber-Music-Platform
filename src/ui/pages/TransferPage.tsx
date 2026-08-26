"use client";

import { motion } from "framer-motion";
import { Compass, Music, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function TransferPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Transfer Playlists</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: Music, label: "From Spotify", source: "spotify" },
          { icon: Compass, label: "From YouTube Music", source: "youtube" },
          { icon: Heart, label: "From Apple Music", source: "apple" },
          { icon: Sparkles, label: "From Deezer", source: "deezer" },
        ].map((item) => (
          <motion.button
            key={item.source}
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