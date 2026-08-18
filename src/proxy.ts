import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',
  '/api/public(.*)',
  '/api/webhooks(.*)',
  '/api/artist/status(.*)',
  '/api/files/share(.*)',
  '/search(.*)',
  '/explore(.*)',
  '/artist(.*)',
  '/album(.*)',
  '/playlist(.*)',
  '/api/youtube(.*)',
  '/api/spotify(.*)',
  '/api/lyrics(.*)',
  '/api/search(.*)',
  '/api/recommendations(.*)',
  '/api/track(.*)',
  '/admin/login(.*)',
])

const hasClerkKeys =
  typeof process !== 'undefined' &&
  !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY)

const clerkHandler = hasClerkKeys
  ? clerkMiddleware(async (auth, request) => {
      if (!isPublicRoute(request)) {
        await auth.protect()
      }
    })
  : null

export const proxy = async (request: NextRequest, event: NextFetchEvent) => {
  const res = (clerkHandler ? await clerkHandler(request, event) : NextResponse.next())!;

  const rewrite = res.headers.get('x-middleware-rewrite');
  if (rewrite && /^https?:\/\//.test(rewrite)) {
    try {
      const url = new URL(rewrite);
      const host = process.env.HOSTNAME || request.nextUrl.hostname;
      const port = process.env.PORT || request.nextUrl.port;
      const origin = `${request.nextUrl.protocol}//${host}${port ? `:${port}` : ''}`;
      const rebased = new URL(url.pathname + url.search, origin);
      res.headers.set('x-middleware-rewrite', rebased.toString());
    } catch {
      // leave the header untouched if the value is not a valid URL
    }
  }
  return res;
};

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}