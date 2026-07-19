import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/public(.*)',
  '/api/webhooks(.*)',
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

const hasClerkKeys = typeof process !== 'undefined' && !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY)

export const proxy = hasClerkKeys
  ? clerkMiddleware(async (auth, request) => {
      if (!isPublicRoute(request)) {
        await auth.protect()
      }
    })
  : () => {}

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)',
  ],
}
