import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MediaDeck } from '@/components/MediaDeck';

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
        <div className="flex-1 min-h-0 relative flex flex-col">{children}</div>
        <MediaDeck />
      </body>
    </html>
  );
}
