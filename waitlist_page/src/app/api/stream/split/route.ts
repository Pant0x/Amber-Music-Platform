import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('id');

  if (!videoId) {
    return NextResponse.json({ error: 'Missing video ID' }, { status: 400 });
  }

  // TODO: Decoupled service call to resolve audio/video split.
  // This worker will extract the best audio stream (e.g. m4a/opus) 
  // from an official topic release and the clean video stream (no logos).
  return NextResponse.json({ 
    audioUrl: `https://mock-stream.example.com/audio/${videoId}`,
    videoUrl: `https://mock-stream.example.com/video/${videoId}`
  });
}
