import { NextRequest, NextResponse } from 'next/server'

/**
 * Frame route for Farcaster. When Warpcast fetches this endpoint it
 * returns metadata instructing the client how to render the initial
 * frame card in the social feed. This includes a preview image and
 * a button that launches the full mini app.
 */
export async function GET(_req: NextRequest) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
  const imageUrl = `${baseUrl}/api/og-image`
  return NextResponse.json({
    frame: {
      version: 'vNext',
      name: 'Hero Pull',
      // Default preview image for the feed card. You can customise this
      // further by creating an API route that generates an image on the fly.
      imageUrl,
      button: {
        title: 'Pull a Hero',
        action: {
          type: 'launch_frame',
          name: 'Hero Pull',
          url: `${baseUrl}/`,
          splashImageUrl: imageUrl,
          splashBackgroundColor: '#000000',
        },
      },
    },
  })
}