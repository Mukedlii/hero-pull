import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: NextRequest, ctx: { params: { tokenId: string } }) {
  const { tokenId } = ctx.params
  const baseUrl = new URL(req.url)
  baseUrl.pathname = `/api/nftv4/hero/${tokenId}`
  baseUrl.search = ""

  const r = await fetch(baseUrl.toString(), { cache: "no-store" })
  const j: any = await r.json()
  if (!r.ok) return NextResponse.json(j, { status: r.status })

  const hero = j?.hero
  const image = `https://hero-pull.vercel.app${hero?.imageUrl || "/og.png"}`

  return NextResponse.json({
    name: `${hero?.name || "Hero"} #${tokenId}`,
    description: "Hero Pull — V4 heroes support batch migration + onchain merge.",
    image,
    attributes: [
      { trait_type: "Tier", value: hero?.rarity },
      { trait_type: "Level", value: hero?.level },
      { trait_type: "Attack", value: hero?.attack },
      { trait_type: "Defense", value: hero?.defense },
      { trait_type: "Speed", value: hero?.speed },
    ],
  })
}
