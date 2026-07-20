'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { NowPlayingView } from '@/components/NowPlayingView';
import { BottomPlayerBar } from '@/components/BottomPlayerBar';
import { MediaDeck } from '@/components/MediaDeck';
import { DatabaseSync } from '@/components/DatabaseSync';
import { ShareResolver } from '@/components/ShareResolver';
import { ShareModal } from '@/components/ShareModal';
import { GlobalThemeSetter } from '@/components/GlobalThemeSetter';
import { Suspense } from 'react';
import { LyricsOverlay } from '@/components/LyricsOverlay';

export const AppLayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  
  const isAuthPage = 
    pathname.startsWith('/sign-in') || 
    pathname.startsWith('/sign-up') || 
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/admin/login');

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-screen bg-black overflow-hidden flex flex-col justify-center items-center">
        {children}
      </div>
    );
  }

  return (
    <>
      {/* Apple Music Ambient Glow Layer */}
      <div 
        className="fixed inset-0 pointer-events-none transition-colors duration-[2000ms] ease-in-out z-0"
        style={{
          background: `radial-gradient(circle at 50% -20%, rgba(var(--theme-ambient-r, 0), var(--theme-ambient-g, 0), var(--theme-ambient-b, 0), 0.15) 0%, transparent 70%)`
        }}
      />

      {/* Main 2-Panel horizontal layout container */}
      <div className="flex-1 flex min-w-0 overflow-hidden relative z-10">
        
        {/* 1. Left Navigation Sidebar (Full Height) */}
        <Sidebar />

        {/* 2. Right Workspace Container */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Top Search bar & Navigation Header */}
          <Header />

          {/* Bottom 2-Panel split layout (Main Content + Right Player Dock) */}
          <div className="flex-1 flex min-w-0 overflow-hidden relative">
            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative flex flex-col transition-all duration-1000 bg-transparent">
              <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 select-none custom-scrollbar relative">
                {/* Dynamic Ambient Background Orbs – color shifts with the currently playing track */}
                <div 
                  className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none z-0 animate-breathe"
                  style={{ background: 'rgba(var(--theme-ambient-r, 255), var(--theme-ambient-g, 255), var(--theme-ambient-b, 255), 0.06)' }}
                />
                <div 
                  className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none z-0 animate-breathe"
                  style={{ background: 'rgba(var(--theme-ambient-r, 255), var(--theme-ambient-g, 255), var(--theme-ambient-b, 255), 0.04)', animationDelay: '3s' }}
                />
                
                <div className="relative z-10 animate-page-enter">
                  {children}
                </div>
              </div>
              <LyricsOverlay />
            </main>

          </div>

          {/* Mobile Bottom Navigation Bar */}
          <MobileBottomNav />
        </div>
      </div>

      {/* Fullscreen Immersive Player */}
      <NowPlayingView />

      {/* Bottom Horizontal Player controls bar */}
      <BottomPlayerBar />

      {/* MediaDeck plays audio/video in background */}
      <MediaDeck />

      <DatabaseSync />
      <Suspense fallback={null}>
        <ShareResolver />
      </Suspense>
      <ShareModal />
      <GlobalThemeSetter />
    </>
  );
};
