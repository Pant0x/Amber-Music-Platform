import { NextResponse } from 'next/server'
import { rateLimitByIp } from '@/lib/rate-limit'
import { buildRadioCandidates } from '@/lib/radio'

export async function POST(request: Request) {
  const limited = rateLimitByIp(request, 20)
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body: { seed: { id: string }; count?: number; offset?: number } = await request.json()
  const { seed, count = 10, offset = 0 } = body

  if (!seed?.id) {
    return NextResponse.json({ error: 'Missing seed track id' }, { status: 400 })
  }

  const pageCount = Math.min(Math.max(count, 1), 30)
  const tracks = await buildRadioCandidates(seed, pageCount, offset)

  return NextResponse.json({
    tracks,
    seed: seed.id,
    count: tracks.length,
    offset: offset + tracks.length,
  })
}