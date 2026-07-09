'use client';

import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';

export const DatabaseSync: React.FC = () => {
  const playlists = usePlayerStore(state => state.playlists);
  const likedTracks = usePlayerStore(state => state.likedTracks);
  const subscribedChannels = usePlayerStore(state => state.subscribedChannels);
  const history = usePlayerStore(state => state.history);
  const displayName = usePlayerStore(state => state.displayName);
  const avatarUrl = usePlayerStore(state => state.avatarUrl);
  const fetchDatabaseData = usePlayerStore(state => state.fetchDatabaseData);
  const isHydrated = usePlayerStore(state => state._hasHydrated);

  const initialLoadRef = useRef(false);

  // 1. Initial Load: Fetch DB data on hydration
  useEffect(() => {
    if (isHydrated && !initialLoadRef.current) {
      initialLoadRef.current = true;
      fetchDatabaseData();
    }
  }, [isHydrated, fetchDatabaseData]);

  const lastSyncHash = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // 2. State Watcher: Sync local changes to DB (debounced by 5 seconds)
  useEffect(() => {
    if (!isHydrated || !initialLoadRef.current) return;

    const payloadString = JSON.stringify({
      display_name: displayName,
      avatar_url: avatarUrl,
      liked_tracks: likedTracks,
      subscribed_channels: subscribedChannels,
      playlists: playlists,
      history: history
    });

    if (payloadString === lastSyncHash.current) {
      return; // No changes to sync
    }

    const timer = setTimeout(async () => {
      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        abortControllerRef.current = new AbortController();

        await fetch('/api/user/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: payloadString,
          signal: abortControllerRef.current.signal
        });
        
        lastSyncHash.current = payloadString;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('[Sync Component] Failed to save state to database:', err);
        }
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [playlists, likedTracks, subscribedChannels, history, displayName, avatarUrl, isHydrated]);

  return null;
};
