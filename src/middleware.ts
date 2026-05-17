import { NextRequest, NextResponse } from 'next/server'

const TOKEN_COOKIE = 'leadmappro_token'
const APP_ORIGIN = 'https://app.leadmappro.com.br'

export function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') ?? ''

  const isLocalDev = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  const isAppDomain = hostname.startsWith('app.') || isLocalDev

  // ── Marketing domain (leadmappro.com.br, www.) ─────────────────────────────
  // Serve only "/" — qualquer outra rota vai para o app domain
  if (!isAppDomain) {
    if (pathname !== '/') {
      return NextResponse.redirect(`${APP_ORIGIN}${pathname}${request.nextUrl.search}`)
    }
    return NextResponse.next()
  }

  // ── App domain (app.leadmappro.com.br) ────────────────────────────────────
  // "/" sem token → /login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const isPublic = ['/login', '/bloqueado'].some((p) => pathname === p) || pathname.startsWith('/api/')
  if (isPublic) return NextResponse.next()

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon\\.png|.*\\.png$|.*\\.svg$).*)'],
}
