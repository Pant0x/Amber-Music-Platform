'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MainDashboard } from '@/components/MainDashboard';
import { MediaDeck } from '@/components/MediaDeck';
import { QueuePanel } from '@/components/QueuePanel';
import { NowPlayingView } from '@/components/NowPlayingView';

export default function ArtistPage() {
  const params = useParams();
  const id = params?.id as string;
  const { setActiveTab, setCurrentChannelId, fetchChannelDetails } = usePlayerStore();

  useEffect(() => {
    if (id) {
      const decodedId = decodeURIComponent(id);
      console.log(`[Artist Route] Initializing view for artist ID/Name: ${decodedId}`);
      
      setActiveTab('channel');
      setCurrentChannelId(decodedId);
      
      // If it looks like a YouTube browse ID or Spotify ID, fetch by ID. Else, treat as name fallback.
      const isYtOrSpotifyId = decodedId.startsWith('UC') || decodedId.startsWith('FE') || decodedId.length === 22;
      fetchChannelDetails(decodedId, !isYtOrSpotifyId);
    }
  }, [id, setActiveTab, setCurrentChannelId, fetchChannelDetails]);

  return (
    <div className="h-screen w-screen bg-[#030303] flex flex-col text-zinc-300 font-sans select-none overflow-hidden">
      <Header />
      <div className="flex-1 flex min-w-0 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 overflow-hidden relative flex flex-col bg-[#030303]">
          <MainDashboard />
          <NowPlayingView />
        </main>
        <QueuePanel />
      </div>
      <MediaDeck />
    </div>
  );
}
