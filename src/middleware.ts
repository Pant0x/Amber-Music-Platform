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
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)',
  ],
}
