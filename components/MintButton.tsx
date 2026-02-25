"use client"

import { useState } from "react"
import { createPublicClient, http, parseEther } from "viem"
import { base } from "viem/chains"
import { generateHero, type Hero } from "@/lib/heroes"
import {
  HERO_PULL_CONTRACT_ADDRESS,
  HERO_PULL_MINT_PRICE_ETH,
} from "@/lib/heroPullContract"

interface Props {
  onPulled: (hero: Hero) => void
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
    }
  }
}

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
})

export default function MintButton({ onPulled }: Props) {
  const [busy, setBusy] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [status, setStatus] = useState<string>("")
  const [error, setError] = useState<string>("")

  const handleMint = async () => {
    setError("")
    setStatus("")

    const hero = generateHero()
    onPulled(hero)

    if (!window.ethereum) {
      setError("No wallet found (install MetaMask/Coinbase Wallet).")
      return
    }

    try {
      setBusy(true)

      // Connect
      await window.ethereum.request({ method: "eth_requestAccounts" })

      // Ensure Base mainnet
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x2105" }],
        })
      } catch (e: any) {
        // If chain not added, try add
        if (e?.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x2105",
                chainName: "Base",
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://mainnet.base.org"],
                blockExplorerUrls: ["https://basescan.org"],
              },
            ],
          })
        } else {
          throw e
        }
      }

      // Call contract mint() payable
      // Function selector for mint(): 0x1249c58b
      const data = "0x1249c58b"
      const valueHex = `0x${parseEther(HERO_PULL_MINT_PRICE_ETH).toString(16)}`

      setStatus("Opening wallet…")
      const hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            to: HERO_PULL_CONTRACT_ADDRESS,
            data,
            value: valueHex,
          },
        ],
      })

      setTxHash(hash)
      setStatus("Confirming…")

      await publicClient.waitForTransactionReceipt({ hash })
      setStatus("Hero minted!")
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        disabled={busy}
        onClick={handleMint}
        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold py-4 px-10 rounded-2xl shadow-lg text-lg transition-all disabled:opacity-60"
      >
        {busy ? "Minting..." : `Mint Hero (${HERO_PULL_MINT_PRICE_ETH} ETH)`}
      </button>

      {txHash && (
        <div className="text-xs text-gray-300 text-center break-all font-mono">
          Tx: {txHash}
        </div>
      )}

      {status && <div className="text-sm font-semibold text-green-400">{status}</div>}

      {error && (
        <div className="text-xs text-red-400 text-center break-words max-w-sm">
          {error}
        </div>
      )}
    </div>
  )
}
