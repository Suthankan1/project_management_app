import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { token } = body as { token?: string }

  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'GitHub OAuth not configured' }, { status: 503 })
  }

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 400 })
  }

  // DELETE /grant removes the entire app authorization from the user's GitHub account,
  // not just the single token. This forces the full OAuth consent screen on next login.
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  try {
    await fetch(`https://api.github.com/applications/${clientId}/grant`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: token }),
    })
  } catch {
    // Network failure — still let the client clear its local state
  }

  return NextResponse.json({ ok: true })
}
