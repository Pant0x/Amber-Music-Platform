"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Compass,
  Music,
  Heart,
  Folder,
  Search,
  Settings,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Library,
  FileText,
  Upload,
  ArrowUpRight,
  Users,
  Crown,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigationStore, useUIStore } from "@/store/usePlayerStore";

const NAV_ITEMS = [
  { id: "home", icon: Home, label: "Home", shortcut: "1" },
  { id: "explore", icon: Compass, label: "Explore", shortcut: "2" },
  { id: "library", icon: Library, label: "Library", shortcut: "3" },
  { id: "liked", icon: Heart, label: "Liked", shortcut: "4" },
  { id: "files", icon: Folder, label: "Local Files", shortcut: "5" },
  { id: "search", icon: Search, label: "Search", shortcut: "6" },
];

const LIBRARY_SECTIONS = [
  { id: "playlists", icon: Music, label: "Playlists" },
  { id: "artists", icon: Users, label: "Artists" },
  { id: "albums", icon: Crown, label: "Albums" },
  { id: "history", icon: Clock, label: "History" },
];

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const { activeTab, setActiveTab, navigateWithParams } = useNavigationStore();
  const { leftPanelOpen, setLeftPanelOpen } = useUIStore();
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [playlistsOpen, setPlaylistsOpen] = useState(false);

  const handleNavClick = (tab: string) => {
    if (tab === "library") {
      setLibraryOpen(!libraryOpen);
    } else if (tab === "playlists") {
      setPlaylistsOpen(!playlistsOpen);
    } else {
      navigateWithParams(tab as any);
    }
  };

  const NavItem = ({ item, isActive, badge }: { item: typeof NAV_ITEMS[0]; isActive: boolean; badge?: string }) => (
    <button
      onClick={() => handleNavClick(item.id)}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
        "hover:bg-bg-hover",
        isActive
          ? "bg-amber-500/10 text-amber-400"
          : "text-text-secondary hover:text-text-primary"
      )}
      title={collapsed ? item.label : undefined}
    >
      <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      {!collapsed && (
        <>
          <span className="font-medium truncate">{item.label}</span>
          {badge && <span className="ml-auto text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">{badge}</span>}
          {item.shortcut && <kbd className="ml-auto text-xs text-text-muted px-1.5 py-0.5 bg-bg-tertiary rounded">{item.shortcut}</kbd>}
        </>
      )}
    </button>
  );

  const SectionHeader = ({ label, icon, onClick, open, badge }: { label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void; open: boolean; badge?: string }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
      )}
    >
      <icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="truncate">{label}</span>
          {badge && <span className="ml-auto text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">{badge}</span>}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-auto"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </>
      )}
    </button>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center px-4 border-b border-border-primary">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600">
              <Music className="h-5 w-5 text-black" />
            </div>
            <span className="font-bold text-xl text-text-primary">Amber</span>
          </motion.div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 mx-auto">
            <Music className="h-5 w-5 text-black" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
            />
          ))}
        </div>

        {/* Library Section */}
        <div className="pt-4">
          <SectionHeader
            label="Library"
            icon={Library}
            onClick={() => setLibraryOpen(!libraryOpen)}
            open={libraryOpen}
          />
          <AnimatePresence>
            {libraryOpen && !collapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 ml-8 space-y-1"
              >
                {LIBRARY_SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => navigateWithParams(section.id as any)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                      "hover:bg-bg-hover",
                      activeTab === section.id
                        ? "bg-amber-500/10 text-amber-400"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <section.icon className="h-5 w-5" />
                    <span className="truncate">{section.label}</span>
                  </button>
                ))}
                <button
                  onClick={() => navigateWithParams("playlists")}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                    "hover:bg-bg-hover",
                    activeTab === "playlists"
                      ? "bg-amber-500/10 text-amber-400"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  <Plus className="h-5 w-5" />
                  <span className="truncate">Create playlist</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Playlists Section */}
        <div className="pt-4">
          <SectionHeader
            label="Playlists"
            icon={FileText}
            onClick={() => setPlaylistsOpen(!playlistsOpen)}
            open={playlistsOpen}
            badge="12"
          />
          <AnimatePresence>
            {playlistsOpen && !collapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 ml-8 space-y-1 max-h-60 overflow-y-auto"
              >
                {/* Dynamic playlists would go here */}
                <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-text-muted rounded-lg hover:bg-bg-hover hover:text-text-primary transition-colors">
                  <Upload className="h-5 w-5" />
                  <span>Import playlist</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-border-primary">
        <button
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className={cn("btn-secondary w-full justify-center", collapsed && "p-0")}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 mr-2" />
              Collapse
            </>
          )}
        </button>
      </div>
    </div>
  );
}