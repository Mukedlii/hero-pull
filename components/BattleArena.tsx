"use client"

import { useEffect, useMemo, useState } from 'react'
import { Hero } from '@/lib/heroes'

interface Props {
  hero: Hero
  opponent: Hero
  winner: 'hero' | 'opponent' | null
  battleId?: string
  onBattleAgain: () => void
  onShare: () => void
}

type Side = 'hero' | 'opponent'

export default function BattleArena({ hero, opponent, winner, battleId, onBattleAgain, onShare }: Props) {
  const rarityBorder: Record<Hero['rarity'], string> = {
    Common: 'border-gray-500',
    Rare: 'border-blue-500 shadow-[0_0_12px_#60a5fa]',
    Epic: 'border-purple-500 shadow-[0_0_15px_#c084fc]',
    Legendary: 'border-yellow-400 shadow-[0_0_20px_#ffd700]',
  }

  const heroEff = useMemo(() => {
    const w = hero.equippedWeapon
    return {
      atk: hero.attack + (w?.bonusATK || 0),
      def: hero.defense + (w?.bonusDEF || 0),
      spd: hero.speed + (w?.bonusSPD || 0),
    }
  }, [hero])

  const oppEff = useMemo(() => {
    return { atk: opponent.attack, def: opponent.defense, spd: opponent.speed }
  }, [opponent])

  const plannedWinner: Side = useMemo(() => {
    const heroScore = heroEff.atk + heroEff.def + heroEff.spd
    const oppScore = oppEff.atk + oppEff.def + oppEff.spd
    return heroScore >= oppScore ? 'hero' : 'opponent'
  }, [heroEff, oppEff])

  const [round, setRound] = useState(0)
  const [heroHp, setHeroHp] = useState(100)
  const [oppHp, setOppHp] = useState(100)
  const [activeHit, setActiveHit] = useState<Side | null>(null)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    const timers: any[] = []

    const push = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        if (!cancelled) fn()
      }, ms)
      timers.push(t)
    }

    // reset
    setRound(0)
    setHeroHp(100)
    setOppHp(100)
    setActiveHit(null)
    setLog([`Battle started!`, hero.equippedWeapon ? `Equipped: ${hero.equippedWeapon.name}` : `No weapon equipped`])

    const heroBias = plannedWinner === 'hero' ? 1 : -1
    const oppBias = plannedWinner === 'opponent' ? 1 : -1

    const heroBase = Math.max(6, Math.floor(heroEff.atk * 0.65 - oppEff.def * 0.25 + heroEff.spd * 0.1))
    const oppBase = Math.max(6, Math.floor(oppEff.atk * 0.65 - heroEff.def * 0.25 + oppEff.spd * 0.1))

    const heroDmg = [
      Math.max(4, heroBase + 4 * heroBias),
      Math.max(4, heroBase + 2 * heroBias),
      Math.max(4, heroBase + 3 * heroBias),
    ]
    const oppDmg = [
      Math.max(4, oppBase + 2 * oppBias),
      Math.max(4, oppBase + 3 * oppBias),
      Math.max(4, oppBase + 2 * oppBias),
    ]

    // Keep it visual: 3 rounds max
    for (let r = 1; r <= 3; r++) {
      const baseT = (r - 1) * 1100

      push(() => {
        setRound(r)
        setActiveHit('opponent')
        setOppHp((hp) => Math.max(0, hp - heroDmg[r - 1]))
        setLog((l) => [...l, `Round ${r}: ${hero.name} hits for ${heroDmg[r - 1]}`])
      }, baseT + 250)

      push(() => setActiveHit(null), baseT + 520)

      push(() => {
        setActiveHit('hero')
        setHeroHp((hp) => Math.max(0, hp - oppDmg[r - 1]))
        setLog((l) => [...l, `Round ${r}: ${opponent.name} hits for ${oppDmg[r - 1]}`])
      }, baseT + 700)

      push(() => setActiveHit(null), baseT + 950)
    }

    return () => {
      cancelled = true
      for (const t of timers) clearTimeout(t)
    }
  }, [battleId, hero, opponent, heroEff, oppEff, plannedWinner])

  const hpBar = (pct: number) => {
    const v = Math.max(0, Math.min(100, pct))
    return (
      <div className="h-2 w-full bg-gray-800 rounded">
        <div
          className="h-2 bg-red-500 rounded transition-all duration-300"
          style={{ width: `${v}%` }}
        />
      </div>
    )
  }

  const Card = ({ side }: { side: Side }) => {
    const h = side === 'hero' ? hero : opponent
    const eff = side === 'hero' ? heroEff : oppEff
    const hp = side === 'hero' ? heroHp : oppHp
    const hit = activeHit === side

    return (
      <div
        className={`relative w-[170px] p-3 rounded-2xl border-2 bg-gray-950/60 ${rarityBorder[h.rarity]} ${
          winner === side ? 'ring-2 ring-yellow-300' : ''
        } ${hit ? 'battle-hit' : ''}`}
      >
        <div className="text-xs text-gray-400">{side === 'hero' ? 'You' : 'Enemy'}</div>
        <div className="text-sm font-extrabold truncate">{h.name}</div>

        <div className="mt-2 flex items-center gap-3">
          <div className={`w-14 h-14 rounded-xl overflow-hidden border ${rarityBorder[h.rarity]}`}>
            <img src={h.imageUrl} alt={h.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-300">ATK {eff.atk}</div>
            <div className="text-[11px] text-gray-300">DEF {eff.def}</div>
            <div className="text-[11px] text-gray-300">SPD {eff.spd}</div>
          </div>
        </div>

        <div className="mt-2">{hpBar(hp)}</div>

        {side === 'hero' && hero.equippedWeapon && (
          <div className="mt-2 text-[11px] text-cyan-200">
            ⚔️ {hero.equippedWeapon.imageEmoji} {hero.equippedWeapon.name} (+{hero.equippedWeapon.bonusATK} ATK)
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-6 max-w-sm mx-auto">
      <div className="text-xs text-gray-400">Round: {round}/3</div>

      <div className="flex items-center justify-center gap-3 w-full">
        <Card side="hero" />
        <div className="text-lg font-black text-white/80">VS</div>
        <Card side="opponent" />
      </div>

      <div className="w-full rounded-2xl border border-gray-800 bg-gray-950/40 p-3">
        <div className="text-xs text-gray-400 mb-2">Battle log</div>
        <div className="text-[11px] text-gray-200 space-y-1 max-h-24 overflow-y-auto">
          {log.slice(-5).map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>

      {winner && <div className="text-xl font-extrabold">{winner === 'hero' ? 'Victory! 🏆' : 'Defeat! 😭'}</div>}

      {winner && (
        <div className="flex gap-3">
          <button onClick={onBattleAgain} className="bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-xl">
            Battle Again
          </button>
          <button onClick={onShare} className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-xl">
            Share
          </button>
        </div>
      )}
    </div>
  )
}
