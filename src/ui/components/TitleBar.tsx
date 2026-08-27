"use client";

import { useEffect, useRef } from "react";
import { Minimize, Maximize, X as Close, Menu, Sun, Moon, Monitor, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/usePlayerStore";
import { useTheme } from "@/components/providers/ThemeProvider";

export function TitleBar() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { minimized, setMinimized } = useUIStore();
  const isTauri = typeof window !== "undefined" && "__TAURI__" in window;
  const windowRef = useRef<any>(null);

  useEffect(() => {
    if (isTauri) {
      import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        windowRef.current = getCurrentWindow();
      });
    }
  }, [isTauri]);

  const handleMinimize = () => {
    if (isTauri && windowRef.current) {
      windowRef.current.minimize();
    } else {
      setMinimized(true);
    }
  };

  const handleMaximize = async () => {
    if (isTauri && windowRef.current) {
      const isMaximized = await windowRef.current.isMaximized();
      if (isMaximized) {
        await windowRef.current.unmaximize();
      } else {
        await windowRef.current.maximize();
      }
    }
  };

  const handleClose = async () => {
    if (isTauri && windowRef.current) {
      await windowRef.current.hide();
    } else {
      setMinimized(true);
    }
  };

  const handleThemeCycle = () => {
    const themes: ("light" | "dark" | "system")[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    setTheme(themes[(currentIndex + 1) % themes.length]);
  };

  if (!isTauri) {
    return (
      <header className="flex h-12 items-center justify-between px-4 border-b border-border-primary bg-bg-secondary/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600">
            <Music className="h-5 w-5 text-black" />
          </div>
          <span className="font-semibold text-text-primary">Amber Music</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleThemeCycle}
            className="btn-ghost h-8 w-8 p-0"
            aria-label={`Theme: ${resolvedTheme}`}
          >
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </header>
    );
  }

  return (
    <header
      className="flex h-12 items-center justify-between px-4 border-b border-border-primary bg-bg-secondary/80 backdrop-blur-xl -ml-4 -mt-4 ml-4 mt-4"
      style={{
        WebkitAppRegion: "drag",
      } as any}
    >
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: "drag" } as any}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600">
          <Music className="h-5 w-5 text-black" />
        </div>
        <span className="font-semibold text-text-primary">Amber Music</span>
      </div>
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: "no-drag" } as any}>
        <button
          onClick={handleThemeCycle}
          className="btn-ghost h-8 w-8 p-0"
          aria-label={`Theme: ${resolvedTheme}`}
        >
          {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button onClick={handleMinimize} className="btn-ghost h-8 w-8 p-0" aria-label="Minimize">
          <Minimize className="h-5 w-5" />
        </button>
        <button onClick={handleMaximize} className="btn-ghost h-8 w-8 p-0" aria-label="Maximize">
          <Maximize className="h-5 w-5" />
        </button>
        <button onClick={handleClose} className="btn-ghost h-8 w-8 p-0 text-error hover:text-error/80" aria-label="Close">
          <Close className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}