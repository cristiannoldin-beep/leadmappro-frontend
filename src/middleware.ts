import { NextRequest, NextResponse } from 'next/server'

const TOKEN_COOKIE = 'leadmappro_token'

const PUBLIC_PATHS = ['/', '/login', '/bloqueado']

export function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') ?? ''

  // app.leadmappro.com.br/ → /login
  if (pathname === '/' && hostname.startsWith('app.')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith('/api/'))
  if (isPublic) return NextResponse.next()

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
}
