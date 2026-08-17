// BPM and Key Detection utilities
// Note: Full implementation requires direct Spotify API access
// This file provides helper functions for when audio features are available

export interface AudioAnalysisResult {
  success: boolean
  bpm: number | null
  key: number | null
  mode: number | null
  timeSignature: number | null
  danceability: number | null
  energy: number | null
  valence: number | null
  acousticness: number | null
  instrumentalness: number | null
  reason?: string
  error?: string
}

// Get key name from numeric key (Spotify uses 0-11)
export function getKeyName(key: number | null): string {
  if (key === null || key === undefined) return 'Unknown'
  const keyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  return keyNames[key] || 'Unknown'
}

// Get mode name (0 = minor, 1 = major)
export function getModeName(mode: number | null): string {
  if (mode === null || mode === undefined) return 'Unknown'
  return mode === 1 ? 'Major' : 'Minor'
}

// Format BPM display
export function formatBpm(bpm: number | null): string {
  if (bpm === null || bpm === undefined) return '--'
  if (bpm < 60) return '<60'
  if (bpm > 200) return '>200'
  return Math.round(bpm).toString()
}

// Analyze Spotify track audio features
// Note: Requires direct Spotify Web API access with proper auth
export async function analyzeSpotifyTrack(trackId: string): Promise<AudioAnalysisResult> {
  // Validate Spotify track ID format (22 characters, no dashes)
  if (trackId.length !== 22 || trackId.includes('-')) {
    return {
      success: false,
      reason: 'Invalid Spotify track ID format',
      bpm: null,
      key: null,
      mode: null,
      timeSignature: null,
      danceability: null,
      energy: null,
      valence: null,
      acousticness: null,
      instrumentalness: null,
    }
  }

  // For full implementation, you would:
  // 1. Use fetch to call: https://api.spotify.com/v1/audio-features/{track_id}
  // 2. Include Authorization: Bearer {token} header
  // 3. Parse the response JSON

  // This is a placeholder that returns null values
  // The UI will show "--" for BPM/Key when not available
  return {
    success: false,
    reason: 'Audio analysis requires direct Spotify API integration',
    bpm: null,
    key: null,
    mode: null,
    timeSignature: null,
    danceability: null,
    energy: null,
    valence: null,
    acousticness: null,
    instrumentalness: null,
  }
}