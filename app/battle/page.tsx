"use client"

import { useEffect, useMemo, useState } from "react"
import BattleArena from "@/components/BattleArena"
import { generateHero, type Hero } from "@/lib/heroes"
import { awardBattlePoints } from "@/lib/score"

export default function BattlePage() {
  const [hero, setHero] = useState<Hero | null>(null)
  const [opponent, setOpponent] = useState<Hero | null>(null)
  const [winner, setWinner] = useState<"hero" | "opponent" | null>(null)
  const [battleId, setBattleId] = useState<string>("")

  useEffect(() => {
    try {
      const raw = localStorage.getItem("hero-pull-current-hero")
      setHero(raw ? (JSON.parse(raw) as Hero) : null)
    } catch {
      setHero(null)
    }
  }, [])

  const rollBattle = () => {
    if (!hero) return

    const id = globalThis.crypto?.randomUUID?.() ?? String(Date.now())
    setBattleId(id)

    const o = generateHero()
    setOpponent(o)
    setWinner(null)

    setTimeout(() => {
      const heroScore = hero.attack + hero.defense + hero.speed
      const oppScore = o.attack + o.defense + o.speed
      const w = heroScore >= oppScore ? "hero" : "opponent"
      setWinner(w)

      // Points: Victory +5, Defeat -4 (clamped at 0)
      awardBattlePoints({ battleId: id, delta: w === "hero" ? 5 : -4 }).catch(() => {})
    }, 900)
  }

  useEffect(() => {
    if (hero) rollBattle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero])

  const shareText = useMemo(() => {
    if (!hero || !opponent || !winner) return ""

    const frameUrl = "https://hero-pull.vercel.app"

    if (winner === "hero") {
      return `OMG I WON — you still can’t beat me 😎😂🤣😜✨\n\n${hero.name} DESTROYED ${opponent.name} ⚔️\n\nPlay here 👇\n${frameUrl}`
    }

    return `I LOST… Help me beat ${opponent.name}! 😭🙏⚔️\n\nPlay here 👇\n${frameUrl}`
  }, [hero, opponent, winner])

  const handleShare = async () => {
    const frameUrl = "https://hero-pull.vercel.app"
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(frameUrl)}`

    // Best-effort server event for share (FID-based).
    ;(async () => {
      try {
        const { sdk } = await import("@farcaster/frame-sdk")
        const ctx: any = await sdk.context
        const fid = ctx?.user?.fid
        if (!fid) return
        await fetch('/api/event', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ fid, action: 'share' }),
        })
      } catch {
        // ignore
      }
    })()

    // In Warpcast, prefer SDK openUrl so it opens in-app (otherwise iOS may show Farcaster download page)
    try {
      const { sdk } = await import("@farcaster/frame-sdk")
      await sdk.actions.openUrl(url)
      return
    } catch {
      // fallback
    }

    window.open(url, "_blank")
  }

  if (!hero) {
    return (
      <div className="px-4 pb-24">
        <h1 className="text-2xl font-extrabold text-center mt-6">Battle</h1>
        <p className="text-center text-gray-400 mt-4">Choose a hero first!</p>
        <div className="flex justify-center mt-6">
          <a href="/collection" className="bg-purple-700 hover:bg-purple-600 text-white py-2 px-4 rounded-lg">
            Go to My Heroes
          </a>
        </div>
      </div>
    )
  }

  if (!opponent) return null

  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">Battle</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">Fight a random opponent!</p>

      <BattleArena hero={hero} opponent={opponent} winner={winner} onBattleAgain={rollBattle} onShare={handleShare} />
    </div>
  )
}
