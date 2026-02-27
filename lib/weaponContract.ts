export const WEAPON_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_WEAPON_CONTRACT_ADDRESS as `0x${string}` | undefined) ??
  ("0xA01e9b544Aef1F6803F0322cC34dfCdee89B91B4" as const)

export const WEAPON_MINT_PRICE_WEI_HEX = ("0x" + BigInt("50000000000000").toString(16)) as `0x${string}` // 0.00005 ETH
export const BASE_CHAIN_ID_HEX = "0x2105" // 8453

export const WEAPON_ABI = [
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "merge",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "balanceOfBatch",
    stateMutability: "view",
    inputs: [
      { name: "accounts", type: "address[]" },
      { name: "ids", type: "uint256[]" },
    ],
    outputs: [{ name: "balances", type: "uint256[]" }],
  },
] as const
