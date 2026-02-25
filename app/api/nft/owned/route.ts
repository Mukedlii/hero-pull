import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbi } from 'viem'
import { base } from 'viem/chains'

const CONTRACT = '0xA728A918A767bB085D4ac895b8F2d2AbD0dE27bB' as const

// NOTE: for performance you should set this to the contract deploy block.
const DEFAULT_LOOKBACK_BLOCKS = 200_000n

const abi = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
])

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')

  if (!address || !address.startsWith('0x') || address.length !== 42) {
    return NextResponse.json({ error: 'missing/invalid address' }, { status: 400 })
  }

  const rpcUrl = process.env.BASE_RPC_URL || process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'

  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  })

  const latest = await client.getBlockNumber()
  const fromBlock = latest > DEFAULT_LOOKBACK_BLOCKS ? latest - DEFAULT_LOOKBACK_BLOCKS : 0n

  // Fetch transfers TO address (mints + transfers)
  const logs = await client.getLogs({
    address: CONTRACT,
    event: abi[0],
    args: { to: address as `0x${string}` },
    fromBlock,
    toBlock: latest,
  } as any)

  // When typings aren't inferred, `getLogs()` returns raw logs without `args`.
  // Transfer has indexed tokenId as topic[3].
  const tokenIds = (logs as any[])
    .map((l) => {
      const t = l?.topics?.[3]
      if (!t) return null
      try {
        return BigInt(t)
      } catch {
        return null
      }
    })
    .filter((x): x is bigint => typeof x === 'bigint')

  // De-dupe
  const unique = Array.from(new Set(tokenIds.map((x) => x.toString()))).map((s) => BigInt(s))

  return NextResponse.json({
    contract: CONTRACT,
    address,
    fromBlock: fromBlock.toString(),
    latest: latest.toString(),
    tokenIds: unique.map((x) => x.toString()),
  })
}
