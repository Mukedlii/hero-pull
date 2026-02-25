import { NextResponse } from 'next/server'

/**
 * OG image for Farcaster frame preview.
 * We serve the static /public/og.png (includes hero cards).
 */
export async function GET(req: Request) {
  return NextResponse.redirect(new URL('/og.png', req.url))
}
