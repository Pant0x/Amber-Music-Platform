import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export const ADMIN_COOKIE = 'admin_token'
const SESSION_TTL_MS = 24 * 60 * 60 * 1000

function hmacKey(): Buffer {
  const pass = process.env.ADMIN_PASSWORD || ''
  return crypto.createHash('sha256').update(`amber-admin:${pass}`).digest()
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', hmacKey()).update(payload).digest('base64url')
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

/** Create an HMAC-signed stateless admin session cookie value. */
export function createAdminSession(username: string): { value: string; maxAge: number } {
  const payload = Buffer.from(JSON.stringify({ username, exp: Date.now() + SESSION_TTL_MS })).toString('base64url')
  return { value: `${payload}.${sign(payload)}`, maxAge: Math.floor(SESSION_TTL_MS / 1000) }
}

/** Verify an admin cookie: signature must match and expiry must be in the future. */
export function verifyAdminSession(value: string | undefined): boolean {
  if (!value) return false
  const [payload, sig] = value.split('.')
  if (!payload || !sig) return false
  if (!timingSafeEqualStr(sig, sign(payload))) return false
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return false
    return true
  } catch {
    return false
  }
}

/** Supabase + DB is_admin path (manual promotion only). */
async function isAdminViaUser(): Promise<boolean> {
  try {
    const { userId } = await auth()
    if (!userId || !supabaseAdmin) return false
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single()
    return data?.is_admin === true
  } catch {
    return false
  }
}

/**
 * Admin gate shared by all /api/admin routes.
 * Grants access when either:
 *   1. a valid HMAC-signed admin session cookie is present (env-credential login), or
 *   2. the Supabase session maps to a profile explicitly flagged is_admin in the DB.
 */
export async function requireAdmin(): Promise<boolean> {
  try {
    const store = await cookies()
    if (verifyAdminSession(store.get(ADMIN_COOKIE)?.value)) return true
  } catch {
    // cookies() may throw outside request scope; fall through to user check
  }
  return isAdminViaUser()
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}