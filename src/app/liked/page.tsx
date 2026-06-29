'use client';

import React, { useEffect } from 'react';
import { PlaylistView } from '@/components/pages/PlaylistView';
import { usePlayerStore } from '@/store/usePlayerStore';

export default function LikedPage() {
  const { setActiveTab } = usePlayerStore();

  useEffect(() => {
    setActiveTab('liked');
  }, [setActiveTab]);

  return <PlaylistView mode="liked" />;
}
