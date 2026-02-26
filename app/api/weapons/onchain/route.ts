import { NextRequest, NextResponse } from "next/server"
import { createPublicClient, http } from "viem"
import { base } from "viem/chains"
import { KNOWN_TOKEN_IDS, tokenIdToWeapon } from "@/lib/weaponsOnchain"
import { WEAPON_ABI, WEAPON_CONTRACT_ADDRESS } from "@/lib/weaponContract"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get("address")

  if (!address || !address.startsWith("0x")) {
    return NextResponse.json({ error: "missing address" }, { status: 400 })
  }

  if (!WEAPON_CONTRACT_ADDRESS) {
    return NextResponse.json({ error: "missing weapon contract" }, { status: 500 })
  }

  const rpcUrl =
    process.env.BASE_RPC_URL ||
    process.env.NEXT_PUBLIC_BASE_RPC_URL ||
    "https://base-rpc.publicnode.com"

  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  })

  const ids = KNOWN_TOKEN_IDS.map((x) => BigInt(x))
  const accounts = ids.map(() => address as `0x${string}`)

  const balances = (await client.readContract({
    address: WEAPON_CONTRACT_ADDRESS,
    abi: WEAPON_ABI,
    functionName: "balanceOfBatch",
    args: [accounts, ids],
  })) as bigint[]

  const items = balances
    .map((bal, idx) => ({ tokenId: Number(ids[idx]), balance: Number(bal) }))
    .filter((x) => x.balance > 0)
    .map((x) => ({ ...x, weapon: tokenIdToWeapon(x.tokenId) }))

  return NextResponse.json({ address, items })
}
