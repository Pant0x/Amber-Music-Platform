"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/ui/components/Sidebar";
import { QueuePanel } from "@/ui/components/player/QueuePanel";
import { LyricsOverlay } from "@/ui/components/LyricsOverlay";
import { MiniPlayer } from "@/ui/components/mini-player/MiniPlayer";

interface LayoutProps {
  children: React.ReactNode;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  lyricsOpen: boolean;
  minimized: boolean;
}

export function Layout({ children, leftPanelOpen, rightPanelOpen, lyricsOpen, minimized }: LayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-primary">
      {/* Left Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: leftPanelOpen ? 288 : 64 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex flex-col overflow-hidden bg-bg-secondary border-r border-border-primary flex-shrink-0"
      >
        <Sidebar collapsed={!leftPanelOpen} />
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>

      {/* Right Panel - Queue */}
      <motion.aside
        initial={false}
        animate={{ width: rightPanelOpen ? 384 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex flex-col overflow-hidden bg-bg-secondary border-l border-border-primary flex-shrink-0"
      >
        {rightPanelOpen && <QueuePanel />}
      </motion.aside>

      {/* Lyrics Overlay */}
      {lyricsOpen && <LyricsOverlay />}

      {/* Mini Player */}
      {!minimized && <MiniPlayer />}
    </div>
  );
}