import { NextRequest, NextResponse } from 'next/server'
import { heroFromTokenId } from '@/lib/onchainHeroes'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await ctx.params
  let id: bigint
  try {
    id = BigInt(tokenId)
  } catch {
    return NextResponse.json({ error: 'invalid tokenId' }, { status: 400 })
  }

  const hero = heroFromTokenId(id)
  return NextResponse.json({ tokenId: id.toString(), hero })
}
