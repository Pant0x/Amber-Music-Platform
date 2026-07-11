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

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export const GlobalThemeSetter: React.FC = () => {
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  useEffect(() => {
    // Default fallback values (solid dark red/pink gradient theme matching image 1)
    const defaults = {
      dominant: 'rgba(239, 35, 60, 0.08)',
      glow: 'rgba(239, 35, 60, 0.28)',
      accent: 'rgb(239, 35, 60)',
      accentHover: 'rgba(239, 35, 60, 0.8)',
      border: 'rgba(239, 35, 60, 0.15)',
      sidebarBg: 'linear-gradient(to bottom, #120d0d, #060505)',
      mainBg: 'linear-gradient(to bottom, #080808, #000000)',
      playerBg: 'linear-gradient(to bottom, #0a0909, #050505)'
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

        // Convert to HSL
        const { h, s } = rgbToHsl(r, g, b);
        const themeH = h;
        const themeS = Math.max(10, Math.min(s, 35)); // limit saturation to keep it subtle & elegant

        // Generate solid background colors (lightness clamped to extremely dark levels)
        const sidebarColor = `hsl(${themeH}, ${themeS}%, 5.5%)`;
        const mainColor = `hsl(${themeH}, ${themeS}%, 4%)`;
        const playerColor = `hsl(${themeH}, ${themeS}%, 6.5%)`;

        const glowColor = `hsla(${themeH}, ${Math.max(45, s)}%, 50%, 0.3)`;
        const accentColor = `hsl(${themeH}, ${Math.max(60, s)}%, 50%)`;
        const accentHoverColor = `hsl(${themeH}, ${Math.max(60, s)}%, 45%)`;
        const borderColor = `hsla(${themeH}, ${themeS}%, 50%, 0.18)`;
        const dominantColor = `hsla(${themeH}, ${themeS}%, 50%, 0.08)`;

        applyTheme({
          dominant: dominantColor,
          glow: glowColor,
          accent: accentColor,
          accentHover: accentHoverColor,
          border: borderColor,
          sidebarBg: `linear-gradient(to bottom, ${sidebarColor}, #050404)`,
          mainBg: `linear-gradient(to bottom, ${mainColor}, #020202)`,
          playerBg: `linear-gradient(to bottom, ${playerColor}, #050404)`
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
