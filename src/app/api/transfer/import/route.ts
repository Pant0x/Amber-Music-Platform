import { NextResponse } from 'next/server'
import { importPlaylist, detectService } from '@/lib/transfers'

export async function POST(request: Request) {
  const body: { url?: string } = await request.json()

  if (!body.url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  const service = detectService(body.url)
  if (!service) {
    return NextResponse.json({ error: 'Unsupported service URL' }, { status: 400 })
  }

  const result = await importPlaylist(body.url)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}
