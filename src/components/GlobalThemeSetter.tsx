'use client';

import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { FastAverageColor } from 'fast-average-color';

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

interface ThemeValues {
  dominant: string;
  glow: string;
  accent: string;
  accentHover: string;
  border: string;
  sidebarBg: string;
  mainBg: string;
  playerBg: string;
  ambientR: string;
  ambientG: string;
  ambientB: string;
}

const defaults: ThemeValues = {
  dominant: 'rgba(255, 255, 255, 0.03)',
  glow: 'rgba(255, 255, 255, 0.1)',
  accent: 'rgb(255, 255, 255)',
  accentHover: 'rgba(255, 255, 255, 0.8)',
  border: 'rgba(255, 255, 255, 0.08)',
  sidebarBg: 'linear-gradient(to bottom, #0f0e0e, #050505)',
  mainBg: 'linear-gradient(to bottom, #070707, #000000)',
  playerBg: 'linear-gradient(to bottom, #0a0909, #050505)',
  ambientR: '255',
  ambientG: '255',
  ambientB: '255'
};

const applyTheme = (theme: ThemeValues) => {
  const root = document.documentElement;
  root.style.setProperty('--theme-dominant', theme.dominant);
  root.style.setProperty('--theme-glow', theme.glow);
  root.style.setProperty('--theme-accent', theme.accent);
  root.style.setProperty('--theme-accent-hover', theme.accentHover);
  root.style.setProperty('--theme-border', theme.border);
  root.style.setProperty('--theme-sidebar-bg', theme.sidebarBg);
  root.style.setProperty('--theme-main-bg', theme.mainBg);
  root.style.setProperty('--theme-player-bg', theme.playerBg);
  root.style.setProperty('--theme-ambient-r', theme.ambientR);
  root.style.setProperty('--theme-ambient-g', theme.ambientG);
  root.style.setProperty('--theme-ambient-b', theme.ambientB);
};

export const GlobalThemeSetter: React.FC = () => {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const facRef = useRef<FastAverageColor | null>(null);

  useEffect(() => {
    facRef.current = new FastAverageColor();
    return () => {
      facRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!currentTrack) {
      applyTheme(defaults);
      return;
    }

    const fac = facRef.current;
    if (!fac) {
      applyTheme(defaults);
      return;
    }

    const thumbUrl = upgradeThumbnailUrl(currentTrack.thumbnailUrl);
    if (!thumbUrl) {
      applyTheme(defaults);
      return;
    }

    fac.getColorAsync(thumbUrl, { algorithm: 'dominant', crossOrigin: 'anonymous' })
      .then((color) => {
        const [r, g, b] = color.value;
        const { h, s } = rgbToHsl(r, g, b);
        const themeH = h;
        const themeS = Math.max(10, Math.min(s, 35));

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
          playerBg: `linear-gradient(to bottom, ${playerColor}, #050404)`,
          ambientR: String(r),
          ambientG: String(g),
          ambientB: String(b)
        });
      })
      .catch(() => {
        // CORS or other error - fallback to canvas method
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = thumbUrl;
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            if (!ctx) { applyTheme(defaults); return; }
            ctx.drawImage(img, 0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            const { h, s } = rgbToHsl(r, g, b);
            const themeH = h;
            const themeS = Math.max(10, Math.min(s, 35));

            applyTheme({
              dominant: `hsla(${themeH}, ${themeS}%, 50%, 0.08)`,
              glow: `hsla(${themeH}, ${Math.max(45, s)}%, 50%, 0.3)`,
              accent: `hsl(${themeH}, ${Math.max(60, s)}%, 50%)`,
              accentHover: `hsl(${themeH}, ${Math.max(60, s)}%, 45%)`,
              border: `hsla(${themeH}, ${themeS}%, 50%, 0.18)`,
              sidebarBg: `linear-gradient(to bottom, hsl(${themeH}, ${themeS}%, 5.5%), #050404)`,
              mainBg: `linear-gradient(to bottom, hsl(${themeH}, ${themeS}%, 4%), #020202)`,
              playerBg: `linear-gradient(to bottom, hsl(${themeH}, ${themeS}%, 6.5%), #050404)`,
              ambientR: String(r),
              ambientG: String(g),
              ambientB: String(b)
            });
          } catch {
            applyTheme(defaults);
          }
        };
        img.onerror = () => applyTheme(defaults);
      });
  }, [currentTrack]);

  return null;
};
