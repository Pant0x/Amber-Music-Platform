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

import { AppLayoutWrapper } from '@/components/AppLayoutWrapper';

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Sonora — Listen to Anything",
  description: "Free music streaming powered by YouTube Music. Search millions of songs, build playlists, and discover new music — no subscription needed.",
  referrer: "no-referrer",
  openGraph: {
    title: "Sonora — Listen to Anything",
    description: "Free music streaming. No subscription. Search, playlist, and discover — powered by YouTube Music.",
    type: "website",
    siteName: "Sonora",
  },
  twitter: {
    card: "summary",
    title: "Sonora — Listen to Anything",
    description: "Free music streaming. No subscription needed.",
  },
  keywords: ["music", "streaming", "free", "playlist", "youtube music", "Sonora"],
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
          <AppLayoutWrapper>
            {children}
          </AppLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
