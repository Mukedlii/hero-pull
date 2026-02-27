import { NextRequest, NextResponse } from "next/server"
import { HERO_PULL_V2_CONTRACT_ADDRESS } from "@/lib/heroPullV2Contract"
import { HERO_PULL_V3_CONTRACT_ADDRESS } from "@/lib/heroPullV3Contract"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const owner = searchParams.get("owner") || searchParams.get("address")

    if (!owner || !owner.startsWith("0x") || owner.length !== 42) {
      return NextResponse.json({ error: "missing/invalid owner" }, { status: 400 })
    }

    const key =
      process.env.ALCHEMY_KEY ||
      process.env.NEXT_PUBLIC_ALCHEMY_KEY ||
      process.env.NEXT_PUBLIC_ALCHEMY_API_KEY

    if (!key) {
      return NextResponse.json({ error: "missing ALCHEMY_KEY" }, { status: 500 })
    }

    const contractParam = searchParams.get("contract")
    const contract =
      (contractParam && contractParam.startsWith("0x") && contractParam.length === 42
        ? (contractParam as `0x${string}`)
        : null) ?? (HERO_PULL_V2_CONTRACT_ADDRESS ?? HERO_PULL_V3_CONTRACT_ADDRESS)
    const url = `https://base-mainnet.g.alchemy.com/nft/v3/${key}/getNFTsForOwner?owner=${owner}&contractAddresses[]=${contract}&withMetadata=false&pageSize=100`

    const r = await fetch(url, { cache: "no-store" })
    const j: any = await r.json()
    if (!r.ok) return NextResponse.json({ error: j?.message || "alchemy error" }, { status: 500 })

    const nfts = Array.isArray(j?.ownedNfts) ? j.ownedNfts : []

    const tokenIds = nfts
      .map((n: any) => n?.tokenId)
      .filter(Boolean)
      .map((t: string) => {
        try {
          // Alchemy returns hex tokenId
          if (t.startsWith("0x")) return BigInt(t).toString()
        } catch {}
        return String(t)
      })

    return NextResponse.json({ owner, contract, tokenIds })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
