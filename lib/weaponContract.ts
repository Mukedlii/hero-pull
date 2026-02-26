export const WEAPON_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_WEAPON_CONTRACT_ADDRESS as `0x${string}` | undefined) ??
  ("0x0ca6D7c00d3f37CE9474B4a0b6814E6E124DC594" as const)

export const WEAPON_MINT_PRICE_WEI_HEX = "0x" + BigInt("50000000000000").toString(16) // 0.00005 ETH
export const BASE_CHAIN_ID_HEX = "0x2105" // 8453

// Weapon1155.mint(uint256 tokenId, uint256 amount)
export const WEAPON_MINT_SELECTOR = "0x156e29f6" as const

export function encodeMintWeaponCalldata(tokenId: bigint, amount: bigint) {
  // abi.encodeWithSelector(0x156e29f6, tokenId, amount)
  const pad = (x: string) => x.replace(/^0x/, "").padStart(64, "0")
  const tid = pad("0x" + tokenId.toString(16))
  const amt = pad("0x" + amount.toString(16))
  return (WEAPON_MINT_SELECTOR + tid + amt) as `0x${string}`
}
