import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// Set/update the user's plan tier (free/plus). Free-only billing model:
// 'plus' is reserved for future paid tiers — nothing is charged here.
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { plan_tier?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const planTier = body.plan_tier === 'plus' ? 'plus' : 'free';

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ plan_tier: planTier, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      console.error('[Subscription API] Update error:', error);
      return NextResponse.json({ error: 'Plan update failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, plan_tier: planTier });
  } catch (err) {
    console.error('[Subscription API] POST error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
