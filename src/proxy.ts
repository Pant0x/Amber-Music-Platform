import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const isPublicRoute = (pathname: string) => {
  const publicPrefixes = [
    '/',
    '/sign-in',
    '/sign-up',
    '/onboarding',
    '/auth/confirm',
    '/api/public',
    '/api/webhooks',
    '/api/artist/status',
    '/api/files/share',
    '/search',
    '/explore',
    '/artist',
    '/album',
    '/playlist',
    '/api/youtube',
    '/api/spotify',
    '/api/lyrics',
    '/api/search',
    '/api/recommendations',
    '/api/track',
    '/admin',
  ]
  return publicPrefixes.some((p) => p === '/' ? pathname === '/' : pathname.startsWith(p))
}

export const proxy = async (request: NextRequest) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasSupabaseKeys = !!(url && anonKey)

  let supabaseResponse = NextResponse.next({ request })
  if (hasSupabaseKeys) {
    const supabase = createServerClient(url!, anonKey!, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value }) => supabaseResponse.cookies.set(name, value))
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    if (!isPublicRoute(request.nextUrl.pathname) && !user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/sign-in'
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Rebase any rewrite header to this server's origin (dev/HMR safety)
  const rewrite = supabaseResponse.headers.get('x-middleware-rewrite')
  if (rewrite && /^https?:\/\//.test(rewrite)) {
    try {
      const rewriteUrl = new URL(rewrite)
      const host = process.env.HOSTNAME || request.nextUrl.hostname
      const port = process.env.PORT || request.nextUrl.port
      const origin = `${request.nextUrl.protocol}//${host}${port ? `:${port}` : ''}`
      const rebased = new URL(rewriteUrl.pathname + rewriteUrl.search, origin)
      supabaseResponse.headers.set('x-middleware-rewrite', rebased.toString())
    } catch {
      // leave the header untouched if the value is not a valid URL
    }
  }
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}