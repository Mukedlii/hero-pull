"use client"

import { useState } from "react"
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

const BASE_CHAIN_ID_HEX = "0x2105" // 8453
const MINT_SELECTOR = "0x1249c58b" // mint()

// 0.00066 ETH = 660000000000000 wei
const MINT_VALUE_WEI_HEX = "0x2588c3b42c000" as const

async function waitForReceipt(hash: string, timeoutMs = 120_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const receipt = await window.ethereum?.request({
      method: "eth_getTransactionReceipt",
      params: [hash],
    })
    if (receipt) return receipt
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new Error("Timed out waiting for transaction confirmation")
}

export default function MintButton({ onPulled }: Props) {
  const [busy, setBusy] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
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
          params: [{ chainId: BASE_CHAIN_ID_HEX }],
        })
      } catch (e: any) {
        if (e?.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: BASE_CHAIN_ID_HEX,
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

      setStatus("Opening wallet…")
      const hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            to: HERO_PULL_CONTRACT_ADDRESS,
            data: MINT_SELECTOR,
            value: MINT_VALUE_WEI_HEX,
          },
        ],
      })

      setTxHash(hash)
      setStatus("Confirming…")

      const receipt = await waitForReceipt(hash)
      if (receipt?.status && receipt.status !== "0x1") {
        throw new Error("Transaction failed")
      }

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
