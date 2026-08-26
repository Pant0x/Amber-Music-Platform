"use client";

import { Suspense } from "react";
import { HomePage } from "@/ui/pages/HomePage";
import { PlayerBar } from "@/ui/components/player/PlayerBar";
import { MiniPlayer } from "@/ui/components/mini-player/MiniPlayer";
import { QueuePanel } from "@/ui/components/player/QueuePanel";
import { LyricsOverlay } from "@/ui/components/LyricsOverlay";
import { ErrorBoundary } from "@/ui/components/ErrorBoundary";
import { Sidebar } from "@/ui/components/Sidebar";
import { Header } from "@/ui/components/Header";
import { useUIStore } from "@/store/usePlayerStore";

function HomePageContent() {
  const { minimized, leftPanelOpen, rightPanelOpen, lyricsOpen } = useUIStore();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar className={`${leftPanelOpen ? "w-72" : "w-16"} transition-all duration-300 flex-shrink-0`} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4">
          <ErrorBoundary label="Home">
            <HomePage />
          </ErrorBoundary>
        </main>
        <PlayerBar />
      </div>
      <aside
        className={`${rightPanelOpen ? "w-96" : "w-0"} transition-all duration-300 flex-shrink-0 overflow-hidden`}
        aria-hidden={!rightPanelOpen}
      >
        {rightPanelOpen && (
          <div className="h-full flex flex-col border-l border-border-primary bg-bg-secondary">
            <QueuePanel />
          </div>
        )}
      </aside>
    </div>
  );
}

export default function Page() {
  const { minimized } = useUIStore();

  return (
    <>
      <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" /></div>}>
        <HomePageContent />
      </Suspense>
      {!minimized && <MiniPlayer />}
      <LyricsOverlay />
    </>
  );
}