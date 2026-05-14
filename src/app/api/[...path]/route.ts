import { NextRequest } from 'next/server'
import { proxyToFastify } from '@/lib/proxy'

type Params = { params: Promise<{ path: string[] }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { path } = await params
  return proxyToFastify(req, '/' + path.join('/'))
}

export async function POST(req: NextRequest, { params }: Params) {
  const { path } = await params
  return proxyToFastify(req, '/' + path.join('/'))
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { path } = await params
  return proxyToFastify(req, '/' + path.join('/'))
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { path } = await params
  return proxyToFastify(req, '/' + path.join('/'))
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { path } = await params
  return proxyToFastify(req, '/' + path.join('/'))
}
