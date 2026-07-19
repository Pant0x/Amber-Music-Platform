import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { MediaDeck } from '@/components/MediaDeck';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { PlayerDock } from '@/components/PlayerDock';
import { BottomPlayerBar } from '@/components/BottomPlayerBar';
import { LyricsOverlay } from '@/components/LyricsOverlay';

import { DatabaseSync } from '@/components/DatabaseSync';
import { ShareResolver } from '@/components/ShareResolver';
import { ShareModal } from '@/components/ShareModal';
import { GlobalThemeSetter } from '@/components/GlobalThemeSetter';
import { Suspense } from 'react';

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Cloud Music",
  description: "Your premium listening experience",
  referrer: "no-referrer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} h-full antialiased`}
    >
      <body 
        className="h-[100dvh] w-screen text-zinc-300 font-sans select-none overflow-hidden flex flex-col transition-all duration-1000"
        style={{ background: 'var(--theme-main-bg, #030303)' }}
      >
        {/* Main 2-Panel horizontal layout container */}
        <div className="flex-1 flex min-w-0 overflow-hidden relative">
          
          {/* 1. Left Navigation Sidebar (Full Height) */}
          <Sidebar />

          {/* 2. Right Workspace Container */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {/* Top Search bar & Navigation Header */}
            <Header />

            {/* Bottom 2-Panel split layout (Main Content + Right Player Dock) */}
            <div className="flex-1 flex min-w-0 overflow-hidden relative">
              {/* Main Content Area */}
              <main 
                className="flex-1 overflow-hidden relative flex flex-col transition-all duration-1000"
                style={{ background: 'var(--theme-main-bg, #030303)' }}
              >
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

              {/* Persistent Right Player Dock */}
              <PlayerDock />
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <MobileBottomNav />
          </div>
        </div>

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
      </body>
    </html>
  );
}
