"use client"

import { useEffect, useMemo, useState } from "react"
import { encodeFunctionData } from "viem"
import { HERO_PULL_V1_CONTRACT_ADDRESS } from "@/lib/heroPullContract"
import { HERO_PULL_V2_CONTRACT_ADDRESS } from "@/lib/heroPullV2Contract"
import { HERO_PULL_V3_CONTRACT_ADDRESS } from "@/lib/heroPullV3Contract"
import { HERO_PULL_V4_ABI, HERO_PULL_V4_CONTRACT_ADDRESS } from "@/lib/heroPullV4Contract"

export default function MigrationPanel() {
  const [address, setAddress] = useState<string | null>(null)
  const [v1, setV1] = useState<string[]>([])
  const [v2, setV2] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const refresh = async (a: string) => {
    const v2Contract = HERO_PULL_V2_CONTRACT_ADDRESS
    const v3Contract = HERO_PULL_V3_CONTRACT_ADDRESS
    const v4Contract = HERO_PULL_V4_CONTRACT_ADDRESS

    const [o1, o2, o3, o4] = await Promise.all([
      fetch(`/api/nft/owned?address=${a}&fast=1`, { cache: "no-store" }).then((r) => r.json()),
      v2Contract
        ? fetch(`/api/wallet/heroes?owner=${a}&contract=${v2Contract}`, { cache: "no-store" }).then((r) => r.json())
        : Promise.resolve({ tokenIds: [] }),
      v3Contract
        ? fetch(`/api/wallet/heroes?owner=${a}&contract=${v3Contract}`, { cache: "no-store" }).then((r) => r.json())
        : Promise.resolve({ tokenIds: [] }),
      v4Contract
        ? fetch(`/api/wallet/heroes?owner=${a}&contract=${v4Contract}`, { cache: "no-store" }).then((r) => r.json())
        : Promise.resolve({ tokenIds: [] }),
    ])

    // v1 tokens (log scan)
    setV1(Array.isArray(o1?.tokenIds) ? o1.tokenIds : [])

    // v4 tokens (after migration)
    setV2(Array.isArray(o4?.tokenIds) ? o4.tokenIds : [])

    // stash v2/v3 lists on the function object for UI helpers (quick + no extra state)
    ;(refresh as any)._v2 = Array.isArray(o2?.tokenIds) ? o2.tokenIds : []
    ;(refresh as any)._v3 = Array.isArray(o3?.tokenIds) ? o3.tokenIds : []
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

  const v2Tokens: string[] = ((refresh as any)._v2 as string[]) || []
  const v3Tokens: string[] = ((refresh as any)._v3 as string[]) || []

  const toClaimV1 = useMemo(() => {
    const s4 = new Set(v2) // v4 tokens
    return v1.filter((id) => !s4.has(id))
  }, [v1, v2])

  const toClaimV2 = useMemo(() => {
    const s4 = new Set(v2)
    return v2Tokens.filter((id) => !s4.has(id))
  }, [v2Tokens, v2])

  const toClaimV3 = useMemo(() => {
    const s4 = new Set(v2)
    return v3Tokens.filter((id) => !s4.has(id))
  }, [v3Tokens, v2])

  const claimBatch = async (tokenIds: string[], from: "v1" | "v2" | "v3") => {
    if (!HERO_PULL_V4_CONTRACT_ADDRESS) {
      alert("Missing V4 contract")
      return
    }
    setBusy(true)
    setErr(null)
    try {
      const mod: any = await import("@farcaster/frame-sdk")
      const provider = mod?.default?.wallet?.ethProvider ?? mod?.sdk?.wallet?.ethProvider ?? (window as any).ethereum
      if (!provider) throw new Error("No wallet provider")

      const accounts = await provider.request({ method: "eth_accounts" })
      const fromAddr = accounts?.[0]
      if (!fromAddr) throw new Error("Wallet not connected")

      const data = encodeFunctionData({
        abi: HERO_PULL_V4_ABI,
        functionName: from === "v1" ? "claimFromV1Batch" : from === "v2" ? "claimFromV2Batch" : "claimFromV3Batch",
        args: [tokenIds.map((t) => BigInt(t))],
      })

      await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            chainId: "0x2105",
            from: fromAddr,
            to: HERO_PULL_V4_CONTRACT_ADDRESS,
            data,
          },
        ],
      })

      await refresh(fromAddr)
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 border border-gray-800 bg-gray-900 rounded-2xl p-4">
      <div className="text-lg font-extrabold">Migration</div>
      <div className="text-xs text-gray-400 mt-1">Migrate your HERO NFTs into V4 (batch supported, needed for merge).</div>

      <div className="mt-3 text-xs text-gray-500">
        Wallet: {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "(connect wallet)"}
      </div>

      {err && <div className="mt-3 text-xs text-red-400">{err}</div>}

      <div className="mt-4 text-sm font-bold">V1 → V4 to claim ({toClaimV1.length})</div>
      <button
        disabled={busy || toClaimV1.length === 0}
        onClick={() => claimBatch(toClaimV1.slice(0, 50), "v1")}
        className="mt-2 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs py-2 rounded-xl"
      >
        Claim V1 → V4 (batch, max 50)
      </button>

      <div className="mt-4 text-sm font-bold">V2 → V4 to claim ({toClaimV2.length})</div>
      <button
        disabled={busy || toClaimV2.length === 0}
        onClick={() => claimBatch(toClaimV2.slice(0, 50), "v2")}
        className="mt-2 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs py-2 rounded-xl"
      >
        Claim V2 → V4 (batch, max 50)
      </button>

      <div className="mt-4 text-sm font-bold">V3 → V4 to claim ({toClaimV3.length})</div>
      <button
        disabled={busy || toClaimV3.length === 0}
        onClick={() => claimBatch(toClaimV3.slice(0, 50), "v3")}
        className="mt-2 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs py-2 rounded-xl"
      >
        Claim V3 → V4 (batch, max 50)
      </button>

      <div className="mt-5 text-[10px] text-gray-600 break-words">
        V1: {HERO_PULL_V1_CONTRACT_ADDRESS}
        <br />
        V2: {HERO_PULL_V2_CONTRACT_ADDRESS ?? "(missing)"}
        <br />
        V3: {HERO_PULL_V3_CONTRACT_ADDRESS ?? "(missing)"}
        <br />
        V4: {HERO_PULL_V4_CONTRACT_ADDRESS ?? "(missing)"}
      </div>
    </div>
  )
}
