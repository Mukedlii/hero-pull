export const HERO_PULL_CONTRACT_ADDRESS =
  "0xA728A918A767bB085D4ac895b8F2d2AbD0dE27bB" as const

// Minimal ABI: mint() payable
export const HERO_PULL_ABI = [
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
] as const

export const HERO_PULL_MINT_PRICE_ETH = "0.00020" as const
