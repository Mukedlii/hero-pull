import { NextRequest, NextResponse } from "next/server"
import { createPublicClient, http, parseAbi } from "viem"
import { base } from "viem/chains"
import { HERO_PULL_V2_CONTRACT_ADDRESS, HERO_PULL_V2_ABI } from "@/lib/heroPullV2Contract"

export const dynamic = "force-dynamic"
export const revalidate = 0

const abi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)",
])

const LOG_CHUNK_SIZE = 8_000n

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get("address")

    if (!address || !address.startsWith("0x") || address.length !== 42) {
      return NextResponse.json({ error: "missing/invalid address" }, { status: 400 })
    }

    if (!HERO_PULL_V2_CONTRACT_ADDRESS) {
      return NextResponse.json({ error: "missing v2 contract" }, { status: 500 })
    }

    const rpcUrl = "https://base-rpc.publicnode.com"
    const client = createPublicClient({ chain: base, transport: http(rpcUrl) })

    const latest = await client.getBlockNumber()
    const lookbackParam = searchParams.get("lookback")
    const lookback = lookbackParam ? BigInt(lookbackParam) : 200_000n
    const fromBlock = latest > lookback ? latest - lookback : 0n

    const fast = searchParams.get("fast") === "1"

    const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
    const toTopic = ("0x" + address.toLowerCase().slice(2).padStart(64, "0")) as `0x${string}`

    const logs: any[] = []
    for (let start = fromBlock; start <= latest; start += LOG_CHUNK_SIZE) {
      const end = start + LOG_CHUNK_SIZE
      const chunk = await client.getLogs({
        address: HERO_PULL_V2_CONTRACT_ADDRESS,
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
      .filter((x): x is bigint => typeof x === "bigint")

    const unique = Array.from(new Set(tokenIds.map((x) => x.toString()))).map((s) => BigInt(s))

    let owned: bigint[] = unique

    if (!fast) {
      owned = []
      for (const id of unique) {
        try {
          const owner = await (client as any).readContract({
            address: HERO_PULL_V2_CONTRACT_ADDRESS,
            abi,
            functionName: "ownerOf",
            args: [id],
          })
          if (String(owner).toLowerCase() === address.toLowerCase()) owned.push(id)
        } catch {
          // ignore
        }
      }
    }

    return NextResponse.json({
      contract: HERO_PULL_V2_CONTRACT_ADDRESS,
      address,
      fromBlock: fromBlock.toString(),
      latest: latest.toString(),
      tokenIds: owned.map((x) => x.toString()),
      fast,
    })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
