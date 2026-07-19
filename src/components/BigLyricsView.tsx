'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Music, Disc } from 'lucide-react';
import { parseFeaturedArtists } from '@/utils/text';

const upgradeThumbnailUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.includes('googleusercontent.com')) {
    return url.replace(/=w\d+-h\d+.*$/, '=w544-h544-l90-rj').replace(/=s\d+.*$/, '=w544-h544-l90-rj');
  }
  if (url.includes('i.ytimg.com/vi/') || url.includes('img.youtube.com/vi/')) {
    const cleanUrl = url.split('?')[0];
    return cleanUrl.replace(/\/(default|mqdefault|sddefault|hqdefault|maxresdefault)\.jpg/, '/maxresdefault.jpg');
  }
  return url;
};

export const BigLyricsView: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    playedSeconds,
    setSeekTrigger,
    globalLyricsData,
    globalLyricsLoading
  } = usePlayerStore();

  const activeLyricRef = useRef<HTMLParagraphElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const userScrollingRef = useRef(false);
  const lastScrollTimeRef = useRef(Date.now());
  const lastProgrammaticScrollRef = useRef(0);

  // Sync index calculation
  const activeLineIndex = useMemo(() => {
    if (!globalLyricsData?.lines) return -1;
    const lines = globalLyricsData.lines;

    // Synced lyrics binary search
    if (globalLyricsData.isSynced) {
      let low = 0;
      let high = lines.length - 1;
      let bestMatch = -1;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const line = lines[mid];

        if (line.time === -999) {
          return lines.findIndex((l, idx) => {
            const nextL = lines[idx + 1];
            return l.time !== -999 && playedSeconds >= l.time && (!nextL || playedSeconds < nextL.time);
          });
        }

        if (playedSeconds >= line.time) {
          bestMatch = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      return bestMatch;
    }

    // Unsynced lyrics fallback logic (scrolling based)
    return -1;
  }, [globalLyricsData, playedSeconds]);

  // Center scroll helper
  const scrollToActiveLyric = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    const element = activeLyricRef.current;
    if (!container || !element) return;

    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const targetTop = elementRect.top - containerRect.top + container.scrollTop - containerRect.height / 2 + elementRect.height / 2;

    lastProgrammaticScrollRef.current = Date.now();
    container.scrollTo({
      top: targetTop,
      behavior
    });
  }, []);

  // Handle user manual scroll suspension
  const handleUserScroll = useCallback(() => {
    if (Date.now() - lastProgrammaticScrollRef.current < 1000) return;
    userScrollingRef.current = true;
    lastScrollTimeRef.current = Date.now();
  }, []);

  // Resume auto-scrolling after inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      if (userScrollingRef.current && Date.now() - lastScrollTimeRef.current > 3000) {
        userScrollingRef.current = false;
        scrollToActiveLyric('smooth');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [scrollToActiveLyric]);

  // Sync scroll on active index transitions
  useEffect(() => {
    if (activeLineIndex < 0 || !globalLyricsData?.lines) return;
    if (userScrollingRef.current) return;

    const timer = setTimeout(() => {
      scrollToActiveLyric('smooth');
    }, 120);

    return () => clearTimeout(timer);
  }, [activeLineIndex, globalLyricsData, scrollToActiveLyric]);

  // Reset lock when song changes
  useEffect(() => {
    userScrollingRef.current = false;
  }, [currentTrack?.id]);

  if (!currentTrack) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-550 h-full">
        <Music className="w-12 h-12 stroke-[1.5] mb-3 animate-pulse" />
        <p className="text-sm font-semibold">Select a song to display lyrics</p>
      </div>
    );
  }

  const parsed = parseFeaturedArtists(currentTrack.title);

  return (
    <div 
      className="absolute inset-0 flex flex-col select-none overflow-hidden z-40 animate-scale-in bg-zinc-950"
    >
      {/* Immersive blurred album cover background - Apple Music style */}
      {currentTrack.thumbnailUrl && (
        <div 
          className="absolute inset-0 z-0 opacity-50 scale-[1.3] blur-[100px] saturate-[1.4]"
          style={{
            backgroundImage: `url(${upgradeThumbnailUrl(currentTrack.thumbnailUrl)})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />
      )}
      {/* Multi-layer gradient overlay for deep readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/50 via-black/65 to-black/85" />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

      <div className="flex-1 flex flex-col min-h-0 relative z-10 px-6 md:px-16 lg:px-28">
        {globalLyricsLoading ? (
          <div className="flex-1 flex flex-col justify-center space-y-8 max-w-2xl mx-auto w-full pt-10">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className="h-8 bg-white/5 rounded-xl animate-shimmer" 
                style={{ width: `${60 + Math.random() * 30}%`, animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        ) : globalLyricsData?.lines ? (
          <div
            ref={containerRef}
            onScroll={handleUserScroll}
            className={`flex-1 overflow-y-auto space-y-5 no-scrollbar py-[40vh] select-text relative ${globalLyricsData.isSynced ? 'text-left' : 'text-center max-w-4xl mx-auto'}`}
          >
            {globalLyricsData.lines.map((line, idx) => {
              const isSynced = globalLyricsData.isSynced;
              const isActive = isSynced && idx === activeLineIndex;
              const isPast = isSynced && idx < activeLineIndex;
              const isClickable = isSynced && line.time !== -999;
              const isArabic = /[\u0600-\u06FF]/.test(line.text);
              
              return (
                <p
                  key={`big-lyric-${idx}`}
                  ref={isActive ? activeLyricRef : null}
                  data-lyric-line
                  dir={isArabic ? 'rtl' : 'ltr'}
                  onClick={() => {
                    if (isClickable) {
                      setSeekTrigger(line.time);
                    }
                  }}
                  className={`text-2xl md:text-4xl lg:text-[2.75rem] font-black leading-[1.2] tracking-tight px-3 py-2 rounded-xl transition-all duration-500 ease-out select-text ${
                    isArabic 
                      ? isSynced ? 'text-right origin-right' : 'text-center'
                      : isSynced ? 'text-left origin-left' : 'text-center'
                  } ${
                    isClickable ? 'cursor-pointer' : 'cursor-default'
                  } ${
                    !isSynced 
                      ? 'text-white/90' 
                      : isActive
                        ? 'text-white scale-[1.03] opacity-100 font-extrabold'
                        : isPast
                          ? 'text-white/25 scale-[0.97] font-semibold'
                          : 'text-white/45 scale-[0.97] hover:scale-[0.99] hover:text-white/75 font-semibold'
                  }`}
                  style={isActive ? {
                    textShadow: '0 0 40px rgba(255,255,255,0.15)'
                  } : undefined}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <Disc className="w-16 h-16 stroke-[1] text-white/15 animate-spin" style={{ animationDuration: '4s' }} />
            <div>
              <p className="text-white/40 text-base font-semibold">Lyrics not available</p>
              <p className="text-white/20 text-sm mt-1 font-medium">{parsed.title} — {currentTrack.channelTitle}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
