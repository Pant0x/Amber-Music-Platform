import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { rateLimitByIp } from '@/lib/rate-limit'
import { ADMIN_COOKIE, createAdminSession } from '@/lib/admin'

function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

export async function POST(request: Request) {
  const limited = rateLimitByIp(request, 5)
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many attempts, try again later' }, { status: 429 })
  }

  let username: string, password: string
  try {
    const body = await request.json()
    username = String(body.username ?? '')
    password = String(body.password ?? '')
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const adminUser = process.env.ADMIN_USERNAME
  const adminPass = process.env.ADMIN_PASSWORD

  if (!adminUser || !adminPass) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 500 })
  }

  if (!timingSafeEqualStr(username, adminUser) || !timingSafeEqualStr(password, adminPass)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const cookieStore = await cookies()
  const session = createAdminSession(adminUser)

  cookieStore.set(ADMIN_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: session.maxAge,
  })

  return NextResponse.json({ success: true })
}