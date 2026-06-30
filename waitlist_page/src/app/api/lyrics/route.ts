import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trackName = searchParams.get('track');
  const artistName = searchParams.get('artist');

  if (!trackName || !artistName) {
    return NextResponse.json({ error: 'Missing track or artist parameter' }, { status: 400 });
  }

  // TODO: Decoupled service call to fetch lyrics via Genius API
  // This will eventually be handled by a Python/Node worker deployed on Render.
  return NextResponse.json({ 
    lyrics: "Placeholder lyrics until Genius API worker is connected.",
    source: "genius"
  });
}
