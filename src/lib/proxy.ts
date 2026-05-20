import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL ?? 'http://localhost:3333'
const TOKEN_COOKIE = 'leadmappro_token'

export async function proxyToFastify(request: NextRequest, path: string): Promise<NextResponse> {
  const token = request.cookies.get(TOKEN_COOKIE)?.value
  const hasBody = request.method !== 'GET' && request.method !== 'DELETE'
  let body: string | undefined

  if (hasBody) {
    try {
      const raw = await request.text()
      body = raw.length > 0 ? raw : undefined
    } catch {
      body = undefined
    }
  }

  const headers: Record<string, string> = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  if (path === '/auth/logout') {
    const response = NextResponse.json({ success: true })
    response.cookies.delete(TOKEN_COOKIE)
    return response
  }

  const url = new URL(request.url)
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}${url.search}`, {
      method: request.method,
      headers,
      body,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'API indisponível'
    return NextResponse.json({ message: msg }, { status: 503 })
  }

  if (res.status === 204) return new NextResponse(null, { status: 204 })

  const data = await res.json().catch(() => ({}))

  if (res.ok && (path === '/auth/login' || path === '/auth/register')) {
    const response = NextResponse.json(data, { status: res.status })
    if (data.token) {
      response.cookies.set(TOKEN_COOKIE, data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
    }
    return response
  }

  return NextResponse.json(data, { status: res.status })
}
