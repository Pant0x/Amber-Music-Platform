"use client";

import { motion } from "framer-motion";
import { Music, Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigationStore } from "@/store/usePlayerStore";

export function SearchResultsPage() {
  const { activeTab, navigateWithParams } = useNavigationStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Search Results</h1>
      </div>
      <div className="card p-6 text-center">
        <Search className="mx-auto h-12 w-12 text-text-muted mb-4" />
        <h2 className="text-xl font-medium text-text-primary mb-2">Search Results</h2>
        <p className="text-text-muted mb-4">Search results will appear here</p>
        <button onClick={() => navigateWithParams("search")} className="btn-primary">
          <Search className="mr-2 h-4 w-4" />
          Search
        </button>
      </div>
    </motion.div>
  );
}