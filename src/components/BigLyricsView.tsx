'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Music, Disc } from 'lucide-react';
import { parseFeaturedArtists } from '@/utils/text';

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

  return (
    <div 
      className="absolute inset-0 flex flex-col select-none overflow-hidden z-40 animate-fade-in"
      style={{
        background: 'var(--theme-player-bg, #0a0909)'
      }}
    >
      <div className="flex-1 flex flex-col min-h-0 relative px-6 md:px-16 lg:px-24">
        {globalLyricsLoading ? (
          <div className="flex-1 flex flex-col justify-center space-y-6 max-w-2xl mx-auto w-full pt-10">
            <div className="h-7 bg-white/5 rounded-lg w-3/4 animate-pulse" />
            <div className="h-7 bg-white/5 rounded-lg w-1/2 animate-pulse" />
            <div className="h-7 bg-white/5 rounded-lg w-5/6 animate-pulse" />
            <div className="h-7 bg-white/5 rounded-lg w-2/3 animate-pulse" />
          </div>
        ) : globalLyricsData?.lines ? (
          <div
            ref={containerRef}
            onScroll={handleUserScroll}
            className="flex-1 overflow-y-auto space-y-6 custom-scrollbar py-[35vh] text-left select-text relative"
          >
            {globalLyricsData.lines.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              const isClickable = globalLyricsData.isSynced && line.time !== -999;
              
              return (
                <p
                  key={`big-lyric-${idx}`}
                  ref={isActive ? activeLyricRef : null}
                  data-lyric-line
                  onClick={() => {
                    if (isClickable) {
                      setSeekTrigger(line.time);
                    }
                  }}
                  className={`text-xl md:text-3xl lg:text-4xl font-black leading-tight tracking-tight transition-all duration-300 px-4 py-2 rounded-xl border border-transparent ${
                    isClickable ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default'
                  } ${
                    isActive
                      ? 'text-white scale-[1.02] filter drop-shadow-md'
                      : 'text-zinc-650 opacity-45 hover:opacity-80 hover:text-zinc-300'
                  }`}
                  style={isActive ? { textShadow: '0 4px 12px rgba(0,0,0,0.5)' } : {}}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Disc className="w-12 h-12 stroke-[1.5] text-zinc-600 mb-3 animate-spin duration-[4000ms]" />
            <p className="text-zinc-400 text-sm font-semibold">Lyrics are not available for this track.</p>
          </div>
        )}
      </div>
    </div>
  );
};
