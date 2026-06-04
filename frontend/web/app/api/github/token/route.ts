import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { code } = body as { code?: string }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 })
  }

  const authHeader = request.headers.get('Authorization')
  const cookieHeader = request.headers.get('Cookie')
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080'

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader
    }

    const res = await fetch(`${backendUrl}/api/github/token`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ code }),
    })

    const status = res.status
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to proxy token exchange' }, { status: 502 })
  }
}
