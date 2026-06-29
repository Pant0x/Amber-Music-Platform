'use client';

import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';

export const DatabaseSync: React.FC = () => {
  const playlists = usePlayerStore(state => state.playlists);
  const likedTracks = usePlayerStore(state => state.likedTracks);
  const subscribedChannels = usePlayerStore(state => state.subscribedChannels);
  const history = usePlayerStore(state => state.history);
  const displayName = usePlayerStore(state => state.displayName);
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

  // 2. State Watcher: Sync local changes to DB (debounced by 1.5 seconds)
  useEffect(() => {
    if (!isHydrated || !initialLoadRef.current) return;

    const timer = setTimeout(async () => {
      try {
        await fetch('/api/user/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            display_name: displayName,
            liked_tracks: likedTracks,
            subscribed_channels: subscribedChannels,
            playlists: playlists,
            history: history
          })
        });
      } catch (err) {
        console.error('[Sync Component] Failed to save state to database:', err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [playlists, likedTracks, subscribedChannels, history, displayName, isHydrated]);

  return null;
};
