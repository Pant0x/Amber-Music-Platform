"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { cn } from "@/lib/utils";
import { Providers } from "@/app/providers";
import { ErrorBoundary } from "@/ui/components/ErrorBoundary";
import { SearchOverlay } from "@/ui/components/SearchOverlay";
import { TrackContextMenuProvider } from "@/ui/components/TrackContextMenu";
import { PlaylistContextMenuProvider } from "@/ui/components/PlaylistContextMenu";
import { ArtistNavigationProvider } from "@/ui/components/ArtistLinks";
import { TitleBar } from "@/ui/components/TitleBar";
import { PlayerBar } from "@/ui/components/player/PlayerBar";
import { QueuePanel } from "@/ui/components/player/QueuePanel";
import { Layout } from "@/ui/components/Layout";
import { AppLoadingScreen } from "@/ui/components/AppLoadingScreen";
import { AuthOverlay } from "@/ui/components/AuthOverlay";
import { UpdateToast } from "@/ui/components/UpdateToast";
import { ReleaseNoteDialog } from "@/ui/components/ReleaseNoteDialog";
import { Onboarding } from "@/ui/components/Onboarding";
import { OnboardingCompleteToast } from "@/ui/components/Onboarding";
import { KeychainNotice } from "@/ui/components/Onboarding";
import { OnboardingWelcome } from "@/ui/components/Onboarding";
import { useReduceMotion } from "@/ui/settings/renderEffects";
import { useMiniPlayerEnabled, useMiniPlayerWindowLive } from "@/ui/settings/miniPlayer";
import { useKeyboardShortcuts } from "@/ui/settings/keyboardShortcuts";
import { useLastFmScrobblingEnabled } from "@/ui/settings/lastfm";
import { usePlayerUIState } from "@/ui/stores/playerUIStore";
import { useUIStore, usePlaybackStore, useNavigationStore, useCollectionStore } from "@/store/usePlayerStore";
import { HomePage } from "@/ui/pages/HomePage";

