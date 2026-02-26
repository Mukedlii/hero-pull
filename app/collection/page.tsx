"use client"

import { useEffect, useMemo, useState } from "react"
import type { Hero, EquippedWeapon } from "@/lib/heroes"
import type { Weapon } from "@/lib/weapons"
import { getWalletAddress, loadHeroes, loadWeapons, markWeaponEquipped, updateHeroEquippedWeapon } from "@/lib/db"

const rarityBorder: Record<Hero["rarity"], string> = {
  Common: "border-gray-500",
  Rare: "border-blue-500 shadow-[0_0_12px_#60a5fa]",
  Epic: "border-purple-500 shadow-[0_0_15px_#c084fc]",
  Legendary: "border-yellow-400 shadow-[0_0_20px_#ffd700]",
}

export default function CollectionPage() {
  const [collection, setCollection] = useState<Hero[]>([])
  const [weapons, setWeapons] = useState<Weapon[]>([])
  const [equipIndex, setEquipIndex] = useState<number | null>(null)

  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [onchainTokenIds, setOnchainTokenIds] = useState<string[]>([])
  const [onchainHeroes, setOnchainHeroes] = useState<Record<string, Hero>>({})
  const [loadingOnchain, setLoadingOnchain] = useState(false)

  useEffect(() => {
    ;(async () => {
      // Prefer Supabase (wallet)
      try {
        const wallet = await getWalletAddress()
        if (wallet) {
          setWalletAddress(wallet)
          const [hs, ws] = await Promise.all([loadHeroes(wallet), loadWeapons(wallet)])
          setCollection(hs)
          setWeapons(ws)
        } else {
          // fallback localStorage
          try {
            const raw = localStorage.getItem("hero-pull-collection")
            setCollection(raw ? (JSON.parse(raw) as Hero[]) : [])
          } catch {
            setCollection([])
          }

          try {
            const wraw = localStorage.getItem("hero-pull-weapons")
            setWeapons(wraw ? (JSON.parse(wraw) as Weapon[]) : [])
          } catch {
            setWeapons([])
          }
        }
      } catch {
        // fallback localStorage
        try {
          const raw = localStorage.getItem("hero-pull-collection")
          setCollection(raw ? (JSON.parse(raw) as Hero[]) : [])
        } catch {
          setCollection([])
        }

        try {
          const wraw = localStorage.getItem("hero-pull-weapons")
          setWeapons(wraw ? (JSON.parse(wraw) as Weapon[]) : [])
        } catch {
          setWeapons([])
        }
      }

      // Onchain restore (optional)
      try {
        setLoadingOnchain(true)
        const mod: any = await import("@farcaster/frame-sdk")
        const provider = mod?.sdk?.wallet?.ethProvider || mod?.default?.wallet?.ethProvider
        if (!provider) return

        const accounts = await provider.request({ method: "eth_accounts" })
        const addr = accounts?.[0]
        if (!addr) return

        setWalletAddress(addr)
        const res = await fetch(`/api/nft/owned?address=${addr}`, { cache: "no-store" })
        const json = await res.json()
        const ids: string[] = Array.isArray(json?.tokenIds) ? json.tokenIds : []
        setOnchainTokenIds(ids)

        const entries = await Promise.all(
          ids.map(async (id: string) => {
            try {
              const r = await fetch(`/api/nft/hero/${id}`, { cache: "no-store" })
              const j = await r.json()
              return [id, j?.hero as Hero] as const
            } catch {
              return [id, null] as const
            }
          })
        )
        const map: Record<string, Hero> = {}
        for (const [id, h] of entries) {
          if (h) map[id] = h
        }
        setOnchainHeroes(map)
      } catch {
        // ignore
      } finally {
        setLoadingOnchain(false)
      }
    })()
  }, [])

  const isEmpty = useMemo(() => !collection || collection.length === 0, [collection])
  const hasOnchain = useMemo(() => onchainTokenIds.length > 0, [onchainTokenIds])

  const persistCollection = (next: Hero[]) => {
    setCollection(next)
    // fallback cache (only used if no wallet)
    try {
      localStorage.setItem("hero-pull-collection", JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const equipWeapon = async (heroIndex: number, weapon: Weapon) => {
    const next = [...collection]
    const h = { ...next[heroIndex] }
    const equippedWeapon: EquippedWeapon = {
      name: weapon.name,
      rarity: weapon.rarity,
      imageEmoji: weapon.imageEmoji,
      bonusATK: weapon.bonusATK,
      bonusDEF: weapon.bonusDEF,
      bonusSPD: weapon.bonusSPD,
    }
    h.equippedWeapon = equippedWeapon
    next[heroIndex] = h
    persistCollection(next)

    // Persist to Supabase when possible
    try {
      if (walletAddress && h.dbId) {
        await updateHeroEquippedWeapon(h.dbId, equippedWeapon)
        await markWeaponEquipped(weapon.id, h.dbId)
      }
    } catch {
      // ignore
    }

    try {
      const currentRaw = localStorage.getItem("hero-pull-current-hero")
      if (currentRaw) {
        const current = JSON.parse(currentRaw) as Hero
        if (current.name === h.name && current.power === h.power) {
          localStorage.setItem("hero-pull-current-hero", JSON.stringify(h))
        }
      }
    } catch {
      // ignore
    }

    setEquipIndex(null)
  }

  const selectHero = (hero: Hero) => {
    localStorage.setItem("hero-pull-current-hero", JSON.stringify(hero))
    window.location.href = "/battle"
  }

  if (isEmpty && !hasOnchain) {
    return (
      <div className="px-4 pb-24">
        <h1 className="text-2xl font-extrabold text-center mt-6">My Heroes</h1>
        <p className="text-center text-gray-400 mt-4">No heroes yet! Go pull some 🦸</p>

        <div className="mt-4 text-xs text-gray-500 text-center">
          {loadingOnchain
            ? "Checking onchain NFTs…"
            : walletAddress
              ? "If you minted NFTs, they are onchain. If you don’t see them here, try reopening the mini app."
              : "If you minted NFTs, open this in Warpcast with a connected wallet to restore them from chain."}
        </div>

        <div className="flex justify-center mt-6">
          <a href="/" className="bg-purple-700 hover:bg-purple-600 text-white py-2 px-4 rounded-lg">
            Go Pull a Hero
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">My Heroes</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">Your pulled heroes</p>

      {walletAddress && (
        <div className="mt-3 text-center text-xs text-gray-500">
          Wallet: {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
        </div>
      )}

      {hasOnchain && (
        <div className="mt-4 p-3 rounded-xl border border-gray-700 bg-gray-900">
          <p className="text-sm font-bold">Onchain Heroes (restored)</p>
          <p className="text-xs text-gray-400 mt-1">Token IDs: {onchainTokenIds.join(", ")}</p>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {onchainTokenIds.map((id) => {
              const h = onchainHeroes[id]
              if (!h) {
                return (
                  <div key={id} className="border border-gray-700 rounded-xl p-3 bg-black/30">
                    <p className="text-xs text-gray-400">#{id}</p>
                    <p className="text-sm">Loading…</p>
                  </div>
                )
              }

              return (
                <div
                  key={id}
                  className={`border-2 rounded-xl p-3 flex flex-col items-center gap-2 bg-gray-900 ${rarityBorder[h.rarity]}`}
                >
                  <img src={h.imageUrl} className="w-20 h-20 rounded-xl object-cover" alt={h.name} />
                  <p className="font-bold text-sm text-center leading-tight">
                    {h.name} <span className="text-gray-400">#{id}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {h.rarity} • Lv.{h.level}
                  </p>
                  <p className="text-xs">
                    ATK:{h.attack} DEF:{h.defense} SPD:{h.speed}
                  </p>
                  <a
                    href={`https://basescan.org/token/0xA728A918A767bB085D4ac895b8F2d2AbD0dE27bB?a=${id}`}
                    target="_blank"
                    className="text-xs text-blue-300 underline"
                  >
                    View on BaseScan
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-6">
        {collection.map((hero, idx) => (
          <div
            key={`${hero.name}-${idx}`}
            className={`border-2 rounded-xl p-3 flex flex-col items-center gap-2 bg-gray-900 ${rarityBorder[hero.rarity]}`}
          >
            <img src={hero.imageUrl} className="w-20 h-20 rounded-xl object-cover" alt={hero.name} />
            <p className="font-bold text-sm text-center leading-tight">{hero.name}</p>
            <p className="text-xs text-gray-400">
              {hero.rarity} • Lv.{hero.level}
            </p>
            <p className="text-xs">
              ATK:{hero.attack} DEF:{hero.defense} SPD:{hero.speed}
            </p>

            {hero.equippedWeapon ? (
              <p className="text-xs text-gray-300">
                {hero.equippedWeapon.imageEmoji} {hero.equippedWeapon.name} (+{hero.equippedWeapon.bonusATK} ATK)
              </p>
            ) : (
              <p className="text-xs text-gray-500">No weapon equipped</p>
            )}

            {weapons.length > 0 && (
              <button
                onClick={() => setEquipIndex(idx)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1 px-3 rounded-lg"
              >
                Equip
              </button>
            )}

            {equipIndex === idx && (
              <div className="w-full border-t border-gray-700 pt-2 text-left">
                <p className="text-xs text-gray-400 mb-1">Select a weapon:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {weapons.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => equipWeapon(idx, w)}
                      className="w-full flex items-center gap-2 px-2 py-1 bg-gray-800 hover:bg-gray-700 text-xs rounded"
                    >
                      <span className="text-base">{w.imageEmoji}</span>
                      <span>{w.name}</span>
                      <span className="ml-auto text-[10px] text-gray-400">{w.rarity}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setEquipIndex(null)} className="mt-2 text-[10px] text-blue-300 underline">
                  Cancel
                </button>
              </div>
            )}

            <button
              onClick={() => selectHero(hero)}
              className="bg-red-600 hover:bg-red-500 text-white text-xs py-1 px-3 rounded-lg"
            >
              ⚔️ Battle
            </button>
          </div>
        ))}
      </div>

      {!collection.length && hasOnchain && (
        <div className="mt-6 text-center text-sm text-gray-400">
          Onchain NFTs found, but local hero gallery is empty (cache reset). This is expected.
        </div>
      )}
    </div>
  )
}
