import { NextRequest, NextResponse } from 'next/server'

const CHAIN_ID = 'eip155:8453' // Base mainnet
const CONTRACT = '0xA728A918A767bB085D4ac895b8F2d2AbD0dE27bB'
const VALUE_WEI_HEX = '0xB5E620F48000' // 0.00020 ETH = 200000000000000 wei
const MINT_SELECTOR = '0x1249c58b' // mint()

/**
 * Frame route for Farcaster.
 * - GET: frame metadata for Warpcast to render the initial card.
 * - POST: Frame v2 transaction response (Warpcast built-in wallet signs).
 */
export async function GET(_req: NextRequest) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  const imageUrl = `${baseUrl}/og.png`

  return NextResponse.json({
    frame: {
      version: 'vNext',
      name: 'Hero Pull',
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

export async function POST(req: NextRequest) {
  // Warpcast sends a JSON body for frame actions; we don't need it yet,
  // but parsing keeps this endpoint compatible with typical frame POSTs.
  try {
    await req.json()
  } catch {
    // ignore
  }

  // Farcaster Frame v2 native tx response (Warpcast built-in wallet)
  return NextResponse.json({
    type: 'tx',
    chainId: CHAIN_ID,
    method: 'eth_sendTransaction',
    params: {
      abi: [],
      to: CONTRACT,
      data: MINT_SELECTOR,
      value: VALUE_WEI_HEX,
    },
  })
}
