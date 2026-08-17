import { NextResponse } from 'next/server'

// Local files upload has been deprecated
// This platform is now a pure cloud music streaming service
// Users can only stream from YouTube Music and Spotify

export async function GET() {
  return NextResponse.json({ 
    error: 'Local files feature has been deprecated', 
    message: 'This is now a pure cloud music streaming platform. Only YouTube Music and Spotify content is available.',
    disabled: true
  }, { status: 403 })
}

export async function POST() {
  return NextResponse.json({ 
    error: 'Local files upload is disabled', 
    message: 'This is a cloud music streaming platform. Please use official artist uploads or streaming services.'
  }, { status: 403 })
}

export async function PUT() {
  return NextResponse.json({ 
    error: 'Local files management is disabled'
  }, { status: 403 })
}

export async function DELETE() {
  return NextResponse.json({ 
    error: 'Local files deletion is disabled'
  }, { status: 403 })
}