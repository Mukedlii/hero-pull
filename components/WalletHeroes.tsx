"use client"

import { useEffect, useState } from "react"
import type { Hero } from "@/lib/heroes"

const rarityBorder: Record<string, string> = {
  Common: "border-gray-600",
  Rare: "border-blue-500 shadow-[0_0_12px_#60a5fa]",
  Epic: "border-purple-500 shadow-[0_0_15px_#c084fc]",
  Legendary: "border-yellow-400 shadow-[0_0_20px_#ffd700]",
}

export function WalletHeroes({ onSelect }: { onSelect?: (hero: Hero & { tokenId?: string }) => void }) {
  const [wallet, setWallet] = useState<string | null>(null)
  const [heroes, setHeroes] = useState<(Hero & { tokenId: string })[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setErr(null)
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

        const v2 = await fetch(`/api/wallet/heroes?owner=${addr}`, { cache: "no-store" }).then((r) => r.json())
        const v3 = await fetch(`/api/wallet/heroes?owner=${addr}&contract=${encodeURIComponent("0x951144FAea2d756556e8cE6131FFd2038A6ae2D9")}`, { cache: "no-store" }).then((r) => r.json())

        const tokenIdsV3: string[] = Array.isArray(v3?.tokenIds) ? v3.tokenIds : []
        const tokenIdsV2: string[] = Array.isArray(v2?.tokenIds) ? v2.tokenIds : []

        const useV3 = tokenIdsV3.length > 0
        const tokenIds = useV3 ? tokenIdsV3 : tokenIdsV2

        if (!tokenIds.length) {
          setHeroes([])
          return
        }

        const rows = await Promise.all(
          tokenIds.map(async (id) => {
            try {
              const url = useV3 ? `/api/nftv3/hero/${id}` : `/api/nftv2/hero/${id}`
              const j = await fetch(url, { cache: "no-store" }).then((r) => r.json())
              return j?.hero ? ({ ...j.hero, tokenId: String(id) } as any) : null
            } catch {
              return null
            }
          })
        )

        setHeroes(rows.filter(Boolean))
      } catch (e: any) {
        setErr(e?.message || String(e))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="text-xs text-gray-400 text-center mt-6">Loading heroes from wallet…</div>
  if (err) return <div className="text-xs text-red-400 text-center mt-6">{err}</div>

  return (
    <div className="mt-4">
      {wallet && <div className="text-center text-xs text-gray-500">Wallet: {wallet.slice(0, 6)}…{wallet.slice(-4)}</div>}

      {heroes.length === 0 ? (
        <div className="text-center text-gray-400 mt-6">No hero NFTs found.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {heroes.map((h) => (
            <button
              key={h.tokenId}
              onClick={() => onSelect?.(h)}
              className={`border bg-gray-900 rounded-2xl p-3 text-left hover:border-purple-500 ${rarityBorder[h.rarity] || "border-gray-700"}`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={h.imageUrl}
                  alt={h.name}
                  className="w-14 h-14 rounded-xl object-cover border border-gray-700"
                  onError={(e) => {
                    const seed = encodeURIComponent(h.name)
                    ;(e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`
                  }}
                />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">#{h.tokenId}</div>
                  <div className="font-bold truncate">{h.name}</div>
                  <div className="text-xs text-gray-400">{h.rarity} • Lvl {h.level}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
