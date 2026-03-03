import { NextRequest, NextResponse } from 'next/server'
import { heroFromTokenId } from '@/lib/onchainHeroes'

export async function GET(_req: NextRequest, ctx: { params: { tokenId: string } }) {
  const { tokenId } = ctx.params

  let id: bigint
  try {
    id = BigInt(tokenId)
  } catch {
    return NextResponse.json({ error: 'invalid tokenId' }, { status: 400 })
  }

  const hero = heroFromTokenId(id)
  const host = _req.headers.get("host") || "localhost:5000"
  const proto = _req.headers.get("x-forwarded-proto") || "https"
  const siteUrl = `${proto}://${host}`

  return NextResponse.json({
    name: `${hero.name} #${id}`,
    description: 'Hero Pull — Dark fantasy RPG heroes on Base. Collectible and tradeable NFTs.',
    image: hero.imageUrl?.startsWith('http') ? hero.imageUrl : `${siteUrl}${hero.imageUrl}`,
    external_url: `${siteUrl}/collection`,
    attributes: [
      { trait_type: 'Rarity', value: hero.rarity },
      { trait_type: 'Level', display_type: 'number', value: hero.level },
      { trait_type: 'Health', display_type: 'number', value: hero.health },
      { trait_type: 'Power', display_type: 'number', value: hero.power },
      { trait_type: 'Defense', display_type: 'number', value: hero.defense },
      { trait_type: 'Luck', display_type: 'number', value: hero.luck },
      { trait_type: 'Ability', value: hero.ability },
    ],
  })
}
