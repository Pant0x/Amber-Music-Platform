import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "@/ui/components/ErrorBoundary";
import "@/app/globals.css";
import { Providers } from "@/app/providers";
import { App } from "@/ui/App";

// Detect if running in Tauri
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

async function bootstrap() {
  // Pre-hydration: Apply theme immediately to prevent flash
  if (typeof window !== "undefined") {
    const theme = localStorage.getItem("theme") || "system";
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      root.classList.add(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }
  }

  // Initialize Tauri-specific features
  if (isTauri) {
    try {
      const { listen } = await import("@tauri-apps/api/event");
      const { DiscordRpcService } = await import("@/player/DiscordRPC");
      const { hydratePlaybackSettings } = await import("@/player/playbackSettings");
      const { hydratePlayHistory } = await import("@/player/playHistory");
      const { syncLocalAudioWatcher, notifyLocalPlaylistsChanged } = await import("@/player/localPlaylists");

      // Initialize Discord RPC
      void DiscordRpcService.init().catch(console.error);

      // Hydrate settings
      await Promise.all([
        hydratePlaybackSettings(),
        hydratePlayHistory(),
      ]).catch(console.error);

      // Local files watcher
      syncLocalAudioWatcher();
      void listen("local-audio-changed", () => notifyLocalPlaylistsChanged());
    } catch (error) {
      console.error("Tauri initialization failed:", error);
    }
  }

  // Global error handlers
  window.addEventListener("error", (event) => {
    console.error("window.error", event.error ?? event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("window.unhandledrejection", event.reason);
  });

  // Render the app
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <ErrorBoundary label="Amber Music">
        <Providers>
          <App />
        </Providers>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

bootstrap();