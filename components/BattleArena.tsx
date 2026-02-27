"use client"

import { useEffect, useMemo, useState } from 'react'
import { Hero } from '@/lib/heroes'
import { getEquippedBonuses, getSetBonus } from "@/lib/items"

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
    const itemBonus = getEquippedBonuses(hero.equippedItems)
    const setBonus = getSetBonus(hero.equippedItems)

    return {
      base: { atk: hero.attack, def: hero.defense, spd: hero.speed },
      itemBonus,
      setBonus,
      total: {
        atk: hero.attack + itemBonus.atk + setBonus.atk,
        def: hero.defense + itemBonus.def + setBonus.def,
        spd: hero.speed + itemBonus.spd + setBonus.spd,
      },
    }
  }, [hero])

  const oppEff = useMemo(() => {
    const itemBonus = getEquippedBonuses(opponent.equippedItems)
    const setBonus = getSetBonus(opponent.equippedItems)

    return {
      base: { atk: opponent.attack, def: opponent.defense, spd: opponent.speed },
      itemBonus,
      setBonus,
      total: {
        atk: opponent.attack + itemBonus.atk + setBonus.atk,
        def: opponent.defense + itemBonus.def + setBonus.def,
        spd: opponent.speed + itemBonus.spd + setBonus.spd,
      },
    }
  }, [opponent])

  const plannedWinner: Side = useMemo(() => {
    const heroScore = heroEff.total.atk + heroEff.total.def + heroEff.total.spd
    const oppScore = oppEff.total.atk + oppEff.total.def + oppEff.total.spd
    return heroScore >= oppScore ? 'hero' : 'opponent'
  }, [heroEff, oppEff])

  const [round, setRound] = useState(0)
  const [heroHp, setHeroHp] = useState(100)
  const [oppHp, setOppHp] = useState(100)
  const [activeHit, setActiveHit] = useState<Side | null>(null)
  const [hitPop, setHitPop] = useState<{ side: Side; amount: number; k: number } | null>(null)
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
    setLog([
      `Battle started!`,
      heroEff.setBonus.setName
        ? `Equipped: FULL SET (${heroEff.setBonus.setName})`
        : hero.equippedItems && Object.keys(hero.equippedItems).length
          ? `Equipped: ${Object.values(hero.equippedItems).filter(Boolean).length} items`
          : `No items equipped`,
    ])

    const heroBias = plannedWinner === 'hero' ? 1 : -1
    const oppBias = plannedWinner === 'opponent' ? 1 : -1

    const heroBase = Math.max(6, Math.floor(heroEff.total.atk * 0.65 - oppEff.total.def * 0.25 + heroEff.total.spd * 0.1))
    const oppBase = Math.max(6, Math.floor(oppEff.total.atk * 0.65 - heroEff.total.def * 0.25 + oppEff.total.spd * 0.1))

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
        const dmg = heroDmg[r - 1]
        setRound(r)
        setActiveHit('opponent')
        setHitPop({ side: 'opponent', amount: dmg, k: Date.now() + r })
        setOppHp((hp) => Math.max(0, hp - dmg))
        setLog((l) => [...l, `Round ${r}: ${hero.name} hits for ${dmg}`])
      }, baseT + 250)

      push(() => {
        setActiveHit(null)
        setHitPop(null)
      }, baseT + 520)

      push(() => {
        const dmg = oppDmg[r - 1]
        setActiveHit('hero')
        setHitPop({ side: 'hero', amount: dmg, k: Date.now() + r + 10 })
        setHeroHp((hp) => Math.max(0, hp - dmg))
        setLog((l) => [...l, `Round ${r}: ${opponent.name} hits for ${dmg}`])
      }, baseT + 700)

      push(() => {
        setActiveHit(null)
        setHitPop(null)
      }, baseT + 950)
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
    const pop = hitPop?.side === side ? hitPop : null

    return (
      <div
        className={`relative w-[170px] p-3 rounded-2xl border-2 bg-gray-950/60 ${rarityBorder[h.rarity]} ${
          winner === side ? 'ring-2 ring-yellow-300' : ''
        } ${hit ? 'battle-hit battle-flash' : ''} ${eff.setBonus.setName ? 'border-[#f97316] shadow-[0_0_22px_#f97316]' : ''}`}
      >
        {pop ? (
          <div key={pop.k} className="battle-dmg-pop">
            -{pop.amount}
          </div>
        ) : null}
        <div className="text-xs text-gray-400">{side === 'hero' ? 'You' : 'Enemy'}</div>
        <div className="text-sm font-extrabold truncate">{h.name}</div>

        {eff.setBonus.setName && (
          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold text-[#f97316] border border-[#f97316]/60 bg-[#f97316]/10 px-2 py-0.5 rounded-full">
            🔥 FULL SET BONUS • {eff.setBonus.setName}
          </div>
        )}

        <div className="mt-2 flex items-center gap-3">
          <div className={`w-14 h-14 rounded-xl overflow-hidden border ${rarityBorder[h.rarity]}`}>
            <img src={h.imageUrl} alt={h.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-300">
              ATK {eff.base.atk}{" "}
              {(eff.itemBonus.atk > 0 || eff.setBonus.atk > 0) && (
                <>
                  <span className="text-green-400">[+{eff.itemBonus.atk}]</span>
                  {eff.setBonus.atk > 0 && <span className="text-[#f97316]">[+{eff.setBonus.atk}]</span>}
                </>
              )}
            </div>
            <div className="text-[11px] text-gray-300">
              DEF {eff.base.def}{" "}
              {(eff.itemBonus.def > 0 || eff.setBonus.def > 0) && (
                <>
                  <span className="text-green-400">[+{eff.itemBonus.def}]</span>
                  {eff.setBonus.def > 0 && <span className="text-[#f97316]">[+{eff.setBonus.def}]</span>}
                </>
              )}
            </div>
            <div className="text-[11px] text-gray-300">
              SPD {eff.base.spd}{" "}
              {(eff.itemBonus.spd > 0 || eff.setBonus.spd > 0) && (
                <>
                  <span className="text-green-400">[+{eff.itemBonus.spd}]</span>
                  {eff.setBonus.spd > 0 && <span className="text-[#f97316]">[+{eff.setBonus.spd}]</span>}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2">{hpBar(hp)}</div>

        {side === 'hero' && hero.equippedItems && Object.values(hero.equippedItems).some(Boolean) && (
          <div className="mt-2 text-[10px] text-cyan-200 space-y-0.5">
            {Object.entries(hero.equippedItems)
              .filter(([, v]) => !!v)
              .map(([slot, it]: any) => (
                <div key={slot}>
                  • {String(slot).toUpperCase()}: {it.imageEmoji} {it.name}
                  {it.set ? <span className="text-[#f97316]"> ({it.set})</span> : null}
                </div>
              ))}
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
