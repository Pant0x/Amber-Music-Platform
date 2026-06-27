import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { usePlayback } from '@/context/PlaybackContext';

// Helper to generate deterministic metadata based on YouTube Video ID
const getDeterministicMetadata = (trackId: string) => {
  let hash = 0;
  for (let i = 0; i < trackId.length; i++) {
    hash = trackId.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  const bpms = [72, 80, 85, 90, 95, 100, 105, 110, 115, 120, 128, 140];
  const keys = [
    'A Minor', 'C Major', 'E Minor', 'G Major', 
    'D Minor', 'F Major', 'C# Minor', 'B Minor', 
    'A♭ Major', 'E♭ Major', 'F# Minor', 'G# Minor'
  ];
  const bpm = bpms[hash % bpms.length];
  const key = keys[(hash >> 2) % keys.length];
  return { bpm, key };
};

export const useTrackMetadata = () => {
  const { updateTrackMetadata } = usePlayback();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const hydrateTrackMetadata = useCallback(async (trackId: string) => {
    if (!trackId) return null;
    
    setLoading(true);
    setError(null);

    try {
      // 1. Try Supabase if initialized
      if (supabase) {
        const { data, error: dbError } = await supabase
          .from('tracks_metadata_cache')
          .select('bpm, key_signature')
          .eq('id', trackId)
          .single();

        if (!dbError && data) {
          const metadata = { bpm: data.bpm, key: data.key_signature };
          updateTrackMetadata(trackId, metadata);
          setLoading(false);
          return metadata;
        }
      }

      // 2. Fallback: Check local storage client cache stub
      const cacheKey = `yt_metadata_cache_${trackId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          updateTrackMetadata(trackId, parsed);
          setLoading(false);
          return parsed;
        } catch (e) {
          console.error('Failed to parse cached metadata from localStorage', e);
        }
      }

      // 3. Fallback: Generate consistent mock metadata and save it to the cache stub
      const mockMeta = getDeterministicMetadata(trackId);
      localStorage.setItem(cacheKey, JSON.stringify(mockMeta));
      updateTrackMetadata(trackId, mockMeta);
      
      setLoading(false);
      return mockMeta;
    } catch (err: any) {
      console.error('Error in hydrateTrackMetadata:', err);
      setError(err.message || 'Failed to fetch metadata');
      setLoading(false);
      return null;
    }
  }, [updateTrackMetadata]);

  const saveTrackMetadata = useCallback(async (trackId: string, bpm: number | null, key: string | null) => {
    if (!trackId) return false;
    
    setLoading(true);
    setError(null);

    try {
      const payload = { bpm, key };
      
      // 1. Write back to Supabase if configured
      if (supabase) {
        const { error: dbError } = await supabase
          .from('tracks_metadata_cache')
          .upsert({ 
            id: trackId, 
            bpm: bpm, 
            key_signature: key,
            updated_at: new Date().toISOString()
          });

        if (dbError) {
          console.warn('Supabase upsert error, saving locally:', dbError);
        }
      }

      // 2. Write back to local storage client cache stub
      const cacheKey = `yt_metadata_cache_${trackId}`;
      localStorage.setItem(cacheKey, JSON.stringify(payload));
      
      // Update global context state
      updateTrackMetadata(trackId, payload);
      
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error saving track metadata:', err);
      setError(err.message || 'Failed to save metadata');
      setLoading(false);
      return false;
    }
  }, [updateTrackMetadata]);

  return {
    hydrateTrackMetadata,
    saveTrackMetadata,
    loading,
    error
  };
};
