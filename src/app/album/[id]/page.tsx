'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PlaylistView } from '@/components/pages/PlaylistView';
import { usePlayerStore } from '@/store/usePlayerStore';

export default function AlbumPage() {
  const params = useParams();
  const id = params?.id as string;
  const { setActiveTab, setCurrentPlaylistId } = usePlayerStore();

  useEffect(() => {
    if (id) {
      setActiveTab('playlist');
      setCurrentPlaylistId(decodeURIComponent(id));
    }
  }, [id, setActiveTab, setCurrentPlaylistId]);

  return <PlaylistView mode="custom" />;
}
