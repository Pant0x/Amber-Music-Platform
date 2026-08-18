import { useState, useEffect, useRef } from 'react';

export interface ExtractedColors {
  dominant: string;     // rgba(r, g, b, 0.08) for main sidebar bg
  glow: string;         // rgba(r, g, b, 0.35) for ambient neon glow behind cover art
  accent: string;       // rgba(r, g, b, 0.8) for playback slider
  border: string;       // rgba(r, g, b, 0.15) for glowing borders
  cardBg: string;       // rgba(r, g, b, 0.04) for lyrics page scroll backing
}

const FALLBACK_COLORS: ExtractedColors = {
  dominant: 'rgba(239, 35, 60, 0.05)', // fallback dominant (light red tint)
  glow: 'rgba(239, 35, 60, 0.25)',     // fallback glow
  accent: 'rgba(239, 35, 60, 0.8)',
  border: 'rgba(239, 35, 60, 0.12)',
  cardBg: 'rgba(239, 35, 60, 0.03)'
}

export function useDominantColor(imageUrl: string | null | undefined): ExtractedColors {
  const [colors, setColors] = useState<ExtractedColors>(FALLBACK_COLORS);
  const isMounted = useRef(false);

  useEffect(() => {
    // Only run on actual image changes, not on initial mount with no image
    if (!imageUrl) {
      if (isMounted.current) {
        setColors(FALLBACK_COLORS);
      }
      return;
    }

    isMounted.current = true;
    const prevUrl = imageUrl;
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

        // Ensure color has some minimum saturation/brightness for accent
        // Or generate custom opacity layers
        setColors({
          dominant: `rgba(${r}, ${g}, ${b}, 0.07)`,
          glow: `rgba(${r}, ${g}, ${b}, 0.32)`,
          accent: `rgba(${r}, ${g}, ${b}, 0.85)`,
          border: `rgba(${r}, ${g}, ${b}, 0.15)`,
          cardBg: `rgba(${r}, ${g}, ${b}, 0.04)`
        });
      } catch (e) {
        // Fallback on CORS issues
        if (isMounted.current) {
          setColors(FALLBACK_COLORS);
        }
      }
    };

    img.onerror = () => {
      if (isMounted.current) {
        setColors(FALLBACK_COLORS);
      }
    };

    return () => {
      isMounted.current = false;
    };
  }, [imageUrl]);

  return colors;
}
