"use client"

import { useEffect, useMemo, useState } from "react"
import { Item, ItemRarity, generateItem, nextItemRarity } from "@/lib/items"
import { getWalletAddress, loadItems, saveItem } from "@/lib/db"

const ITEMS_KEY = "hero-pull-items"

const rarityBorder: Record<ItemRarity, string> = {
  Common: "border-gray-600",
  Rare: "border-blue-500 shadow-[0_0_12px_#60a5fa]",
  Epic: "border-purple-500 shadow-[0_0_15px_#c084fc]",
  Legendary: "border-yellow-400 shadow-[0_0_20px_#ffd700]",
  Set: "border-[#f97316] shadow-[0_0_22px_#f97316]",
}

export default function WeaponsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [lastForged, setLastForged] = useState<Item | null>(null)
  const [fid, setFid] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      // Prefer Supabase inventory if wallet connected
      try {
        const wallet = await getWalletAddress()
        if (wallet) {
          const list = await loadItems(wallet)
          setItems(list)
          return
        }
      } catch {
        // ignore
      }

      // Fallback 1: server inventory (fid)
      try {
        const mod: any = await import("@farcaster/frame-sdk")
        const ctx: any = await mod?.sdk?.context
        const f = ctx?.user?.fid
        if (f) setFid(f)

        if (f) {
          const res = await fetch(`/api/weapons/list?fid=${f}`, { cache: "no-store" })
          const json = await res.json()
          const rows = Array.isArray(json?.items) ? json.items : []
          setItems(rows.map((it: any) => it.item as Item))
          return
        }
      } catch {
        // ignore
      }

      // Fallback 2: localStorage
      try {
        const raw = localStorage.getItem(ITEMS_KEY)
        setItems(raw ? (JSON.parse(raw) as Item[]) : [])
      } catch {
        setItems([])
      }
    })()
  }, [])

  const saveLocal = (list: Item[]) => {
    setItems(list)
    localStorage.setItem(ITEMS_KEY, JSON.stringify(list))
  }

  const refreshServer = async (f: number) => {
    const res = await fetch(`/api/weapons/list?fid=${f}`, { cache: "no-store" })
    const json = await res.json()
    const rows = Array.isArray(json?.items) ? json.items : []
    setItems(rows.map((it: any) => it.item as Item))
  }

  const handleForge = async () => {
    setLoading(true)
    try {
      // Prefer Supabase (wallet)
      try {
        const wallet = await getWalletAddress()
        if (wallet) {
          const it = generateItem()
          const row: any = await saveItem(it, wallet)
          const list = await loadItems(wallet)
          setItems(list)
          setLastForged({ ...it, id: row?.id ?? it.id })
          return
        }
      } catch {
        // ignore
      }

      // Fallback: server (fid)
      if (fid) {
        const res = await fetch("/api/weapons/forge", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ fid }),
        })
        const json = await res.json()
        const it = json?.item?.item as Item
        if (it) setLastForged(it)
        await refreshServer(fid)
        return
      }

      // Fallback: localStorage
      const it = generateItem()
      const next = [it, ...items]
      saveLocal(next)
      setLastForged(it)
    } finally {
      setLoading(false)
    }
  }

  const counts = useMemo(() => {
    const c: Record<ItemRarity, number> = { Common: 0, Rare: 0, Epic: 0, Legendary: 0, Set: 0 }
    for (const it of items) c[it.rarity]++
    return c
  }, [items])

  const canMergeRarity = (r: Exclude<ItemRarity, "Set">) => {
    if (!items.length) return false
    return r === "Legendary" ? false : counts[r] >= 3
  }

  const mergeRarity = async (r: Exclude<ItemRarity, "Set">) => {
    if (!canMergeRarity(r)) return
    setLoading(true)
    try {
      // Supabase merge (wallet): best-effort local merge, then re-save
      try {
        const wallet = await getWalletAddress()
        if (wallet) {
          const list = await loadItems(wallet)
          const target = nextItemRarity(r)
          const nextList: Item[] = []
          let removed = 0
          for (const it of list) {
            if (it.rarity === r && removed < 3) {
              removed++
              continue
            }
            nextList.push(it)
          }

          let ni = generateItem()
          for (let i = 0; i < 80 && ni.rarity !== target; i++) ni = generateItem()
          if (ni.rarity !== target) ni = { ...ni, rarity: target }

          const row: any = await saveItem(ni, wallet)
          const refreshed = await loadItems(wallet)
          setItems(refreshed)
          setLastForged({ ...ni, id: row?.id ?? ni.id })
          return
        }
      } catch {
        // ignore
      }

      // Fallback: server (fid)
      if (fid) {
        const res = await fetch("/api/weapons/merge", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ fid, rarity: r }),
        })
        const json = await res.json()
        const it = json?.item?.item as Item
        if (it) setLastForged(it)
        await refreshServer(fid)
        return
      }

      // fallback local merge
      const target = nextItemRarity(r)
      const nextList: Item[] = []
      let removed = 0
      for (const it of items) {
        if (it.rarity === r && removed < 3) {
          removed++
          continue
        }
        nextList.push(it)
      }
      let ni = generateItem()
      for (let i = 0; i < 80 && ni.rarity !== target; i++) ni = generateItem()
      if (ni.rarity !== target) ni = { ...ni, rarity: target }
      const next = [ni, ...nextList]
      saveLocal(next)
      setLastForged(ni)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">🎒 Items</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">Forge & merge gear • Set items are 1%</p>

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          onClick={() => handleForge().catch(() => {})}
          disabled={loading}
          className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-extrabold py-3 px-6 rounded-2xl"
        >
          {loading ? "Forging…" : "Forge Item"}
        </button>

        <div className="text-[11px] text-gray-500 text-center max-w-sm">
          Drop rates: Common 55% • Rare 28% • Epic 14% • Legendary 2% • <span className="text-[#f97316] font-bold">Set 1%</span>
        </div>
      </div>

      {lastForged && (
        <div className={`mt-6 border-2 rounded-2xl p-4 bg-gray-900 ${rarityBorder[lastForged.rarity]}`}>
          <div className="text-5xl text-center">{lastForged.imageEmoji}</div>
          <p className="text-center font-extrabold mt-2">{lastForged.name}</p>
          <p className="text-center text-xs text-gray-400 mt-1">
            {lastForged.rarity} • {lastForged.slot.toUpperCase()}
            {lastForged.set ? <span className="text-[#f97316]"> • {lastForged.set} Set</span> : null}
          </p>
          <p className="text-center text-xs mt-2">
            +{lastForged.bonusATK} ATK • +{lastForged.bonusDEF} DEF • +{lastForged.bonusSPD} SPD
          </p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3">
        {(["Common", "Rare", "Epic", "Legendary"] as Exclude<ItemRarity, "Set">[]).map((r) => (
          <div key={r} className="border border-gray-800 rounded-2xl p-3 bg-gray-900">
            <p className="font-bold text-sm">{r}</p>
            <p className="text-xs text-gray-400 mt-1">Count: {counts[r]}</p>
            {r !== "Legendary" && (
              <button
                onClick={() => mergeRarity(r).catch(() => {})}
                disabled={!canMergeRarity(r)}
                className="mt-2 w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white text-xs py-2 rounded-xl"
              >
                Merge 3 → {nextItemRarity(r)}
              </button>
            )}
          </div>
        ))}
        <div className="border border-gray-800 rounded-2xl p-3 bg-gray-900">
          <p className="font-bold text-sm text-[#f97316]">Set</p>
          <p className="text-xs text-gray-400 mt-1">Count: {counts.Set}</p>
          <p className="text-[10px] text-gray-500 mt-2">Set items can’t be merged.</p>
        </div>
      </div>

      <h2 className="text-lg font-bold mt-10">Inventory</h2>
      {items.length === 0 ? (
        <p className="text-center text-gray-500 text-sm mt-3">No items yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {items.map((it) => (
            <div key={it.id} className={`border-2 rounded-xl p-3 bg-gray-900 ${rarityBorder[it.rarity]}`}>
              <div className="text-3xl">{it.imageEmoji}</div>
              <p className="font-bold text-sm mt-1 leading-tight">{it.name}</p>
              <p className="text-xs text-gray-400">
                {it.rarity} • {it.slot.toUpperCase()}
                {it.set ? <span className="text-[#f97316]"> • {it.set}</span> : null}
              </p>
              <p className="text-xs mt-1">+{it.bonusATK} ATK</p>
              <p className="text-xs">+{it.bonusDEF} DEF</p>
              <p className="text-xs">+{it.bonusSPD} SPD</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
