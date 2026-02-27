"use client"

import { useEffect, useMemo, useState } from "react"
import type { Hero } from "@/lib/heroes"
import type { Item, ItemRarity, ItemSlot } from "@/lib/items"
import { getEquippedBonuses, getSetBonus } from "@/lib/items"
import { loadInventory } from "@/lib/inventory"
import { getWalletAddress } from "@/lib/db"
import { HERO_PULL_V2_CONTRACT_ADDRESS } from "@/lib/heroPullV2Contract"
import { HERO_PULL_V3_CONTRACT_ADDRESS } from "@/lib/heroPullV3Contract"
import { HERO_PULL_V4_CONTRACT_ADDRESS } from "@/lib/heroPullV4Contract"

type Tab = "stats" | "weapons"

type HeroWithToken = Hero & { tokenId?: string }

const EQUIP_MAP_KEY = "hero-pull-equipped-items" // { [tokenId]: EquippedItems }

const COLLECTION_KEY = "hero-pull-collection"
const CURRENT_HERO_KEY = "hero-pull-current-hero"

const rarityBorder: Record<string, string> = {
  Common: "border-gray-600",
  Rare: "border-blue-500 shadow-[0_0_12px_#60a5fa]",
  Epic: "border-purple-500 shadow-[0_0_15px_#c084fc]",
  Legendary: "border-yellow-400 shadow-[0_0_20px_#ffd700]",
}

const itemBorder: Record<ItemRarity, string> = {
  Common: "border-gray-600",
  Rare: "border-blue-500 shadow-[0_0_12px_#60a5fa]",
  Epic: "border-purple-500 shadow-[0_0_15px_#c084fc]",
  Legendary: "border-yellow-400 shadow-[0_0_20px_#ffd700]",
  Set: "border-[#f97316] shadow-[0_0_22px_#f97316]",
}

function slotLabel(s: ItemSlot) {
  if (s === "weapon") return "Weapon"
  if (s === "shield") return "Shield"
  if (s === "boots") return "Boots"
  return "Helmet"
}

function statLine(label: string, base: number, bonus: number, setBonus: number) {
  return (
    <div className="text-sm text-gray-200">
      {label} {base}{" "}
      {(bonus > 0 || setBonus > 0) && (
        <>
          <span className="text-green-400">[+{bonus}]</span>
          {setBonus > 0 && <span className="text-[#f97316]">[+{setBonus}]</span>}
        </>
      )}
    </div>
  )
}

async function loadLocalHeroes(): Promise<Hero[]> {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(COLLECTION_KEY)
    return raw ? (JSON.parse(raw) as Hero[]) : []
  } catch {
    return []
  }
}

function saveLocalHeroes(list: Hero[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

function sameHero(a: HeroWithToken | null, b: HeroWithToken | null): boolean {
  if (!a || !b) return false
  if (a.tokenId && b.tokenId) return String(a.tokenId) === String(b.tokenId)
  if (a.dbId && b.dbId) return a.dbId === b.dbId
  return a.name === b.name && a.imageUrl === b.imageUrl && a.rarity === b.rarity
}

function loadEquipMap(): Record<string, any> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(EQUIP_MAP_KEY)
    return raw ? (JSON.parse(raw) as Record<string, any>) : {}
  } catch {
    return {}
  }
}

