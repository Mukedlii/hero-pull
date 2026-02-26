"use client"

import { useEffect, useMemo, useState } from "react"
import { Weapon, WeaponRarity, generateWeapon, nextWeaponRarity } from "@/lib/weapons"

const WEAPONS_KEY = "hero-pull-weapons"

const rarityBorder: Record<WeaponRarity, string> = {
  Common: "border-gray-600",
  Rare: "border-blue-500 shadow-[0_0_12px_#60a5fa]",
  Epic: "border-purple-500 shadow-[0_0_15px_#c084fc]",
  Legendary: "border-yellow-400 shadow-[0_0_20px_#ffd700]",
}

export default function WeaponsPage() {
  const [weapons, setWeapons] = useState<Weapon[]>([])
  const [lastForged, setLastForged] = useState<Weapon | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WEAPONS_KEY)
      setWeapons(raw ? (JSON.parse(raw) as Weapon[]) : [])
    } catch {
      setWeapons([])
    }
  }, [])

  const save = (list: Weapon[]) => {
    setWeapons(list)
    localStorage.setItem(WEAPONS_KEY, JSON.stringify(list))
  }

  const handleForge = () => {
    const w = generateWeapon()
    const next = [w, ...weapons]
    save(next)
    setLastForged(w)
  }

  const counts = useMemo(() => {
    const c: Record<WeaponRarity, number> = { Common: 0, Rare: 0, Epic: 0, Legendary: 0 }
    for (const w of weapons) c[w.rarity]++
    return c
  }, [weapons])

  const canMergeRarity = (r: WeaponRarity) => (r === "Legendary" ? false : counts[r] >= 3)

  const mergeRarity = (r: WeaponRarity) => {
    if (!canMergeRarity(r)) return
    const target = nextWeaponRarity(r)

    // remove 3 of rarity r
    const nextList: Weapon[] = []
    let removed = 0
    for (const w of weapons) {
      if (w.rarity === r && removed < 3) {
        removed++
        continue
      }
      nextList.push(w)
    }

    // forge 1 of target rarity (deterministic name/bonuses based on our generator)
    let nw = generateWeapon()
    // override rarity to target and recompute bonuses/name by generating until match (simple prototype)
    // (keeps distribution simple without extra code)
    for (let i = 0; i < 50 && nw.rarity !== target; i++) nw = generateWeapon()
    if (nw.rarity !== target) {
      // hard override if we didn't hit target in 50 tries
      nw = { ...nw, rarity: target }
    }

    save([nw, ...nextList])
    setLastForged(nw)
  }

  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">⚔️ Weapons</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">Forge & merge weapons (local prototype)</p>

      <div className="mt-6 flex justify-center">
        <button
          onClick={handleForge}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-2xl"
        >
          🎲 Forge Weapon
        </button>
      </div>

      {lastForged && (
        <div className={`mt-6 border-2 rounded-2xl p-4 bg-gray-900 ${rarityBorder[lastForged.rarity]}`}>
          <div className="text-5xl text-center">{lastForged.imageEmoji}</div>
          <p className="text-center font-extrabold mt-2">{lastForged.name}</p>
          <p className="text-center text-xs text-gray-400 mt-1">
            {lastForged.rarity} {lastForged.type}
          </p>
          <p className="text-center text-xs mt-2">
            +{lastForged.bonusATK} ATK • +{lastForged.bonusDEF} DEF • +{lastForged.bonusSPD} SPD
          </p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3">
        {(["Common", "Rare", "Epic", "Legendary"] as WeaponRarity[]).map((r) => (
          <div key={r} className="border border-gray-800 rounded-2xl p-3 bg-gray-900">
            <p className="font-bold text-sm">{r}</p>
            <p className="text-xs text-gray-400 mt-1">Count: {counts[r]}</p>
            {r !== "Legendary" && (
              <button
                onClick={() => mergeRarity(r)}
                disabled={!canMergeRarity(r)}
                className="mt-2 w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white text-xs py-2 rounded-xl"
              >
                Merge 3 → {nextWeaponRarity(r)}
              </button>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mt-10">Inventory</h2>
      {weapons.length === 0 ? (
        <p className="text-center text-gray-500 text-sm mt-3">No weapons yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {weapons.map((w) => (
            <div key={w.id} className={`border-2 rounded-xl p-3 bg-gray-900 ${rarityBorder[w.rarity]}`}>
              <div className="text-3xl">{w.imageEmoji}</div>
              <p className="font-bold text-sm mt-1 leading-tight">{w.name}</p>
              <p className="text-xs text-gray-400">
                {w.rarity} {w.type}
              </p>
              <p className="text-xs mt-1">+{w.bonusATK} ATK</p>
              <p className="text-xs">+{w.bonusDEF} DEF</p>
              <p className="text-xs">+{w.bonusSPD} SPD</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
