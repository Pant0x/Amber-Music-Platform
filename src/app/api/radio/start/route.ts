import { NextResponse } from 'next/server'
import { rateLimitByIp } from '@/lib/rate-limit'
import { buildRadioCandidates } from '@/lib/radio'

export async function POST(request: Request) {
  const limited = rateLimitByIp(request, 15)
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body: { seed: { id: string }; count?: number } = await request.json()
  const { seed, count = 30 } = body

  if (!seed?.id) {
    return NextResponse.json({ error: 'Missing seed track id' }, { status: 400 })
  }

  const pageCount = Math.min(Math.max(count, 1), 50)
  const tracks = await buildRadioCandidates(seed, pageCount)

  return NextResponse.json({
    tracks,
    seed: seed.id,
    count: tracks.length,
  })
}