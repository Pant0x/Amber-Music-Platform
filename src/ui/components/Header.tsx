"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Music,
  Search,
  ChevronDown,
  Bell,
  Settings,
  User,
  LogOut,
  Menu,
  Sun,
  Moon,
  Monitor,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore, usePlaybackStore } from "@/store/usePlayerStore";
import { useSupabase } from "@/lib/supabase-provider";
import { useTheme } from "@/components/providers/ThemeProvider";

export function Header() {
  const { user, signOut } = useSupabase();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { leftPanelOpen, toggleLeftPanel } = useUIStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <header className="flex h-14 items-center justify-between px-4 border-b border-border-primary bg-bg-secondary/80 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleLeftPanel}
          className="btn-ghost h-10 w-10 p-0 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600">
            <Music className="h-5 w-5 text-black" />
          </div>
          <span className="font-semibold text-text-primary hidden sm:block">Amber Music</span>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-4">
        <SearchOverlay />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowThemeMenu(!showThemeMenu)}
          className="btn-ghost h-10 w-10 p-0 relative"
          aria-label={`Theme: ${resolvedTheme}`}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="btn-ghost h-10 w-10 p-0 rounded-full"
              aria-label="User menu"
            >
              <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <User className="h-5 w-5 text-amber-500" />
              </div>
            </button>

            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-56 glass-strong rounded-xl p-2 shadow-xl border border-border-primary z-50"
              >
                <div className="px-3 py-2 border-b border-border-primary">
                  <p className="font-medium text-text-primary truncate">{user.email}</p>
                  <p className="text-xs text-text-muted">Signed in</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function SearchOverlay() {
  const { openModal, closeModal, activeModal } = useUIStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isOpen = activeModal === "search";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={() => closeModal("search")}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl glass-strong rounded-2xl p-4 shadow-xl"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
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
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}