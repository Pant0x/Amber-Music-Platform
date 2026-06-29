'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { usePlayerStore } from '@/store/usePlayerStore';
import { ArtistView } from '@/components/pages/ArtistView';

export default function ArtistPage() {
  const params = useParams();
  const id = params?.id as string;
  const { setActiveTab, setCurrentChannelId, fetchChannelDetails } = usePlayerStore();

  useEffect(() => {
    if (id) {
      const decodedId = decodeURIComponent(id);
      
      setActiveTab('channel');
      setCurrentChannelId(decodedId);
      
      const isYtOrSpotifyId = decodedId.startsWith('UC') || decodedId.startsWith('FE') || decodedId.length === 22 || decodedId === 'german-fairuz';
      fetchChannelDetails(decodedId, !isYtOrSpotifyId);
    }
  }, [id, setActiveTab, setCurrentChannelId, fetchChannelDetails]);

  return <ArtistView />;
}
