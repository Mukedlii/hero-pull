"use client"

import { useEffect, useMemo, useState } from "react"
import BattleArena from "@/components/BattleArena"
import { generateHero, type Hero } from "@/lib/heroes"
import { getEquippedBonuses, getSetBonus } from "@/lib/items"
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
      const itemBonus = getEquippedBonuses(hero.equippedItems)
      const setBonus = getSetBonus(hero.equippedItems)
      const heroEffectiveATK = hero.attack + itemBonus.atk + setBonus.atk
      const heroEffectiveDEF = hero.defense + itemBonus.def + setBonus.def
      const heroEffectiveSPD = hero.speed + itemBonus.spd + setBonus.spd
      const heroScore = heroEffectiveATK + heroEffectiveDEF + heroEffectiveSPD

      const oppScore = o.attack + o.defense + o.speed
      const w = heroScore >= oppScore ? "hero" : "opponent"
      setWinner(w)

      // Points: Victory +5, Defeat -4 (clamped at 0)
      ;(async () => {
        try {
          const { sdk } = await import("@farcaster/frame-sdk")
          const ctx: any = await sdk.context
          const fid = ctx?.user?.fid
          await awardBattlePoints({ battleId: id, delta: w === "hero" ? 5 : -4, fid }).catch(() => {})
        } catch {
          await awardBattlePoints({ battleId: id, delta: w === "hero" ? 5 : -4 }).catch(() => {})
        }
      })()
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

  // Battle is deprecated. Keep route for old links.
  if (typeof window !== "undefined") {
    window.location.href = "/arena"
  }
  return null

  if (!opponent) return null

  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">Battle</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">Fight a random opponent!</p>

      {hero.equippedItems && Object.values(hero.equippedItems).some(Boolean) && (
        <div className="mt-4 text-center text-xs text-gray-300">
          Equipped: {Object.values(hero.equippedItems).filter(Boolean).length} items
        </div>
      )}

      <BattleArena hero={hero} opponent={opponent} winner={winner} battleId={battleId} onBattleAgain={rollBattle} onShare={handleShare} />
    </div>
  )
}
