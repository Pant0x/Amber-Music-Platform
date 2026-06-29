import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MediaDeck } from '@/components/MediaDeck';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { QueuePanel } from '@/components/QueuePanel';
import { NowPlayingView } from '@/components/NowPlayingView';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { RouterRegister } from '@/components/RouterRegister';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Music Player",
  description: "A premium Music Player application",
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
      <body className="h-[100dvh] w-screen bg-[#030303] text-zinc-300 font-sans select-none overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 relative flex flex-col">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* 1. YouTube Music Sticky Top Header */}
            <Header />

            {/* 2. Middle Body: Sidebar + Main Content scroll + sliding Queue Panel */}
            <div className="flex-1 flex min-w-0 overflow-hidden relative">
              {/* Left Navigation Sidebar */}
              <Sidebar />

              {/* Scrollable Dashboard View */}
              <main className="flex-1 overflow-hidden relative flex flex-col bg-[#030303]">
                <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 select-none bg-[#030303] custom-scrollbar relative">
                  {/* Dynamic Ambient Background Lights */}
                  <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#ff0000]/5 blur-[120px] pointer-events-none z-0" />
                  <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#0055ff]/4 blur-[150px] pointer-events-none z-0" />
                  
                  <div className="relative z-10">
                    {children}
                  </div>
                </div>
                <NowPlayingView />
              </main>

              {/* Sliding Queue Panel on Right */}
              <QueuePanel />
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <MobileBottomNav />
          </div>
        </div>
        <MediaDeck />
        <RouterRegister />
      </body>
    </html>
  );
}
