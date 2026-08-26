import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amber Music Platform",
  description: "A modern music platform with YouTube Music integration, lyrics, and desktop app",
  keywords: ["music", "youtube music", "player", "lyrics", "desktop app"],
  authors: [{ name: "Pant0x" }],
  creator: "Pant0x",
  publisher: "Amber Music Platform",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://amber-music-platform.vercel.app",
    siteName: "Amber Music Platform",
    title: "Amber Music Platform",
    description: "A modern music platform with YouTube Music integration, lyrics, and desktop app",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Amber Music Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Amber Music Platform",
    description: "A modern music platform with YouTube Music integration, lyrics, and desktop app",
    images: ["/og-image.png"],
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </head>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}