// Lazy-loaded pages
const AlbumView = lazy(() => import("@/ui/pages/AlbumView").then((m) => ({ default: m.AlbumView })));
const ArtistView = lazy(() => import("@/ui/pages/ArtistView").then((m) => ({ default: m.ArtistView })));
const PlaylistView = lazy(() => import("@/ui/pages/PlaylistView").then((m) => ({ default: m.PlaylistView })));
const RelatedPage = lazy(() => import("@/ui/pages/RelatedPage").then((m) => ({ default: m.RelatedPage })));
const SearchResultsPage = lazy(() => import("@/ui/pages/SearchResultsPage").then((m) => ({ default: m.SearchResultsPage })));
const LibraryPage = lazy(() => import("@/ui/pages/LibraryPage").then((m) => ({ default: m.LibraryPage })));
const BrowsePage = lazy(() => import("@/ui/pages/BrowsePage").then((m) => ({ default: m.BrowsePage })));
const HistoryPage = lazy(() => import("@/ui/pages/HistoryPage").then((m) => ({ default: m.HistoryPage })));
const SettingsPage = lazy(() => import("@/ui/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const LyricsView = lazy(() => import("@/ui/pages/LyricsView").then((m) => ({ default: m.LyricsView })));
const FilesPage = lazy(() => import("@/ui/pages/FilesPage").then((m) => ({ default: m.FilesPage })));
const TransferPage = lazy(() => import("@/ui/pages/TransferPage").then((m) => ({ default: m.TransferPage })));
const ArtistDashboardPage = lazy(() => import("@/ui/pages/ArtistDashboardPage").then((m) => ({ default: m.ArtistDashboardPage })));

// Tauri-specific imports (dynamic)
let tauriImports: {
  invoke: any;
  emit: any;
  listen: any;
  WebviewWindow: any;
  getCurrentWindow: any;
  currentMonitor: any;
  primaryMonitor: any;
  availableMonitors: any;
  PhysicalPosition: any;
  destroyMiniPlayerWindow: any;
  ensureMiniPlayerWindow: any;
  getSavedMiniPlayerPosition: any;
  saveMiniPlayerPosition: any;
  setAutostartEnabled: any;
  persistMainWindowGeometry: any;
  eventMatchesShortcut: any;
} | null = null;

async function loadTauriImports() {
  if (typeof window !== "undefined" && "__TAURI__" in window) {
    const [core, event, windowApi, dpi, miniPlayer, autostart, shortcuts, mainWindowGeometry] = await Promise.all([
      import("@tauri-apps/api/core"),
      import("@tauri-apps/api/event"),
      import("@tauri-apps/api/window"),
      import("@tauri-apps/api/dpi"),
      import("@/ui/settings/miniPlayer"),
      import("@/ui/settings/autostart"),
      import("@/ui/settings/keyboardShortcuts"),
      import("@/ui/settings/mainWindowGeometry"),
    ]);
    tauriImports = {
      invoke: core.invoke,
      emit: event.emit,
      listen: event.listen,
      WebviewWindow: windowApi.WebviewWindow,
      getCurrentWindow: windowApi.getCurrentWindow,
      currentMonitor: windowApi.currentMonitor,
      primaryMonitor: windowApi.primaryMonitor,
      availableMonitors: windowApi.availableMonitors,
      PhysicalPosition: dpi.PhysicalPosition,
      destroyMiniPlayerWindow: miniPlayer.destroyMiniPlayerWindow,
      ensureMiniPlayerWindow: miniPlayer.ensureMiniPlayerWindow,
      getSavedMiniPlayerPosition: miniPlayer.getSavedMiniPlayerPosition,
      saveMiniPlayerPosition: miniPlayer.saveMiniPlayerPosition,
      setAutostartEnabled: autostart.setAutostartEnabled,
      persistMainWindowGeometry: mainWindowGeometry.persistMainWindowGeometry,
      eventMatchesShortcut: shortcuts.eventMatchesShortcut,
    };
  }
  return tauriImports;
}

const isTauri = typeof window !== "undefined" && "__TAURI__" in window;
const LOADING_SCREEN_FADE_MS = 80;
const LOADING_SCREEN_MAX_MS = 4000;
const LOADING_SCREEN_MIN_MS = 1000;
const SESSION_HEARTBEAT_MS = 5000;

function App() {
  const [tauriReady, setTauriReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showKeychainNotice, setShowKeychainNotice] = useState(false);
  const reduceMotion = useReduceMotion();
  const miniPlayerEnabled = useMiniPlayerEnabled();
  const miniPlayerWindowLive = useMiniPlayerWindowLive();
  const keyboardShortcuts = useKeyboardShortcuts();
  const lastFmEnabled = useLastFmScrobblingEnabled();
  const playerUI = usePlayerUIState();
  const { minimized, leftPanelOpen, rightPanelOpen, lyricsOpen } = useUIStore();
  const { currentTrack, isPlaying, queue, queueIndex } = usePlaybackStore();
  const { activeTab } = useNavigationStore();
  const { likedTracks } = useCollectionStore();

  useEffect(() => {
    // Load Tauri-specific functionality
    loadTauriImports().then(() => {
      setTauriReady(true);
      setLoading(false);
    });

    // Minimum loading screen time
    const timer = setTimeout(() => setLoading(false), LOADING_SCREEN_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Check onboarding status
    const onboardingComplete = localStorage.getItem("onboardingComplete");
    if (!onboardingComplete) {
      setShowOnboarding(true);
    }
  }, []);

  // Session heartbeat for Tauri
  useEffect(() => {
    if (!isTauri || !currentTrack) return;
    const interval = setInterval(() => {
      // Save session periodically
      localStorage.setItem("amber-music-session", JSON.stringify({
        track: currentTrack,
        queueIndex,
        progress: 0,
        timestamp: Date.now(),
      }));
    }, SESSION_HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [currentTrack, queueIndex, isTauri]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!tauriImports) return;
    const handleKeydown = (e: KeyboardEvent) => {
      if (tauriImports?.eventMatchesShortcut(e, "playPause")) {
        // Toggle play/pause handled by player
      }
      // Handle other shortcuts
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [tauriImports, keyboardShortcuts]);

  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return <HomePage />;
      case "explore":
        return <BrowsePage />;
      case "library":
        return <LibraryPage />;
      case "liked":
        return <LibraryPage initialView="liked" />;
      case "playlists":
        return <LibraryPage initialView="playlists" />;
      case "artists":
        return <LibraryPage initialView="artists" />;
      case "albums":
        return <LibraryPage initialView="albums" />;
      case "files":
        return <FilesPage />;
      case "search":
        return <SearchResultsPage />;
      case "settings":
        return <SettingsPage />;
      case "transfer":
        return <TransferPage />;
      case "artistDashboard":
        return <ArtistDashboardPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <MotionConfig reduceMotion={reduceMotion} transition={{ duration: 0.2 }}>
      <AnimatePresence mode="wait">
        {loading && <AppLoadingScreen />}
        {!loading && (
          <ErrorBoundary label="App">
            <AuthOverlay>
              <Onboarding
                isOpen={showOnboarding}
                onComplete={() => {
                  localStorage.setItem("onboardingComplete", "true");
                  setShowOnboarding(false);
                }}
              >
                <OnboardingWelcome
                  isOpen={showOnboarding}
                  onComplete={() => {
                    localStorage.setItem("onboardingComplete", "true");
                    setShowOnboarding(false);
                  }}
                />
                <KeychainNotice
                  isOpen={showKeychainNotice}
                  onComplete={() => setShowKeychainNotice(false)}
                />
                <OnboardingCompleteToast
                  isOpen={showOnboarding}
                  onClose={() => setShowOnboarding(false)}
                />
                <TrackContextMenuProvider>
                  <PlaylistContextMenuProvider>
                    <ArtistNavigationProvider>
                      <Layout
                        leftPanelOpen={leftPanelOpen}
                        rightPanelOpen={rightPanelOpen}
                        lyricsOpen={lyricsOpen}
                        minimized={minimized}
                      >
                        <TitleBar />
                        <SearchOverlay />
                        <main className="flex-1 overflow-hidden">
                          <Suspense fallback={<div className="flex h-full items-center justify-center" />}>
                            {renderPage()}
                          </Suspense>
                        </main>
                        <PlayerBar />
                      </Layout>
                    </ArtistNavigationProvider>
                  </PlaylistContextMenuProvider>
                </TrackContextMenuProvider>
                <ReleaseNoteDialog />
                <UpdateToast />
              </Onboarding>
            </AuthOverlay>
          </ErrorBoundary>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

export { App };