import { NextResponse } from 'next/server'

export async function POST() {
  // Radio pagination — fetches next batch of tracks
  // For MVP, delegates back to start with the last track as new seed
  return NextResponse.json({ tracks: [], count: 0 })
}
