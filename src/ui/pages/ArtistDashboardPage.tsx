"use client";

import { motion } from "framer-motion";
import { Music, Crown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ArtistDashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Artist Dashboard</h1>
      </div>
      <div className="card p-8 text-center">
        <Building2 className="mx-auto h-16 w-16 text-text-muted mb-4" />
        <h2 className="text-xl font-medium text-text-primary mb-2">Artist Dashboard</h2>
        <p className="text-text-muted mb-4">Manage your artist profile, upload tracks, and view analytics</p>
      </div>
    </motion.div>
  );
}