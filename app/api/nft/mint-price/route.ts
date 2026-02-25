import { NextResponse } from 'next/server'
import { createPublicClient, http, parseAbi } from 'viem'
import { base } from 'viem/chains'

const CONTRACT = '0xA728A918A767bB085D4ac895b8F2d2AbD0dE27bB' as const

const abi = parseAbi(['function mintPrice() view returns (uint256)'])

export async function GET() {
  const rpcUrl = process.env.BASE_RPC_URL || process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
  const client = createPublicClient({ chain: base, transport: http(rpcUrl) })
  const mintPriceWei = await client.readContract({ address: CONTRACT, abi, functionName: 'mintPrice' })
  return NextResponse.json({ contract: CONTRACT, mintPriceWei: mintPriceWei.toString() })
}
