import { NextRequest, NextResponse } from "next/server"
import { createPublicClient, http } from "viem"
import { base } from "viem/chains"
import { HERO_PULL_V2_ABI, HERO_PULL_V2_CONTRACT_ADDRESS } from "@/lib/heroPullV2Contract"
import { heroFromSeed } from "@/lib/onchainHeroesV2"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(_req: NextRequest, ctx: { params: { tokenId: string } }) {
  try {
    const tokenId = ctx.params.tokenId
    const id = BigInt(tokenId)

    if (!HERO_PULL_V2_CONTRACT_ADDRESS) {
      return NextResponse.json({ error: "missing v2 contract" }, { status: 500 })
    }

    const rpcUrl = "https://base-rpc.publicnode.com"
    const client = createPublicClient({ chain: base, transport: http(rpcUrl) })

    const seed = (await client.readContract({
      address: HERO_PULL_V2_CONTRACT_ADDRESS,
      abi: HERO_PULL_V2_ABI,
      functionName: "seedOf",
      args: [id],
    })) as bigint

    const hero = heroFromSeed(seed, id)
    return NextResponse.json({ tokenId: id.toString(), seed: seed.toString(), hero })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
