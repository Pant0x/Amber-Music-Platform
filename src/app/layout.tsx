import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from './providers'
import { MediaDeck } from '@/components/MediaDeck';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { PlayerDock } from '@/components/PlayerDock';
import { BottomPlayerBar } from '@/components/BottomPlayerBar';
import { LyricsOverlay } from '@/components/LyricsOverlay';
import { NowPlayingView } from '@/components/NowPlayingView';

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
  title: "Pantooty — Listen to Anything",
  description: "Free music streaming powered by YouTube Music. Search millions of songs, build playlists, and discover new music — no subscription needed.",
  referrer: "no-referrer",
  openGraph: {
    title: "Pantooty — Listen to Anything",
    description: "Free music streaming. No subscription. Search, playlist, and discover — powered by YouTube Music.",
    type: "website",
    siteName: "Pantooty",
  },
  twitter: {
    card: "summary",
    title: "Pantooty — Listen to Anything",
    description: "Free music streaming. No subscription needed.",
  },
  keywords: ["music", "streaming", "free", "playlist", "youtube music", "pantooty"],
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
        className="h-[100dvh] w-screen text-zinc-300 font-sans select-none overflow-hidden flex flex-col transition-all duration-1000 bg-black"
      >
        <Providers>
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
      </Providers>
    </body>
    </html>
  );
}
