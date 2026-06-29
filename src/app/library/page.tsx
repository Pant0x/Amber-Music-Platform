'use client';

import React, { useEffect } from 'react';
import { LibraryView } from '@/components/pages/LibraryView';
import { usePlayerStore } from '@/store/usePlayerStore';

export default function LibraryPage() {
  const { setActiveTab } = usePlayerStore();

  useEffect(() => {
    setActiveTab('library');
  }, [setActiveTab]);

  return <LibraryView />;
}
