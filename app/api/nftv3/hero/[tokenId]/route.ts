import { NextRequest, NextResponse } from "next/server"
import { createPublicClient, http } from "viem"
import { base } from "viem/chains"
import { HERO_PULL_V3_ABI, HERO_PULL_V3_CONTRACT_ADDRESS } from "@/lib/heroPullV3Contract"
import { heroFromSeedAndTier, type Tier } from "@/lib/onchainHeroesV3"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(_req: NextRequest, ctx: { params: { tokenId: string } }) {
  try {
    const tokenId = ctx.params.tokenId
    const id = BigInt(tokenId)

    if (!HERO_PULL_V3_CONTRACT_ADDRESS) {
      return NextResponse.json({ error: "missing v3 contract" }, { status: 500 })
    }

    const rpcUrl = "https://base-rpc.publicnode.com"
    const client = createPublicClient({ chain: base, transport: http(rpcUrl) })

    const [seed, tierRaw] = await Promise.all([
      client.readContract({
        address: HERO_PULL_V3_CONTRACT_ADDRESS,
        abi: HERO_PULL_V3_ABI,
        functionName: "seedOf",
        args: [id],
      }) as Promise<bigint>,
      client.readContract({
        address: HERO_PULL_V3_CONTRACT_ADDRESS,
        abi: HERO_PULL_V3_ABI,
        functionName: "tierOf",
        args: [id],
      }) as Promise<number>,
    ])

    const tier = Number(tierRaw) as Tier
    const hero = heroFromSeedAndTier(seed, id, tier)

    return NextResponse.json({ tokenId: id.toString(), seed: seed.toString(), tier, hero })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
