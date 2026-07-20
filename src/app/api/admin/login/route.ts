import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function POST(request: Request) {
  const { username, password } = await request.json()

  const adminUser = process.env.ADMIN_USERNAME
  const adminPass = process.env.ADMIN_PASSWORD

  if (!adminUser || !adminPass) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 500 })
  }

  if (username !== adminUser || password !== adminPass) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const cookieStore = await cookies()
  const token = crypto.randomBytes(32).toString('hex')
  const expiry = Date.now() + 24 * 60 * 60 * 1000
  const sessionData = JSON.stringify({ username, expiry })

  cookieStore.set('admin_token', `${token}.${Buffer.from(sessionData).toString('base64')}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return NextResponse.json({ success: true })
}
