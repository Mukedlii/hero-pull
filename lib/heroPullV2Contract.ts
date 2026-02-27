export const HERO_PULL_V2_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_HERO_PULL_V2_CONTRACT_ADDRESS as `0x${string}` | undefined) ??
  ("0x6103b37B65B42787a5bEC556b6Ff6A5606667fab" as const)

export const HERO_PULL_V2_ABI = [
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "claimFromV1",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "seedOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "seed", type: "uint256" }],
  },
] as const

export const HERO_PULL_V2_MINT_PRICE_WEI_HEX = "0x" + BigInt("200000000000000").toString(16) // 0.0002 ETH
