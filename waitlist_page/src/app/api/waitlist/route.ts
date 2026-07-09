import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

let supabaseClient: any = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  supabaseClient = createClient(url, key);
  return supabaseClient;
}

export async function POST(req: Request) {
  try {
    const { email, feature } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabase();

    if (!supabase) {
       console.warn("Supabase credentials missing, mocking response.");
       return NextResponse.json({ success: true, isNew: true, message: "Welcome to the club! You're on the list." });
    }

    // 1. Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (checkError) {
       throw checkError;
    }

    if (existingUser) {
      return NextResponse.json({ success: true, isNew: false, message: 'You already registered!' });
    }

    // 2. Insert new waitlist entry
    // First try with the feature column
    let insertResult = await supabase
      .from('waitlist')
      .insert([{ email: cleanEmail, feature: feature || null }]);

    // Fallback: If feature column is missing (PGRST204 or containing column cache message), insert only email
    if (insertResult.error && (insertResult.error.code === 'PGRST204' || insertResult.error.message.includes('column'))) {
      console.warn("Feature column does not exist in 'waitlist' table. Retrying with email only.");
      insertResult = await supabase
        .from('waitlist')
        .insert([{ email: cleanEmail }]);
    }

    if (insertResult.error) {
      throw insertResult.error;
    }

    return NextResponse.json({ success: true, isNew: true, message: "Welcome to the club! You're on the list." });
  } catch (error: any) {
    console.error('Waitlist Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 500 });
  }
}
