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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hero-pull.vercel.app'

  return NextResponse.json({
    name: `${hero.name} #${id}`,
    description: 'Hero Pull — onchain heroes rendered deterministically by tokenId (prototype).',
    image: hero.imageUrl?.startsWith('http') ? hero.imageUrl : `${baseUrl}${hero.imageUrl}`,
    attributes: [
      { trait_type: 'Rarity', value: hero.rarity },
      { trait_type: 'Level', value: hero.level },
      { trait_type: 'Attack', value: hero.attack },
      { trait_type: 'Defense', value: hero.defense },
      { trait_type: 'Speed', value: hero.speed },
      { trait_type: 'Power', value: hero.power },
    ],
  })
}