function saveEquipMap(map: Record<string, any>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(EQUIP_MAP_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

async function loadOnchainHeroes(addr: string): Promise<HeroWithToken[]> {
  const v4 = HERO_PULL_V4_CONTRACT_ADDRESS
    ? await fetch(`/api/wallet/heroes?owner=${addr}&contract=${HERO_PULL_V4_CONTRACT_ADDRESS}`, { cache: "no-store" }).then((r) => r.json())
    : { tokenIds: [] }
  const v3 = HERO_PULL_V3_CONTRACT_ADDRESS
    ? await fetch(`/api/wallet/heroes?owner=${addr}&contract=${HERO_PULL_V3_CONTRACT_ADDRESS}`, { cache: "no-store" }).then((r) => r.json())
    : { tokenIds: [] }
  const v2 = HERO_PULL_V2_CONTRACT_ADDRESS
    ? await fetch(`/api/wallet/heroes?owner=${addr}&contract=${HERO_PULL_V2_CONTRACT_ADDRESS}`, { cache: "no-store" }).then((r) => r.json())
    : await fetch(`/api/wallet/heroes?owner=${addr}`, { cache: "no-store" }).then((r) => r.json())

  const tokenIdsV4: string[] = Array.isArray(v4?.tokenIds) ? v4.tokenIds : []
  const tokenIdsV3: string[] = Array.isArray(v3?.tokenIds) ? v3.tokenIds : []
  const tokenIdsV2: string[] = Array.isArray(v2?.tokenIds) ? v2.tokenIds : []

  const version: "v4" | "v3" | "v2" = tokenIdsV4.length ? "v4" : tokenIdsV3.length ? "v3" : "v2"
  const tokenIds = version === "v4" ? tokenIdsV4 : version === "v3" ? tokenIdsV3 : tokenIdsV2

  const rows = await Promise.all(
    tokenIds.map(async (id) => {
      try {
        const url = version === "v4" ? `/api/nftv4/hero/${id}` : version === "v3" ? `/api/nftv3/hero/${id}` : `/api/nftv2/hero/${id}`
        const j = await fetch(url, { cache: "no-store" }).then((r) => r.json())
        return j?.hero ? ({ ...j.hero, tokenId: String(id) } as any) : null
      } catch {
        return null
      }
    })
  )

  return rows.filter(Boolean)
}

export function HeroesMasterDetail() {
  const [heroes, setHeroes] = useState<HeroWithToken[]>([])
  const [wallet, setWallet] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [selected, setSelected] = useState<HeroWithToken | null>(null)
  const [tab, setTab] = useState<Tab>("stats")

  const [inventory, setInventory] = useState<Item[]>([])
  const [invSource, setInvSource] = useState<"supabase" | "local">("local")

  const [equipPending, setEquipPending] = useState<{ item: Item; slot: ItemSlot } | null>(null)
  const [busyEquip, setBusyEquip] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const w = await getWalletAddress()
        setWallet(w)

        if (w) {
          const list = await loadOnchainHeroes(w)
          // hydrate equippedItems from local map
          const map = loadEquipMap()
          const hydrated = list.map((h) => {
            const tid = h.tokenId ? String(h.tokenId) : null
            const eq = tid ? map[tid] : null
            return eq ? ({ ...h, equippedItems: eq } as any) : h
          })
          setHeroes(hydrated)
          setSelected(hydrated[0] ?? null)
        } else {
          const list = (await loadLocalHeroes()) as HeroWithToken[]
          setHeroes(list)
          setSelected(list[0] ?? null)
        }

        const inv = await loadInventory()
        setInventory(inv.items)
        setInvSource(inv.source)
      } catch (e: any) {
        setErr(e?.message || String(e))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const selectedEff = useMemo(() => {
    if (!selected) return null
    const itemBonus = getEquippedBonuses(selected.equippedItems)
    const setBonus = getSetBonus(selected.equippedItems)
    return {
      base: { atk: selected.attack, def: selected.defense, spd: selected.speed },
      itemBonus,
      setBonus,
      total: {
        atk: selected.attack + itemBonus.atk + setBonus.atk,
        def: selected.defense + itemBonus.def + setBonus.def,
        spd: selected.speed + itemBonus.spd + setBonus.spd,
      },
    }
  }, [selected])

  const refreshInventory = async () => {
    const inv = await loadInventory()
    setInventory(inv.items)
    setInvSource(inv.source)
  }

  const persistSelectedHero = async (nextHero: HeroWithToken) => {
    // Update selected hero in list (supabase list already updated separately)
    setSelected(nextHero)
    setHeroes((prev) => {
      const idx = prev.findIndex((h) => (h.dbId && nextHero.dbId ? h.dbId === nextHero.dbId : h.name === nextHero.name && h.imageUrl === nextHero.imageUrl))
      if (idx === -1) return prev
      const clone = [...prev]
      clone[idx] = nextHero
      return clone
    })

    // Keep current hero in sync (best-effort)
    try {
      const raw = localStorage.getItem(CURRENT_HERO_KEY)
      const current = raw ? (JSON.parse(raw) as Hero) : null
      if (!current || sameHero(current, nextHero)) {
        localStorage.setItem(CURRENT_HERO_KEY, JSON.stringify(nextHero))
      }
    } catch {
      // ignore
    }

    if (wallet && nextHero.tokenId) {
      const map = loadEquipMap()
      map[String(nextHero.tokenId)] = nextHero.equippedItems ?? null
      saveEquipMap(map)
    }

    // Persist local heroes collection if not wallet-connected
    if (!wallet) {
      try {
        const list = (await loadLocalHeroes()) as HeroWithToken[]
        const idx = list.findIndex((h) => sameHero(h, nextHero))
        if (idx !== -1) {
          const clone = [...list]
          clone[idx] = nextHero
          saveLocalHeroes(clone as any)
        }
      } catch {
        // ignore
      }
    }
  }

  const confirmEquip = async () => {
    if (!selected || !equipPending) return
    setBusyEquip(true)
    try {
      const { item, slot } = equipPending
      const next: HeroWithToken = {
        ...selected,
        equippedItems: {
          ...(selected.equippedItems ?? {}),
          [slot]: item,
        },
      }

      // For onchain heroes we persist equippedItems locally by tokenId
      await persistSelectedHero(next)
      setEquipPending(null)
    } catch (e: any) {
      alert(e?.message || String(e))
    } finally {
      setBusyEquip(false)
    }
  }

  if (loading) return <div className="text-xs text-gray-400 text-center mt-6">Loading…</div>
  if (err) return <div className="text-xs text-red-400 text-center mt-6">{err}</div>

  if (!selected) {
    return (
      <div className="mt-6 text-center text-gray-400">
        No heroes found.
        <div className="mt-3">
          <a href="/" className="text-blue-400 underline">Pull a hero</a>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      {wallet ? (
        <div className="text-center text-xs text-gray-500">Wallet: {wallet.slice(0, 6)}…{wallet.slice(-4)} • Inventory: {invSource}</div>
      ) : (
        <div className="text-center text-xs text-gray-500">Local heroes • Inventory: {invSource}</div>
      )}

      {/* Master: grid */}
      {!selected ? null : (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {heroes.map((h, idx) => {
            const active = sameHero(h, selected)
            return (
              <button
                key={h.dbId ?? `${h.name}-${idx}`}
                onClick={() => {
                  setSelected(h)
                  setTab("stats")
                }}
                className={`border bg-gray-900 rounded-2xl p-3 text-left ${active ? "border-purple-500" : "border-gray-800"} ${rarityBorder[h.rarity] || "border-gray-700"}`}
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
                    <div className="font-bold truncate">{h.name}</div>
                    <div className="text-xs text-gray-400">{h.rarity} • Lvl {h.level}</div>
                    {h.equippedItems && Object.values(h.equippedItems).some(Boolean) && (
                      <div className="text-[10px] text-cyan-200 mt-1">🎒 {Object.values(h.equippedItems).filter(Boolean).length} equipped</div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detail */}
      <div className="mt-6 border border-gray-800 bg-gray-900 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <img src={selected.imageUrl} alt={selected.name} className="w-16 h-16 rounded-2xl object-cover border border-gray-700" />
          <div className="min-w-0">
            <div className="text-lg font-extrabold truncate">{selected.name}</div>
            <div className="text-xs text-gray-400">{selected.rarity} • {selected.power}</div>
            {selectedEff?.setBonus.setName && (
              <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold text-[#f97316] border border-[#f97316]/60 bg-[#f97316]/10 px-2 py-0.5 rounded-full">
                🔥 FULL SET BONUS • {selectedEff.setBonus.setName}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setTab("stats")}
            className={`py-2 rounded-xl text-xs font-bold border ${tab === "stats" ? "bg-purple-700 border-purple-500" : "bg-gray-950/30 border-gray-800"}`}
          >
            Stats
          </button>
          <button
            onClick={() => {
              setTab("weapons")
              refreshInventory().catch(() => {})
            }}
            className={`py-2 rounded-xl text-xs font-bold border ${tab === "weapons" ? "bg-purple-700 border-purple-500" : "bg-gray-950/30 border-gray-800"}`}
          >
            Weapons
          </button>
        </div>

        {tab === "stats" && selectedEff && (
          <div className="mt-4 space-y-1">
            {statLine("ATK", selectedEff.base.atk, selectedEff.itemBonus.atk, selectedEff.setBonus.atk)}
            {statLine("DEF", selectedEff.base.def, selectedEff.itemBonus.def, selectedEff.setBonus.def)}
            {statLine("SPD", selectedEff.base.spd, selectedEff.itemBonus.spd, selectedEff.setBonus.spd)}

            <div className="mt-3 text-xs text-gray-500">Total: {selectedEff.total.atk + selectedEff.total.def + selectedEff.total.spd}</div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  try {
                    localStorage.setItem(CURRENT_HERO_KEY, JSON.stringify(selected))
                    window.location.href = "/arena"
                  } catch {
                    window.location.href = "/arena"
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-bold py-2 rounded-xl"
              >
                Use in Arena
              </button>
              <a href="/shop" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-2 rounded-xl text-center">
                Shop
              </a>
            </div>
          </div>
        )}

        {tab === "weapons" && (
          <div className="mt-4">
            <div className="text-xs text-gray-500">Tap an item to equip. Comparison required.</div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["weapon", "shield", "boots", "helmet"] as ItemSlot[]).map((slot) => {
                const it = selected.equippedItems?.[slot]
                return (
                  <div key={slot} className="border border-gray-800 rounded-xl p-2 bg-gray-950/30">
                    <div className="text-[11px] text-gray-400 font-bold">{slotLabel(slot)}</div>
                    {it ? (
                      <div className="text-[11px] text-gray-200 mt-1">
                        {it.imageEmoji} {it.name}
                        {it.set ? <span className="text-[#f97316]"> ({it.set})</span> : null}
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-500 mt-1">(empty)</div>
                    )}
                  </div>
                )
              })}
            </div>

            {inventory.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-5">
                No items in inventory.
                <div className="mt-2">
                  <a href="/shop" className="text-indigo-400 underline">Go to Shop</a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-5">
                {inventory.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => setEquipPending({ item: it, slot: it.slot })}
                    className={`border-2 rounded-xl p-3 bg-gray-950/30 text-left ${itemBorder[it.rarity]}`}
                  >
                    <div className="text-2xl">{it.imageEmoji}</div>
                    <div className="text-xs font-bold mt-1 leading-tight">{it.name}</div>
                    <div className="text-[10px] text-gray-400">{it.rarity} • {it.slot.toUpperCase()}</div>
                    <div className="text-[10px] text-gray-300 mt-1">+{it.bonusATK} ATK • +{it.bonusDEF} DEF • +{it.bonusSPD} SPD</div>
                    {it.set ? <div className="text-[10px] text-[#f97316] mt-1">Set: {it.set}</div> : null}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5 text-center">
              <button
                onClick={() => refreshInventory().catch(() => {})}
                className="text-xs text-gray-300 underline"
              >
                Refresh inventory
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Equip modal */}
      {equipPending && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-[100]">
          <div className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-t-3xl p-4">
            <div className="text-sm font-extrabold">Equip item?</div>
            <div className="text-xs text-gray-400 mt-1">Slot: {slotLabel(equipPending.slot)}</div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="border border-gray-800 rounded-2xl p-3 bg-gray-900">
                <div className="text-xs text-gray-400 font-bold">Currently equipped</div>
                {selected.equippedItems?.[equipPending.slot] ? (
                  <div className="mt-2 text-xs">
                    <div className="font-bold">{selected.equippedItems?.[equipPending.slot]?.name}</div>
                    <div className="text-gray-300">
                      +{selected.equippedItems?.[equipPending.slot]?.bonusATK} ATK • +{selected.equippedItems?.[equipPending.slot]?.bonusDEF} DEF • +{selected.equippedItems?.[equipPending.slot]?.bonusSPD} SPD
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-gray-500">(empty)</div>
                )}
              </div>

              <div className={`border-2 rounded-2xl p-3 bg-gray-900 ${itemBorder[equipPending.item.rarity]}`}>
                <div className="text-xs text-gray-200 font-bold">New item</div>
                <div className="mt-2 text-xs">
                  <div className="font-bold">{equipPending.item.imageEmoji} {equipPending.item.name}</div>
                  <div className="text-gray-300">
                    +{equipPending.item.bonusATK} ATK • +{equipPending.item.bonusDEF} DEF • +{equipPending.item.bonusSPD} SPD
                  </div>
                  {equipPending.item.set ? <div className="text-[#f97316] mt-1">Set: {equipPending.item.set}</div> : null}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                disabled={busyEquip}
                onClick={() => setEquipPending(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-60 text-white font-bold py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={busyEquip}
                onClick={() => confirmEquip().catch(() => {})}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold py-2 rounded-xl"
              >
                {busyEquip ? "Equipping…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
