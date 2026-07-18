'use client';

import React from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { BigLyricsView } from './BigLyricsView';

export const LyricsOverlay: React.FC = () => {
  const activeTab = usePlayerStore((s) => s.activeTab);
  if (activeTab !== 'lyrics') return null;
  return <BigLyricsView />;
};
