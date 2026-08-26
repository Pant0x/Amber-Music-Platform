// Hover Capable Hook
import { useState, useEffect } from "react";

export function useHoverCapable(): boolean {
  const [hoverCapable, setHoverCapable] = useState(false);

  useEffect(() => {
    const checkHover = () => {
      setHoverCapable(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    };

    checkHover();
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    mediaQuery.addEventListener("change", checkHover);
    return () => mediaQuery.removeEventListener("change", checkHover);
  }, []);

  return hoverCapable;
}