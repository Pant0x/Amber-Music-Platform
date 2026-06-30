import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // TODO: Initialize Supabase client and insert into waitlist table
    // const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    // await supabase.from('waitlist').insert([{ email }]);

    return NextResponse.json({ success: true, message: 'Added to waitlist' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
