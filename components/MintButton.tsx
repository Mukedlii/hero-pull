"use client"

import { useState } from "react"
import frameSdk from "@farcaster/frame-sdk"
import { generateHero, type Hero } from "@/lib/heroes"
import {
  HERO_PULL_CONTRACT_ADDRESS,
  HERO_PULL_MINT_PRICE_ETH,
} from "@/lib/heroPullContract"

interface Props {
  onPulled: (hero: Hero) => void
}

type RequestArgs = { method: string; params?: any[] }

declare global {
  interface Window {
    ethereum?: {
      request: (args: RequestArgs) => Promise<any>
    }
  }
}

const BASE_CHAIN_ID_HEX = "0x2105" // 8453
const RECEIVER_ADDRESS = "0xa782922Ff9c54F4264FD049189eC66940f528Eb0" as const

// 0.00066 ETH = 660000000000000 wei
const MINT_VALUE_WEI_HEX = "0x2588c3b42c000" as const

function getProvider() {
  // In Warpcast (Frame/Miniapp), this routes through Warpcast's built-in wallet.
  // In a normal browser, it falls back to injected wallets (MetaMask/Coinbase).
  return frameSdk?.wallet?.ethProvider ?? window.ethereum
}

function isWarpcastProvider() {
  return !!frameSdk?.wallet?.ethProvider
}

async function providerRequest(args: RequestArgs) {
  const provider = getProvider()
  if (!provider) throw new Error("No wallet provider available")
  return provider.request(args)
}

async function providerRequestWithTimeout(args: RequestArgs, timeoutMs = 20_000) {
  return await Promise.race([
    providerRequest(args),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Wallet request timed out")), timeoutMs)
    ),
  ])
}

async function waitForReceipt(hash: string, timeoutMs = 120_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const receipt = await providerRequest({
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

    if (!getProvider()) {
      setError("No wallet provider found.")
      return
    }

    try {
      setBusy(true)

      if (!isWarpcastProvider()) {
        // Connect (for injected wallets)
        await providerRequest({ method: "eth_requestAccounts" })

        // Ensure Base mainnet (injected wallets only)
        try {
          await providerRequest({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: BASE_CHAIN_ID_HEX }],
          })
        } catch (e: any) {
          if (e?.code === 4902) {
            await providerRequest({
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
      }

      setStatus("Opening wallet…")

      // Some providers (incl. embedded) behave better if `from` is explicit.
      let from: string | undefined
      try {
        const accounts = (await providerRequestWithTimeout({
          method: "eth_accounts",
        })) as string[]
        from = accounts?.[0]
      } catch {
        // ignore
      }

      const hash = (await providerRequestWithTimeout({
        method: "eth_sendTransaction",
        params: [
          {
            chainId: BASE_CHAIN_ID_HEX,
            from,
            to: RECEIVER_ADDRESS,
            data: "0x",
            value: MINT_VALUE_WEI_HEX,
          },
        ],
      })) as string

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
