import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbi } from 'viem'
import { base } from 'viem/chains'

const CONTRACT = '0xA728A918A767bB085D4ac895b8F2d2AbD0dE27bB' as const

// Base RPC often limits eth_getLogs ranges (e.g. 10,000 blocks). We'll scan in chunks.
const LOG_CHUNK_SIZE = 9_000n

// HeroPull contract deploy/early mint block (Base). Must be <= first mint.
// (Observed mints around ~42622992.)
const HERO_CONTRACT_DEPLOY_BLOCK = 42_620_000n

const abi = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'function ownerOf(uint256 tokenId) view returns (address)',
])

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')

    if (!address || !address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json({ error: 'missing/invalid address' }, { status: 400 })
    }

    const rpcUrl = 'https://rpc.ankr.com/base'

    const client = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    })

    const latest = await client.getBlockNumber()
    const fromBlock = HERO_CONTRACT_DEPLOY_BLOCK

    // Fetch Transfer logs TO address using topics (more robust than typed args on Vercel).
    const transferTopic =
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    const toTopic = ('0x' + address.toLowerCase().slice(2).padStart(64, '0')) as `0x${string}`

    const logs: any[] = []
    for (let start = fromBlock; start <= latest; start += LOG_CHUNK_SIZE) {
      const end = start + LOG_CHUNK_SIZE
      const chunk = await client.getLogs({
        address: CONTRACT,
        fromBlock: start,
        toBlock: end > latest ? latest : end,
        topics: [transferTopic, null, toTopic],
      } as any)
      logs.push(...(chunk as any[]))
    }

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

    // Keep only tokens still owned by address (handles transfers out)
    const owned: bigint[] = []
    for (const id of unique) {
      try {
        const owner = await (client as any).readContract({
          address: CONTRACT,
          abi,
          functionName: 'ownerOf',
          args: [id],
        })
        if (String(owner).toLowerCase() === address.toLowerCase()) owned.push(id)
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      contract: CONTRACT,
      address,
      fromBlock: fromBlock.toString(),
      latest: latest.toString(),
      tokenIds: owned.map((x) => x.toString()),
    })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
