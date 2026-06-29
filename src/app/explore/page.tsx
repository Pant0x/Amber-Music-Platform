'use client';

import React, { useEffect } from 'react';
import { ExploreView } from '@/components/pages/ExploreView';
import { usePlayerStore } from '@/store/usePlayerStore';

export default function ExplorePage() {
  const { setActiveTab } = usePlayerStore();

  useEffect(() => {
    setActiveTab('explore');
  }, [setActiveTab]);

  return <ExploreView />;
}
