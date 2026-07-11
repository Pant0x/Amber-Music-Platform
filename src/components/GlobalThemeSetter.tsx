'use client';

import React, { useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';

const upgradeThumbnailUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.includes('googleusercontent.com')) {
    return url.replace(/=w\d+-h\d+.*$/, '=w544-h544-l90-rj').replace(/=s\d+.*$/, '=w544-h544-l90-rj');
  }
  if (url.includes('i.ytimg.com/vi/') || url.includes('img.youtube.com/vi/')) {
    const cleanUrl = url.split('?')[0];
    return cleanUrl.replace(/\/(default|mqdefault|sddefault|hqdefault|maxresdefault)\.jpg/, '/hqdefault.jpg');
  }
  return url;
};

export const GlobalThemeSetter: React.FC = () => {
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  useEffect(() => {
    // Default fallback values (deep warm dark red/pink theme matching image 1)
    const defaults = {
      dominant: 'rgba(239, 35, 60, 0.1)',
      glow: 'rgba(239, 35, 60, 0.35)',
      accent: 'rgb(239, 35, 60)',
      accentHover: 'rgba(239, 35, 60, 0.8)',
      border: 'rgba(239, 35, 60, 0.2)',
      sidebarBg: 'linear-gradient(to bottom, rgba(239, 35, 60, 0.12), #090606)',
      mainBg: 'linear-gradient(to bottom, rgba(239, 35, 60, 0.1), #040303)',
      playerBg: 'linear-gradient(to bottom, rgba(239, 35, 60, 0.15), #070505)'
    };

    const applyTheme = (theme: typeof defaults) => {
      const root = document.documentElement;
      root.style.setProperty('--theme-dominant', theme.dominant);
      root.style.setProperty('--theme-glow', theme.glow);
      root.style.setProperty('--theme-accent', theme.accent);
      root.style.setProperty('--theme-accent-hover', theme.accentHover);
      root.style.setProperty('--theme-border', theme.border);
      root.style.setProperty('--theme-sidebar-bg', theme.sidebarBg);
      root.style.setProperty('--theme-main-bg', theme.mainBg);
      root.style.setProperty('--theme-player-bg', theme.playerBg);
    };

    if (!currentTrack) {
      applyTheme(defaults);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = upgradeThumbnailUrl(currentTrack.thumbnailUrl);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          applyTheme(defaults);
          return;
        }
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

        // Enhance color vibrancy for accent if it's too dark or dull
        const max = Math.max(r, g, b);
        let ar = r, ag = g, ab = b;
        if (max < 100) {
          // Brighten up dark dominant colors for UI accents
          const scale = 150 / (max || 1);
          ar = Math.min(255, Math.round(r * scale));
          ag = Math.min(255, Math.round(g * scale));
          ab = Math.min(255, Math.round(b * scale));
        }

        applyTheme({
          dominant: `rgba(${r}, ${g}, ${b}, 0.1)`,
          glow: `rgba(${r}, ${g}, ${b}, 0.45)`,
          accent: `rgb(${ar}, ${ag}, ${ab})`,
          accentHover: `rgba(${ar}, ${ag}, ${ab}, 0.8)`,
          border: `rgba(${r}, ${g}, ${b}, 0.22)`,
          sidebarBg: `linear-gradient(to bottom, rgba(${r}, ${g}, ${b}, 0.15), #090606)`,
          mainBg: `linear-gradient(to bottom, rgba(${r}, ${g}, ${b}, 0.1), #040303)`,
          playerBg: `linear-gradient(to bottom, rgba(${r}, ${g}, ${b}, 0.18), #070505)`
        });
      } catch (e) {
        console.warn('CORS blocked global color extraction, using fallback');
        applyTheme(defaults);
      }
    };

    img.onerror = () => {
      applyTheme(defaults);
    };
  }, [currentTrack]);

  return null;
};
