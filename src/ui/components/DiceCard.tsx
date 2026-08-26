"use client";

import { motion } from "framer-motion";
import { Dices, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaybackStore } from "@/store/usePlayerStore";

export function DiceCard() {
  const { setQueue } = usePlaybackStore();

  const handleRoll = () => {
    // Trigger random play
    console.log("Roll the dice!");
  };

  return (
    <motion.button
      onClick={handleRoll}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="card-hover flex flex-col items-center gap-3 p-6 text-center aspect-square"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-amber-500/20">
        <Dices className="h-8 w-8 text-amber-500" />
      </div>
      <span className="font-medium text-text-primary">Surprise Me</span>
      <p className="text-sm text-text-muted">Play something random</p>
    </motion.button>
  );
}