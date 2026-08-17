'use client';

import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePlayerStore } from '@/store/usePlayerStore';

export const ShareResolver: React.FC = () => {
  const searchParams = useSearchParams();
  const playTrack = usePlayerStore(state => state.playTrack);
  const setSeekTrigger = usePlayerStore(state => state.setSeekTrigger);
  const setPlaying = usePlayerStore(state => state.setPlaying);
  const isHydrated = usePlayerStore(state => state._hasHydrated);

  const resolvedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;

    const playId = searchParams.get('play');
    const timeParam = searchParams.get('t');

    if (playId && resolvedRef.current !== playId) {
      resolvedRef.current = playId;

      const resolveAndPlay = async () => {
        try {
          const res = await fetch(`/api/track?id=${encodeURIComponent(playId)}`);
          if (res.ok) {
            const track = await res.json();
            if (track && track.id) {
              playTrack(track);
              setPlaying(true);

              if (timeParam) {
                const secs = parseInt(timeParam, 10);
                if (!isNaN(secs)) {
                  // Give the audio player player deck a moment to initialize before seeking
                  setTimeout(() => {
                    setSeekTrigger(secs);
                  }, 1200);
                }
              }
            }
          }
        } catch (err) {
          console.error('[Share Resolver] Failed to resolve URL play track:', err);
        }
      };

      resolveAndPlay();
    }
  }, [searchParams, playTrack, setSeekTrigger, setPlaying, isHydrated]);

  return null;
};
