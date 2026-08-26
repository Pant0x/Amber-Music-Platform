"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/usePlayerStore";

export function SearchOverlay() {
  const { openModal, closeModal, activeModal } = useUIStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isOpen = activeModal === "search";

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          closeModal("search");
        } else {
          openModal("search");
        }
      }
      if (e.key === "Escape" && isOpen) {
        closeModal("search");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, openModal, closeModal]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
        onClick={() => closeModal("search")}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-2xl glass-strong rounded-2xl p-4 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
              <Search className="h-5 w-5" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists, albums... (⌘K)"
              className="w-full bg-transparent border-none outline-none pl-12 pr-12 py-3 text-lg text-text-primary placeholder:text-text-muted"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <kbd className="absolute right-14 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-text-muted bg-bg-tertiary rounded">
              <Command className="h-3 w-3" />
              <span>K</span>
            </kbd>
          </div>
          {query && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-text-muted">Search results for "{query}"</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {["Songs", "Artists", "Albums", "Playlists"].map((type) => (
                  <button
                    key={type}
                    className="btn-secondary justify-start"
                    onClick={() => {
                      closeModal("search");
                      // Navigate to search results
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}