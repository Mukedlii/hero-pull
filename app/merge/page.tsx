"use client"

import { useEffect, useMemo, useState } from "react"
import type { Hero } from "@/lib/heroes"
import { generateHero } from "@/lib/heroes"

type Rarity = Hero["rarity"]

const rarityBorder: Record<Rarity, string> = {
  Common: "border-gray-500",
  Rare: "border-blue-500 shadow-[0_0_12px_#60a5fa]",
  Epic: "border-purple-500 shadow-[0_0_15px_#c084fc]",
  Legendary: "border-yellow-400 shadow-[0_0_20px_#ffd700]",
}

const nextRarity: Record<Exclude<Rarity, "Legendary">, Rarity> = {
  Common: "Rare",
  Rare: "Epic",
  Epic: "Legendary",
}

function statForRarity(rarity: Rarity) {
  const ranges: Record<Rarity, [number, number]> = {
    Common: [10, 40],
    Rare: [30, 60],
    Epic: [50, 80],
    Legendary: [70, 100],
  }
  const [min, max] = ranges[rarity]
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function loadCollection(): Hero[] {
  try {
    const raw = localStorage.getItem("hero-pull-collection")
    return raw ? (JSON.parse(raw) as Hero[]) : []
  } catch {
    return []
  }
}

function saveCollection(collection: Hero[]) {
  localStorage.setItem("hero-pull-collection", JSON.stringify(collection))
}

export default function MergePage() {
  const [collection, setCollection] = useState<Hero[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<Hero | null>(null)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    setCollection(loadCollection())
  }, [])

  const eligible = useMemo(() => {
    return collection.filter((h) => h.rarity !== "Legendary")
  }, [collection])

  const selected = useMemo(() => {
    const ids = selectedIds
    return eligible.filter((h, idx) => ids.has(`${h.name}:${idx}`))
  }, [eligible, selectedIds])

  const selectedRarity = selected[0]?.rarity
  const canMerge = selected.length === 3 && selected.every((h) => h.rarity === selectedRarity)

  const toggle = (key: string, hero: Hero) => {
    setError("")
    setResult(null)

    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        return next
      }

      // only allow selecting same rarity
      const currentSelected = Array.from(next)
      if (currentSelected.length > 0) {
        const firstKey = currentSelected[0]
        const [firstName, firstIdxStr] = firstKey.split(":")
        const firstIdx = Number(firstIdxStr)
        const firstHero = eligible.find((h, idx) => `${h.name}:${idx}` === `${firstName}:${firstIdx}`)
        if (firstHero && firstHero.rarity !== hero.rarity) return next
      }

      // max 3
      if (next.size >= 3) return next
      next.add(key)
      return next
    })
  }

  const doMerge = () => {
    setError("")
    setResult(null)

    if (!canMerge || !selectedRarity || selectedRarity === "Legendary") {
      setError("Select exactly 3 heroes of the same rarity (Common/Rare/Epic).")
      return
    }

    const upgraded = nextRarity[selectedRarity as Exclude<Rarity, "Legendary">]

    // remove the 3 selected from collection (by position among eligible)
    const ids = new Set(selectedIds)
    const newCollection: Hero[] = []
    eligible.forEach((h, idx) => {
      const key = `${h.name}:${idx}`
      if (!ids.has(key)) newCollection.push(h)
    })

    // also keep legendaries (they were excluded from eligible)
    const legendaries = collection.filter((h) => h.rarity === "Legendary")

    // create merged hero
    const mergedBase = generateHero()
    const merged: Hero = {
      ...mergedBase,
      rarity: upgraded,
      attack: statForRarity(upgraded),
      defense: statForRarity(upgraded),
      speed: statForRarity(upgraded),
      xp: 0,
      level: 1,
    }

    const finalCollection = [merged, ...newCollection, ...legendaries]
    saveCollection(finalCollection)
    localStorage.setItem("hero-pull-current-hero", JSON.stringify(merged))

    setCollection(finalCollection)
    setSelectedIds(new Set())
    setResult(merged)
  }

  const helper = useMemo(() => {
    if (selected.length === 0) return "Pick 3 heroes of the same rarity to merge."
    if (selected.length < 3) return `Selected ${selected.length}/3 — pick ${3 - selected.length} more.`
    if (!canMerge) return "Selection must be 3 heroes of the same rarity."
    return `Ready: 3 ${selectedRarity} → 1 ${nextRarity[selectedRarity as Exclude<Rarity, "Legendary">]}`
  }, [selected.length, canMerge, selectedRarity])

  if (collection.length === 0) {
    return (
      <div className="px-4 pb-24">
        <h1 className="text-2xl font-extrabold text-center mt-6">Merge</h1>
        <p className="text-center text-gray-400 mt-4">No heroes yet. Go pull some first!</p>
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
      <h1 className="text-2xl font-extrabold text-center mt-6">Merge</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">3 Common → 1 Rare · 3 Rare → 1 Epic · 3 Epic → 1 Legendary</p>

      <div className="mt-4 text-center text-xs text-gray-400">{helper}</div>
      {error && <div className="mt-2 text-center text-xs text-red-400">{error}</div>}

      <div className="flex justify-center mt-4">
        <button
          onClick={doMerge}
          disabled={!canMerge}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-5 rounded-xl disabled:opacity-50"
        >
          Merge
        </button>
      </div>

      {result && (
        <div className={`mt-6 border-2 rounded-2xl p-4 bg-gray-900 ${rarityBorder[result.rarity]}`}>
          <div className="text-center font-extrabold">Merged Hero!</div>
          <div className="flex flex-col items-center gap-2 mt-3">
            <img src={result.imageUrl} className="w-24 h-24 rounded-xl object-cover" alt={result.name} />
            <div className="font-bold">{result.name}</div>
            <div className="text-xs text-gray-400">{result.rarity} • Lv.{result.level}</div>
            <div className="text-xs">ATK:{result.attack} DEF:{result.defense} SPD:{result.speed}</div>
            <a href="/battle" className="mt-2 bg-red-600 hover:bg-red-500 text-white text-xs py-2 px-3 rounded-lg">
              ⚔️ Battle with this Hero
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-6">
        {eligible.map((h, idx) => {
          const key = `${h.name}:${idx}`
          const active = selectedIds.has(key)
          const disabled =
            selectedIds.size > 0 &&
            !active &&
            selected[0] &&
            selected[0].rarity !== h.rarity

          return (
            <button
              key={key}
              onClick={() => toggle(key, h)}
              disabled={disabled}
              className={`border-2 rounded-xl p-3 flex flex-col items-center gap-2 bg-gray-900 text-left ${rarityBorder[h.rarity]} ${
                active ? "ring-2 ring-white/60" : ""
              } disabled:opacity-40`}
            >
              <img src={h.imageUrl} className="w-16 h-16 rounded-xl object-cover" alt={h.name} />
              <div className="font-bold text-sm text-center leading-tight">{h.name}</div>
              <div className="text-xs text-gray-400">{h.rarity} • Lv.{h.level}</div>
              <div className="text-[11px]">ATK:{h.attack} DEF:{h.defense} SPD:{h.speed}</div>
            </button>
          )
        })}
      </div>

      <div className="mt-6 text-center text-xs text-gray-500">
        Legendary heroes can’t be merged.
      </div>
    </div>
  )
}
