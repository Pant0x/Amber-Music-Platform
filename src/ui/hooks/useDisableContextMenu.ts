// Disable Context Menu Hook
import { useEffect } from "react";

export function useDisableContextMenu(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, [enabled]);
}