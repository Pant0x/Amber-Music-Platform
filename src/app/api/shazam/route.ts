import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimitByIp } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase-server';
import { fingerprintSimilarity } from '@/lib/audio-analysis';

export const dynamic = 'force-dynamic';

const ALGO_VERSION = 1;
const MATCH_THRESHOLD = 0.12;
const MAX_HASHES = 2000;

// Audio recognition against the local catalog of fingerprinted artist uploads.
// The client extracts spectral-peak hashes (src/lib/audio-analysis.ts
// extractFingerprintHashes) and posts them here; matching happens by
// hash-set intersection — no external Shazam/ACRCloud API required.
export async function POST(request: Request) {
  try {
    const limited = rateLimitByIp(request, 10);
    if (!limited.ok) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body: { hashes?: string[]; trackId?: string; audioData?: string } = await request.json();

    // Registration mode: artist uploading a track stores its fingerprint
    if (body.trackId) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Recognition unavailable' }, { status: 503 });
      }
      const hashes = Array.isArray(body.hashes) ? body.hashes.slice(0, MAX_HASHES) : [];
      if (hashes.length < 32) {
        return NextResponse.json({ error: 'Not enough audio hashes (need >= 32)' }, { status: 400 });
      }

      const { data: track } = await supabaseAdmin
        .from('artist_tracks')
        .select('id, artist_id')
        .eq('id', body.trackId)
        .single();
      if (!track || track.artist_id !== userId) {
        return NextResponse.json({ error: 'Track not found or not owned by you' }, { status: 404 });
      }

      const { error } = await supabaseAdmin
        .from('track_fingerprints')
        .upsert(
          {
            track_id: track.id,
            artist_id: userId,
            algo_version: ALGO_VERSION,
            hashes,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'track_id' }
        );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, registered: true, hashCount: hashes.length });
    }

    // Recognition mode: match query hashes against the catalog
    const hashes = Array.isArray(body.hashes) ? body.hashes.slice(0, MAX_HASHES) : [];
    if (hashes.length < 32) {
      return NextResponse.json(
        {
          success: false,
          message: 'Provide spectral-peak hashes (>= 32) extracted client-side via extractFingerprintHashes',
          track: null,
          artist: null,
          album: null,
          confidence: 0,
          genre: null,
          isrc: null,
        },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Recognition unavailable' }, { status: 503 });
    }

    const query = new Set(hashes)
    const { data: fingerprints, error } = await supabaseAdmin
      .from('track_fingerprints')
      .select('track_id, artist_id, algo_version, hashes')
      .eq('algo_version', ALGO_VERSION);

    if (error || !fingerprints) {
      return NextResponse.json({ error: error?.message || 'No fingerprints found' }, { status: 500 });
    }

    let best: { track_id: string; artist_id: string; score: number } | null = null
    for (const fp of fingerprints) {
      const reference = new Set(fp.hashes as string[])
      const score = fingerprintSimilarity(query, reference)
      if (score >= MATCH_THRESHOLD && (!best || score > best.score)) {
        best = { track_id: fp.track_id, artist_id: fp.artist_id, score }
      }
    }

    if (!best) {
      return NextResponse.json({
        success: false,
        message: 'No matching track in the local catalog',
        track: null,
        artist: null,
        album: null,
        confidence: 0,
        genre: null,
        isrc: null,
      });
    }

    const { data: track } = await supabaseAdmin
      .from('artist_tracks')
      .select('id, title, artist_name, genre, cover_url, duration_seconds, storage_url')
      .eq('id', best.track_id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Matched against local artist catalog',
      track: track?.title ?? null,
      artist: track?.artist_name ?? null,
      album: null,
      confidence: Math.round(best.score * 100) / 100,
      genre: track?.genre ?? null,
      isrc: null,
      coverUrl: track?.cover_url ?? null,
      durationSeconds: track?.duration_seconds ?? null,
      streamUrl: track?.storage_url ?? null,
      matchId: best.track_id,
    });
  } catch (error: unknown) {
    console.error('[Shazam API] Error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    }, { status: 500 });
  }
}

// Get recognition service status
export async function GET() {
  return NextResponse.json({
    service: 'Audio Recognition API',
    version: '1.0',
    endpoints: {
      POST: 'Register fingerprint (trackId + hashes) or match audio hashes against the local catalog',
      GET: 'View API info and available services',
    },
    availableServices: {
      localCatalog: 'Match hashes against fingerprinted artist uploads (track_fingerprints)',
      bpmDetector: 'Analyze track BPM from raw PCM via detectBpm (client-side)',
      keyDetector: 'Detect musical key via Krumhansl-Schmuckler chromagram (client-side)',
    },
    note: 'Fingerprint extraction is client-side; recognition is hash-set intersection — no external API costs.',
  });
}