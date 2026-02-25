"use client"

import { useMemo, useState } from "react"
import { parseEther } from "viem"
import { base } from "wagmi/chains"
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi"
import { generateHero, type Hero } from "@/lib/heroes"
import {
  HERO_PULL_ABI,
  HERO_PULL_CONTRACT_ADDRESS,
  HERO_PULL_MINT_PRICE_ETH,
} from "@/lib/heroPullContract"

interface Props {
  onPulled: (hero: Hero) => void
}

export default function MintButton({ onPulled }: Props) {
  const [hero, setHero] = useState<Hero | null>(null)

  const { isConnected, address, chainId } = useAccount()
  const { connect, connectors, isPending: connectPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: switchPending } = useSwitchChain()

  const {
    writeContract,
    data: txHash,
    isPending: txPending,
    error: txError,
  } = useWriteContract()

  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
      chainId: base.id,
    })

  const injectedConnector = useMemo(
    () => connectors.find((c) => c.type === "injected") ?? connectors[0],
    [connectors]
  )

  const handleMint = () => {
    const newHero = generateHero()
    setHero(newHero)
    onPulled(newHero)

    if (!isConnected) {
      if (injectedConnector) connect({ connector: injectedConnector })
      return
    }

    if (chainId !== base.id) {
      switchChain({ chainId: base.id })
      return
    }

    writeContract({
      chainId: base.id,
      address: HERO_PULL_CONTRACT_ADDRESS,
      abi: HERO_PULL_ABI,
      functionName: "mint",
      value: parseEther(HERO_PULL_MINT_PRICE_ETH),
    })
  }

  const busy = connectPending || switchPending || txPending || confirming

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        disabled={busy}
        onClick={handleMint}
        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold py-4 px-10 rounded-2xl shadow-lg text-lg transition-all disabled:opacity-60"
      >
        {busy
          ? "Opening wallet..."
          : `Mint Hero (${HERO_PULL_MINT_PRICE_ETH} ETH)`}
      </button>

      {isConnected && (
        <div className="text-xs text-gray-400 text-center">
          <div>
            Connected: <span className="font-mono">{address}</span>
          </div>
          <button
            onClick={() => disconnect()}
            className="underline text-gray-300 hover:text-white"
          >
            Disconnect
          </button>
        </div>
      )}

      {txHash && (
        <div className="text-xs text-gray-300 text-center">
          Tx: <span className="font-mono">{txHash}</span>
        </div>
      )}

      {confirmed && hero && (
        <div className="text-sm font-semibold text-green-400">Hero minted!</div>
      )}

      {txError && (
        <div className="text-xs text-red-400 text-center">
          {txError.message}
        </div>
      )}
    </div>
  )
}
