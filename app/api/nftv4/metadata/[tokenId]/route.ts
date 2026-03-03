import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get("host") || "localhost:5000"
  const proto = req.headers.get("x-forwarded-proto") || "https"
  return `${proto}://${host}`
}

export async function GET(req: NextRequest, ctx: { params: { tokenId: string } }) {
  const { tokenId } = ctx.params
  const baseUrl = new URL(req.url)
  baseUrl.pathname = `/api/nftv4/hero/${tokenId}`
  baseUrl.search = ""

  const r = await fetch(baseUrl.toString(), { cache: "no-store" })
  const j: any = await r.json()
  if (!r.ok) return NextResponse.json(j, { status: r.status })

  const hero = j?.hero
  const siteUrl = getBaseUrl(req)
  const image = `${siteUrl}${hero?.imageUrl || "/og.png"}`

  return NextResponse.json({
    name: `${hero?.name || "Hero"} #${tokenId}`,
    description: "Hero Pull — Dark fantasy RPG heroes on Base. Collectible, tradeable, and mergeable NFTs.",
    image,
    external_url: `${siteUrl}/collection`,
    attributes: [
      { trait_type: "Tier", value: hero?.rarity },
      { trait_type: "Level", display_type: "number", value: hero?.level },
      { trait_type: "Health", display_type: "number", value: hero?.health },
      { trait_type: "Power", display_type: "number", value: hero?.power },
      { trait_type: "Defense", display_type: "number", value: hero?.defense },
      { trait_type: "Luck", display_type: "number", value: hero?.luck },
      { trait_type: "Character", value: hero?.layers?.char || "Unknown" },
      { trait_type: "Overlay", value: hero?.layers?.overlay || "None" },
    ],
  })
}
