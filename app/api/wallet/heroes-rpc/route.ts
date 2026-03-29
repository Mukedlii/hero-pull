import { NextRequest, NextResponse } from "next/server"
import { createPublicClient, http } from "viem"
import { base } from "viem/chains"
import { HERO_PULL_V2_CONTRACT_ADDRESS } from "@/lib/heroPullV2Contract"
import { HERO_PULL_V3_CONTRACT_ADDRESS } from "@/lib/heroPullV3Contract"
import { HERO_PULL_V4_CONTRACT_ADDRESS } from "@/lib/heroPullV4Contract"

export const dynamic = "force-dynamic"
export const revalidate = 0

const ERC721_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }, { name: "index", type: "uint256" }],
    name: "tokenOfOwnerByIndex",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const owner = searchParams.get("owner") || searchParams.get("address")

    if (!owner || !owner.startsWith("0x") || owner.length !== 42) {
      return NextResponse.json({ error: "missing/invalid owner" }, { status: 400 })
    }

    const contractParam = searchParams.get("contract")
    const contract =
      (contractParam && contractParam.startsWith("0x") && contractParam.length === 42
        ? (contractParam as `0x${string}`)
        : null) ?? HERO_PULL_V4_CONTRACT_ADDRESS ?? HERO_PULL_V3_CONTRACT_ADDRESS ?? HERO_PULL_V2_CONTRACT_ADDRESS

    if (!contract) {
      return NextResponse.json({ error: "no contract address" }, { status: 500 })
    }

    const rpcUrl = "https://base-rpc.publicnode.com"
    const client = createPublicClient({ chain: base, transport: http(rpcUrl) })

    const balance = await (client as any).readContract({
      address: contract,
      abi: ERC721_ABI,
      functionName: "balanceOf",
      args: [owner as `0x${string}`],
    }) as bigint

    const count = Number(balance)
    if (count === 0) {
      return NextResponse.json({ owner, contract, tokenIds: [] })
    }

    const tokenIds: string[] = []
    for (let i = 0; i < count; i++) {
      try {
        const tokenId = await (client as any).readContract({
          address: contract,
          abi: ERC721_ABI,
          functionName: "tokenOfOwnerByIndex",
          args: [owner as `0x${string}`, BigInt(i)],
        }) as bigint
        tokenIds.push(tokenId.toString())
      } catch {
        // skip if not enumerable
      }
    }

    return NextResponse.json({ owner, contract, tokenIds })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
