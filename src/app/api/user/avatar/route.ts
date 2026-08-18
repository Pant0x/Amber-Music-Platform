import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { fetchImageSafely } from '@/lib/safe-fetch';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { avatarUrl } = await request.json();
    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid avatar URL' }, { status: 400 });
    }

    // SSRF-safe fetch: https-only, public-IP DNS validation, image content-type, 10MB cap
    const result = await fetchImageSafely(avatarUrl, { maxBytes: 10 * 1024 * 1024 });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Update Supabase profiles table if available
    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('profiles')
          .upsert(
            {
              user_id: userId,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (error) {
          console.warn('[Avatar] Supabase profile update failed:', error);
        }
      } catch (err) {
        console.warn('[Avatar] Supabase update error:', err);
      }
    }

    return NextResponse.json({ ok: true, avatarUrl });
  } catch (err) {
    console.error('[Avatar] POST error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
