"use client"

import { useEffect, useMemo, useState } from "react"
import type { Hero } from "@/lib/heroes"

const rarityBorder: Record<Hero["rarity"], string> = {
  Common: "border-gray-500",
  Rare: "border-blue-500 shadow-[0_0_12px_#60a5fa]",
  Epic: "border-purple-500 shadow-[0_0_15px_#c084fc]",
  Legendary: "border-yellow-400 shadow-[0_0_20px_#ffd700]",
}

export default function CollectionPage() {
  const [collection, setCollection] = useState<Hero[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("hero-pull-collection")
      setCollection(raw ? (JSON.parse(raw) as Hero[]) : [])
    } catch {
      setCollection([])
    }
  }, [])

  const isEmpty = useMemo(() => !collection || collection.length === 0, [collection])

  const selectHero = (hero: Hero) => {
    localStorage.setItem("hero-pull-current-hero", JSON.stringify(hero))
    window.location.href = "/battle"
  }

  if (isEmpty) {
    return (
      <div className="px-4 pb-24">
        <h1 className="text-2xl font-extrabold text-center mt-6">My Heroes</h1>
        <p className="text-center text-gray-400 mt-4">No heroes yet! Go pull some 🦸</p>
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
            <button
              onClick={() => selectHero(hero)}
              className="bg-red-600 hover:bg-red-500 text-white text-xs py-1 px-3 rounded-lg"
            >
              ⚔️ Battle
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
