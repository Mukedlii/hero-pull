"use client"

import { useEffect, useMemo, useState } from "react"
import BattleArena from "@/components/BattleArena"
import { generateHero, type Hero } from "@/lib/heroes"

export default function BattlePage() {
  const [hero, setHero] = useState<Hero | null>(null)
  const [opponent, setOpponent] = useState<Hero | null>(null)
  const [winner, setWinner] = useState<"hero" | "opponent" | null>(null)

  const rollBattle = () => {
    const h = generateHero()
    const o = generateHero()
    setHero(h)
    setOpponent(o)
    setWinner(null)

    // simple outcome after a short delay
    setTimeout(() => {
      const heroScore = h.attack + h.defense + h.speed
      const oppScore = o.attack + o.defense + o.speed
      setWinner(heroScore >= oppScore ? "hero" : "opponent")
    }, 900)
  }

  useEffect(() => {
    rollBattle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shareText = useMemo(() => {
    if (!hero || !opponent || !winner) return ""
    const result = winner === "hero" ? "Victory" : "Defeat"
    return `Hero Pull Battle: ${result}!\n\n${hero.name} vs ${opponent.name}\n\nPlay here 👇`
  }, [hero, opponent, winner])

  const handleShare = () => {
    const frameUrl = "https://hero-pull.vercel.app"
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(frameUrl)}`
    window.open(url, "_blank")
  }

  if (!hero || !opponent) return null

  return (
    <div className="px-4 pb-20">
      <h1 className="text-2xl font-extrabold text-center mt-6">Battle</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">Fight an opponent hero</p>

      <BattleArena hero={hero} opponent={opponent} winner={winner} onBattleAgain={rollBattle} onShare={handleShare} />
    </div>
  )
}
