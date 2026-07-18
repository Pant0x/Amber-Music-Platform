import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MediaDeck } from '@/components/MediaDeck';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { PlayerDock } from '@/components/PlayerDock';
import { BottomPlayerBar } from '@/components/BottomPlayerBar';

import { DatabaseSync } from '@/components/DatabaseSync';
import { ShareResolver } from '@/components/ShareResolver';
import { ShareModal } from '@/components/ShareModal';
import { GlobalThemeSetter } from '@/components/GlobalThemeSetter';
import { Suspense } from 'react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
                  {/* Dynamic Ambient Background Lights */}
                  <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#ff0000]/5 blur-[120px] pointer-events-none z-0" />
                  <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#0055ff]/4 blur-[150px] pointer-events-none z-0" />
                  
                  <div className="relative z-10">
                    {children}
                  </div>
                </div>
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
