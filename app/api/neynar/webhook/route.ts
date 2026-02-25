import { NextRequest, NextResponse } from 'next/server'

// Neynar webhook stub.
// TODO: verify signature once NEYNAR_WEBHOOK_SECRET + header format confirmed.
// For now we accept the request and log minimal info.

export async function POST(req: NextRequest) {
  const body = await req.text()

  // NOTE: do not log full body in prod (may include user data)
  console.log('neynar webhook received', {
    len: body.length,
    contentType: req.headers.get('content-type'),
  })

  return NextResponse.json({ ok: true })
}
