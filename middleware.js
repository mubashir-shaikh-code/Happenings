// middleware.js
import { clerkMiddleware, getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = auth
  const { pathname } = req.nextUrl

  // If visiting /admin and already logged in → redirect
  if (pathname === '/admin' && userId) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }

  // Protect admin routes (except /admin login page)
  if (pathname.startsWith('/admin') && pathname !== '/admin') {
    if (!userId) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    if (sessionClaims?.publicMetadata?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/admin/:path*'
  ],
}
