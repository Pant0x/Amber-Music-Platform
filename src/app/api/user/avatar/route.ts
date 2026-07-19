import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-server';

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

    // Update Clerk user profile image
    try {
      const client = await clerkClient();
      // Clerk requires a Blob/File, fetch the image from the URL
      const imageResponse = await fetch(avatarUrl);
      if (imageResponse.ok) {
        const blob = await imageResponse.blob();
        const file = new File([blob], 'avatar.jpg', { type: blob.type || 'image/jpeg' });
        await client.users.updateUserProfileImage(userId, { file });
      }
    } catch (err) {
      console.warn('[Avatar] Clerk update failed (non-fatal):', err);
    }

    // Update Supabase profiles table if available
    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('profiles')
          .upsert(
            {
              id: userId,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
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
