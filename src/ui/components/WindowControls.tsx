import { useEffect, useState, useSyncExternalStore } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "@/lib/utils";
import { logInternalError, logInternalInfo, logInternalWarn } from "../../internal/logging";
import {
  isLinux,
  isWindows,
  isTilingWindowManager,
  subscribeTilingWindowManager,
} from "../platform";
import {
  useForceWindowControls,
  useNativeWindowControls,
  useWindowsStyleWindowControls,
} from "../settings/windowControls";

interface WindowControlsProps {
  className?: string;
  isMaximized?: boolean;
}

const WINDOW_BUTTON_BASE =
  "flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function WindowControls({ className, isMaximized: isMaxProp }: WindowControlsProps) {
  const appWindow = getCurrentWindow();
  const nativeWindowControls = useNativeWindowControls();
  const windowsStyleWindowControls = useWindowsStyleWindowControls();
  const forceWindowControls = useForceWindowControls();

  const tilingWindowManager = useSyncExternalStore(
    subscribeTilingWindowManager,
    isTilingWindowManager,
    () => false,
  );

  const showCustomWindowControls =
    isWindows || (!nativeWindowControls && (!isLinux || !tilingWindowManager || forceWindowControls));

  const [internalIsMax, setInternalIsMax] = useState(false);
  const isMax = isMaxProp !== undefined ? isMaxProp : internalIsMax;

  useEffect(() => {
    let active = true;
    appWindow
      .isMaximized()
      .then((m) => {
        if (active) setInternalIsMax(m);
      })
      .catch(() => {});

    const unlisten = appWindow.onResized(() => {
      appWindow
        .isMaximized()
        .then((m) => {
          if (active) setInternalIsMax(m);
        })
        .catch(() => {});
    });

    return () => {
      active = false;
      void unlisten.then((fn) => fn?.());
    };
  }, [appWindow]);

  if (!showCustomWindowControls) return null;

  const handleMinimize = async () => {
    try {
      if (await appWindow.isFullscreen()) {
        await appWindow.setFullscreen(false);
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }
      await appWindow.minimize();
    } catch (error) {
      logInternalError("WindowControls.minimize failed", error);
    }
  };

  const handleToggleMaximize = async () => {
    try {
      const maximized = await appWindow.isMaximized();
      if (maximized) {
        await appWindow.unmaximize();
        setInternalIsMax(false);
      } else {
        await appWindow.maximize();
        setInternalIsMax(true);
      }
    } catch (error) {
      logInternalError("WindowControls.maximize failed", error);
      try {
        await appWindow.toggleMaximize();
      } catch (fallbackError) {
        logInternalError("WindowControls.toggleMaximize fallback failed", fallbackError);
      }
    }
  };

  const handleClose = () => {
    logInternalInfo("WindowControls.close clicked");
    try {
      window.dispatchEvent(new Event("beforeunload"));
    } catch {}
    void invoke("quit_app")
      .then(() => {
        logInternalInfo("WindowControls.close quit_app invoked");
      })
      .catch((error) => {
        logInternalError("WindowControls.close quit_app failed", error);
        logInternalWarn("WindowControls.close fallback to appWindow.close");
        void appWindow.close();
      });
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center pointer-events-auto z-20",
        windowsStyleWindowControls ? "gap-0 h-full" : "gap-1.5 px-3",
        className,
      )}
      aria-label="Window controls"
    >
      <button
        type="button"
        aria-label="Minimize"
        className={cn(
          WINDOW_BUTTON_BASE,
          windowsStyleWindowControls
            ? "h-full w-12 hover:bg-white/10 active:bg-white/15 text-muted-foreground hover:text-foreground cursor-pointer"
            : "size-3 rounded-full bg-muted-foreground/40 hover:bg-muted-foreground cursor-pointer",
        )}
        onClick={() => void handleMinimize()}
      >
        {windowsStyleWindowControls ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" className="size-2.5">
            <path d="M1 5h8" />
          </svg>
        ) : null}
      </button>

      <button
        type="button"
        aria-label={isMax ? "Restore" : "Maximize"}
        className={cn(
          WINDOW_BUTTON_BASE,
          windowsStyleWindowControls
            ? "h-full w-12 hover:bg-white/10 active:bg-white/15 text-muted-foreground hover:text-foreground cursor-pointer"
            : "size-3 rounded-full bg-muted-foreground/40 hover:bg-muted-foreground cursor-pointer",
        )}
        onClick={() => void handleToggleMaximize()}
      >
        {windowsStyleWindowControls ? (
          isMax ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" className="size-2.5">
              <path d="M3 3h5.5v5.5H3z" />
              <path d="M1.5 7V1.5H7" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" className="size-2.5">
              <rect x="1.5" y="1.5" width="7" height="7" />
            </svg>
          )
        ) : null}
      </button>

      <button
        type="button"
        aria-label="Close"
        className={cn(
          WINDOW_BUTTON_BASE,
          windowsStyleWindowControls
            ? "h-full w-12 hover:bg-[#e81123] active:bg-[#c4101f] hover:text-white active:text-white text-muted-foreground cursor-pointer transition-colors"
            : "size-3 rounded-full bg-muted-foreground/40 hover:bg-primary cursor-pointer",
        )}
        onClick={handleClose}
      >
        {windowsStyleWindowControls ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" className="size-2.5">
            <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
          </svg>
        ) : null}
      </button>
    </div>
  );
}
