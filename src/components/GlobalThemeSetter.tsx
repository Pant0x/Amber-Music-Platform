'use client';

import React, { useEffect } from 'react';

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
  dominant: 'rgba(157, 210, 230, 0.04)',
  glow: 'rgba(157, 210, 230, 0.15)',
  accent: '#9DD2E6',
  accentHover: '#87BDD1',
  border: 'rgba(255, 255, 255, 0.08)',
  sidebarBg: 'linear-gradient(to bottom, #070708, #000000)',
  mainBg: 'linear-gradient(to bottom, #050505, #000000)',
  playerBg: 'linear-gradient(to bottom, #080809, #000000)',
  ambientR: '157',
  ambientG: '210',
  ambientB: '230'
};

const applyTheme = (theme: ThemeValues) => {
  if (typeof window === 'undefined') return;
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
  useEffect(() => {
    applyTheme(defaults);
  }, []);

  return null;
};
