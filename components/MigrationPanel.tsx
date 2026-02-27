"use client"

import { useEffect, useMemo, useState } from "react"
import { encodeFunctionData } from "viem"
import { HERO_PULL_V1_CONTRACT_ADDRESS } from "@/lib/heroPullContract"
import { HERO_PULL_V2_ABI, HERO_PULL_V2_CONTRACT_ADDRESS } from "@/lib/heroPullV2Contract"

export default function MigrationPanel() {
  const [address, setAddress] = useState<string | null>(null)
  const [v1, setV1] = useState<string[]>([])
  const [v2, setV2] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const refresh = async (a: string) => {
    const [o1, o2] = await Promise.all([
      fetch(`/api/nft/owned?address=${a}&fast=1`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/wallet/heroes?owner=${a}`, { cache: "no-store" }).then((r) => r.json()),
    ])

    // V1: chain logs scan (fast=1)
    setV1(Array.isArray(o1?.tokenIds) ? o1.tokenIds : [])

    // V2: Alchemy wallet lookup
    setV2(Array.isArray(o2?.tokenIds) ? o2.tokenIds : [])
  }

  useEffect(() => {
    ;(async () => {
      setErr(null)
      try {
        const mod: any = await import("@farcaster/frame-sdk")
        const provider = mod?.default?.wallet?.ethProvider ?? mod?.sdk?.wallet?.ethProvider ?? (window as any).ethereum
        if (!provider) throw new Error("No wallet provider")

        try {
          await provider.request({ method: "eth_requestAccounts" })
        } catch {}

        const acc = await provider.request({ method: "eth_accounts" })
        const a = acc?.[0]
        if (!a) throw new Error("Wallet not connected")
        setAddress(a)

        await refresh(a)
      } catch (e: any) {
        setErr(e?.message || String(e))
      }
    })()
  }, [])

  const toClaim = useMemo(() => {
    const s2 = new Set(v2)
    return v1.filter((id) => !s2.has(id))
  }, [v1, v2])

  const claimOne = async (tokenId: string) => {
    if (!HERO_PULL_V2_CONTRACT_ADDRESS) {
      alert("Missing V2 contract")
      return
    }
    setBusy(true)
    setErr(null)
    try {
      const mod: any = await import("@farcaster/frame-sdk")
      const provider = mod?.default?.wallet?.ethProvider ?? mod?.sdk?.wallet?.ethProvider ?? (window as any).ethereum
      if (!provider) throw new Error("No wallet provider")

      const accounts = await provider.request({ method: "eth_accounts" })
      const from = accounts?.[0]
      if (!from) throw new Error("Wallet not connected")

      const data = encodeFunctionData({
        abi: HERO_PULL_V2_ABI,
        functionName: "claimFromV1",
        args: [BigInt(tokenId)],
      })

      await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            chainId: "0x2105",
            from,
            to: HERO_PULL_V2_CONTRACT_ADDRESS,
            data,
          },
        ],
      })

      await refresh(from)
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 border border-gray-800 bg-gray-900 rounded-2xl p-4">
      <div className="text-lg font-extrabold">Migration</div>
      <div className="text-xs text-gray-400 mt-1">Move your V1 HERO NFTs into V2 (Dungeon uses V2).</div>

      <div className="mt-3 text-xs text-gray-500">
        Wallet: {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "(connect wallet)"}
      </div>

      {err && <div className="mt-3 text-xs text-red-400">{err}</div>}

      <div className="mt-4 text-sm font-bold">To claim ({toClaim.length})</div>
      {toClaim.length === 0 ? (
        <div className="text-sm text-gray-400 mt-2">Nothing to claim.</div>
      ) : (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {toClaim.slice(0, 30).map((id) => (
            <button
              key={id}
              disabled={busy}
              onClick={() => claimOne(id)}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs py-2 rounded-xl"
            >
              Claim #{id}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 text-[10px] text-gray-600 break-words">
        V1: {HERO_PULL_V1_CONTRACT_ADDRESS}
        <br />
        V2: {HERO_PULL_V2_CONTRACT_ADDRESS ?? "(missing)"}
      </div>
    </div>
  )
}
