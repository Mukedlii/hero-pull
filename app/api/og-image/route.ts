import { NextResponse } from 'next/server'

/**
 * Generates a simple Open Graph image for the Farcaster frame preview.
 * The image is an SVG with the title of the app. In a more advanced
 * implementation you could render a React component to an image or use
 * edge functions to draw dynamic content.
 */
export async function GET() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="black"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="64" font-family="Verdana">Hero Pull</text>
  <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="#8b5cf6" font-size="32" font-family="Verdana">Pull your own superhero NFT</text>
</svg>`
  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}