"use client"

import { useEffect, useMemo, useState } from "react"
import { encodeFunctionData } from "viem"
import type { Hero } from "@/lib/heroes"
import { HERO_PULL_V4_ABI, HERO_PULL_V4_CONTRACT_ADDRESS } from "@/lib/heroPullV4Contract"

type Rarity = Hero["rarity"]

const rarityBorder: Record<Rarity, string> = {
  Common: "border-gray-500",
  Rare: "border-blue-500 shadow-[0_0_12px_#60a5fa]",
  Epic: "border-purple-500 shadow-[0_0_15px_#c084fc]",
  Legendary: "border-yellow-400 shadow-[0_0_20px_#ffd700]",
}

export default function MergePage() {
  const [wallet, setWallet] = useState<string | null>(null)
  const [heroes, setHeroes] = useState<(Hero & { tokenId: string })[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string>("")

  const selectedHeroes = useMemo(() => {
    const set = new Set(selected)
    return heroes.filter((h) => set.has(h.tokenId))
  }, [heroes, selected])

  const selectedRarity = selectedHeroes[0]?.rarity
  const canMerge = selectedHeroes.length === 3 && selectedHeroes.every((h) => h.rarity === selectedRarity) && selectedRarity !== "Legendary"

  useEffect(() => {
    ;(async () => {
      setErr("")
      try {
        const mod: any = await import("@farcaster/frame-sdk")
        const provider = mod?.default?.wallet?.ethProvider ?? mod?.sdk?.wallet?.ethProvider ?? (window as any).ethereum
        if (!provider) throw new Error("No wallet provider")

        try {
          await provider.request({ method: "eth_requestAccounts" })
        } catch {}

        const accounts = await provider.request({ method: "eth_accounts" })
        const addr = accounts?.[0]
        if (!addr) throw new Error("Wallet not connected")
        setWallet(addr)

        if (!HERO_PULL_V4_CONTRACT_ADDRESS) throw new Error("Missing V4 contract")

        const owned = await fetch(`/api/wallet/heroes?owner=${addr}&contract=${HERO_PULL_V4_CONTRACT_ADDRESS}`, {
          cache: "no-store",
        }).then((r) => r.json())

        const tokenIds: string[] = Array.isArray(owned?.tokenIds) ? owned.tokenIds : []
        if (!tokenIds.length) {
          setHeroes([])
          return
        }

        const rows = await Promise.all(
          tokenIds.map(async (id) => {
            try {
              const j = await fetch(`/api/nftv4/hero/${id}`, { cache: "no-store" }).then((r) => r.json())
              return j?.hero ? ({ ...j.hero, tokenId: String(id) } as any) : null
            } catch {
              return null
            }
          })
        )

        setHeroes(rows.filter(Boolean))
      } catch (e: any) {
        setErr(e?.message || String(e))
      }
    })()
  }, [])

  const toggle = (id: string) => {
    setErr("")
    setSelected((prev) => {
      const next = [...prev]
      const i = next.indexOf(id)
      if (i >= 0) {
        next.splice(i, 1)
        return next
      }
      if (next.length >= 3) return next
      return [...next, id]
    })
  }

  const doMerge = async () => {
    setErr("")
    if (!canMerge) {
      setErr("Select exactly 3 heroes of the same rarity (Common/Rare/Epic).")
      return
    }
    if (!HERO_PULL_V4_CONTRACT_ADDRESS) {
      setErr("Missing V4 contract")
      return
    }

    setBusy(true)
    try {
      const mod: any = await import("@farcaster/frame-sdk")
      const provider = mod?.default?.wallet?.ethProvider ?? mod?.sdk?.wallet?.ethProvider ?? (window as any).ethereum
      if (!provider) throw new Error("No wallet provider")

      const accounts = await provider.request({ method: "eth_accounts" })
      const from = accounts?.[0]
      if (!from) throw new Error("Wallet not connected")

      const data = encodeFunctionData({
        abi: HERO_PULL_V4_ABI,
        functionName: "merge",
        args: [[BigInt(selected[0]), BigInt(selected[1]), BigInt(selected[2])]],
      })

      await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            chainId: "0x2105",
            from,
            to: HERO_PULL_V4_CONTRACT_ADDRESS,
            data,
          },
        ],
      })

      // refresh list
      const owned = await fetch(`/api/wallet/heroes?owner=${from}&contract=${HERO_PULL_V4_CONTRACT_ADDRESS}`, {
        cache: "no-store",
      }).then((r) => r.json())
      const tokenIds: string[] = Array.isArray(owned?.tokenIds) ? owned.tokenIds : []
      const rows = await Promise.all(
        tokenIds.map(async (id) => {
          try {
            const j = await fetch(`/api/nftv4/hero/${id}`, { cache: "no-store" }).then((r) => r.json())
            return j?.hero ? ({ ...j.hero, tokenId: String(id) } as any) : null
          } catch {
            return null
          }
        })
      )
      setHeroes(rows.filter(Boolean))
      setSelected([])
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">Merge</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">Onchain merge (V3): burn 3 → mint 1 next tier</p>

      {wallet && <div className="mt-2 text-center text-xs text-gray-500">Wallet: {wallet.slice(0, 6)}…{wallet.slice(-4)}</div>}
      {err && <div className="mt-3 text-center text-xs text-red-400">{err}</div>}

      {heroes.length === 0 ? (
        <div className="mt-8 text-center text-gray-400">
          No V4 heroes found. Go to <b>Stats → Migration</b> and batch-claim into V4 first.
        </div>
      ) : (
        <>
          <div className="mt-4 text-center text-xs text-gray-400">
            Selected: {selectedHeroes.length}/3
            {selectedRarity ? ` • ${selectedRarity}` : ""}
          </div>

          <div className="flex justify-center mt-4">
            <button
              onClick={() => doMerge().catch(() => {})}
              disabled={!canMerge || busy}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-5 rounded-xl disabled:opacity-50"
            >
              {busy ? "Merging…" : "Merge"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            {heroes
              .filter((h) => h.rarity !== "Legendary")
              .map((h) => {
                const active = selected.includes(h.tokenId)
                const disabled =
                  selected.length > 0 &&
                  !active &&
                  selectedHeroes[0] &&
                  selectedHeroes[0].rarity !== h.rarity
                return (
                  <button
                    key={h.tokenId}
                    onClick={() => toggle(h.tokenId)}
                    disabled={disabled || busy}
                    className={`border-2 rounded-xl p-3 flex flex-col items-center gap-2 bg-gray-900 text-left ${rarityBorder[h.rarity]} ${
                      active ? "ring-2 ring-white/60" : ""
                    } disabled:opacity-40`}
                  >
                    <img src={h.imageUrl} className="w-16 h-16 rounded-xl object-cover" alt={h.name} />
                    <div className="text-xs text-gray-500">#{h.tokenId}</div>
                    <div className="font-bold text-sm text-center leading-tight">{h.name}</div>
                    <div className="text-xs text-gray-400">{h.rarity} • Lv.{h.level}</div>
                  </button>
                )
              })}
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">Legendary heroes can’t be merged.</div>
        </>
      )}
    </div>
  )
}
