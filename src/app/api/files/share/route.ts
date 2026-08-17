import { NextResponse } from 'next/server'

// Share endpoint deprecated - local files feature removed
export async function GET() {
  return NextResponse.json({ 
    error: 'Share feature has been deprecated',
    message: 'Local file sharing is no longer available in this cloud music platform.'
  }, { status: 403 })
}