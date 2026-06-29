import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const name = searchParams.get('name');
  const target = id || name;
  if (!target) {
    return NextResponse.json({ error: 'Missing identifier' }, { status: 400 });
  }
  // Redirect to new dynamic route
  const url = new URL(request.url);
  return NextResponse.redirect(`${url.origin}/api/youtube/channel/${encodeURIComponent(target)}`);
}
