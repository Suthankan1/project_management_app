import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const cookieHeader = request.headers.get('Cookie')
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080'

  try {
    const headers: Record<string, string> = {}
    if (authHeader) {
      headers['Authorization'] = authHeader
    }
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader
    }

    const res = await fetch(`${backendUrl}/api/github/revoke`, {
      method: 'POST',
      headers,
    })

    const status = res.status
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to proxy GitHub revoke'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
