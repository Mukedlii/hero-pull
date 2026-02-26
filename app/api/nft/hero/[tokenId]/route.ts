import { NextRequest, NextResponse } from "next/server"
import { heroFromTokenId } from "@/lib/onchainHeroes"

export async function GET(_req: NextRequest, ctx: { params: { tokenId: string } }) {
  try {
    const tokenId = ctx?.params?.tokenId
    let id: bigint
    try {
      id = BigInt(tokenId)
    } catch {
      return NextResponse.json({ error: "invalid tokenId" }, { status: 400 })
    }

    const hero = heroFromTokenId(id)
    return NextResponse.json({ tokenId: id.toString(), hero })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
