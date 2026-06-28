import React from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MainDashboard } from '@/components/MainDashboard';
// MediaDeck is now mounted in the root layout to remain persistent across routes
// import { MediaDeck } from '@/components/MediaDeck';
import { QueuePanel } from '@/components/QueuePanel';
import { NowPlayingView } from '@/components/NowPlayingView';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* 1. YouTube Music Sticky Top Header */}
      <Header />

      {/* 2. Middle Body: Sidebar + Main Content scroll + sliding Queue Panel */}
      <div className="flex-1 flex min-w-0 overflow-hidden relative">

        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Scrollable Dashboard View */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-[#030303]">
          <MainDashboard />
          <NowPlayingView />
        </main>

        {/* Sliding Queue Panel on Right */}
        <QueuePanel />
      </div>

      {/* 3. Persistent Bottom Media Controls with edge progress bar are mounted in layout.tsx */}
    </div>
  );
}
