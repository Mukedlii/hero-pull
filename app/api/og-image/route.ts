import { NextResponse } from 'next/server'

/**
 * Static OG image for frame preview.
 * We serve /public/og.png so both the frame and /api/og-image match.
 */
export async function GET(req: Request) {
  return NextResponse.redirect(new URL('/og.png', req.url))
}
