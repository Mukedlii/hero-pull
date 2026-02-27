export const HERO_PULL_V3_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_HERO_PULL_V3_CONTRACT_ADDRESS as `0x${string}` | undefined) ??
  ("0x951144FAea2d756556e8cE6131FFd2038A6ae2D9" as const)

export const HERO_PULL_V3_ABI = [
  {
    type: "function",
    name: "claimFromV1",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "claimFromV2",
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
  {
    type: "function",
    name: "tierOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "tier", type: "uint8" }],
  },
  {
    type: "function",
    name: "merge",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenIds", type: "uint256[3]" }],
    outputs: [],
  },
] as const
