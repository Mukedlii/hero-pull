"use client"

import { useEffect, useState } from "react"
import { coerceHero, generateHero, type Hero } from "@/lib/heroes"

const COLLECTION_KEY = "hero-pull-collection"
const CURRENT_HERO_KEY = "hero-pull-current-hero"
const LAST_FREE_KEY = "hero-pull-last-free"

function readCollection(): Hero[] {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(coerceHero).filter(Boolean) as Hero[] : []
  } catch {
    return []
  }
}

function savePulledHero(hero: Hero) {
  const collection = readCollection()
  collection.unshift(hero)
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection.slice(0, 500)))
  localStorage.setItem(CURRENT_HERO_KEY, JSON.stringify(hero))
}

export default function HeroPull() {
  const [hero, setHero] = useState<Hero | null>(null)
  const [isFreeAvailable, setFreeAvailable] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)
  const [collectionCount, setCollectionCount] = useState(0)
  const [shareStatus, setShareStatus] = useState("")

  useEffect(() => {
    const today = new Date().toDateString()
    setFreeAvailable(localStorage.getItem(LAST_FREE_KEY) !== today)
    setCollectionCount(readCollection().length)
    try {
      const current = localStorage.getItem(CURRENT_HERO_KEY)
      if (current) setHero(coerceHero(JSON.parse(current)))
    } catch {
      setHero(null)
    }
  }, [])

  const handlePull = async () => {
    if (!isFreeAvailable || isRevealing) return
    setIsRevealing(true)
    await new Promise(resolve => setTimeout(resolve, 850))
    const nextHero = generateHero()
    try {
      savePulledHero(nextHero)
      localStorage.setItem(LAST_FREE_KEY, new Date().toDateString())
      setCollectionCount(readCollection().length)
      setFreeAvailable(false)
      setHero(nextHero)
    } catch {
      setShareStatus("Could not save your hero. Check your browser storage.")
    } finally {
      setIsRevealing(false)
    }
  }

  const handleShare = async () => {
    if (!hero) return
    const text = `I pulled a ${hero.rarity} hero in Hero Pull! ⚔️ ${hero.name} — HP ${hero.health}, PWR ${hero.power}, DEF ${hero.defense}, LCK ${hero.luck}.`
    try {
      if (navigator.share) {
        await navigator.share({ title: "Hero Pull", text, url: window.location.origin })
        setShareStatus("Share opened.")
      } else {
        await navigator.clipboard.writeText(`${text} Play: ${window.location.origin}`)
        setShareStatus("Hero details copied.")
      }
    } catch {
      setShareStatus("Share cancelled.")
    }
  }

  const rarityColors: Record<string, string> = {
    Common: "border-gray-400 shadow-gray-500/20",
    Rare: "border-blue-500 shadow-blue-500/30",
    Epic: "border-purple-500 shadow-purple-500/30",
    Legendary: "border-yellow-400 shadow-yellow-400/40",
  }

  return (
    <div className="relative flex flex-col items-center gap-5 px-4 pt-7 pb-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.28),transparent_68%)]" />
      <div className="w-full text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-violet-300">Collect · Equip · Conquer</p>
        <h1 className="mt-2 text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-200 to-amber-200">HERO PULL</h1>
        <p className="mt-2 text-sm text-slate-400">Build your squad. Enter the arena. Become a legend.</p>
      </div>

      <div className="grid w-full grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
          <div className="text-xl font-black text-white">{collectionCount}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Heroes</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
          <div className="text-xl font-black text-white">4</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Stats</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
          <div className="text-xl font-black text-white">∞</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Battles</div>
        </div>
      </div>

      {!hero ? (
        <div className="w-full rounded-3xl border border-violet-400/20 bg-gradient-to-b from-violet-950/60 to-slate-950 p-6 text-center shadow-2xl shadow-violet-950/40">
          <div className="mx-auto mb-4 flex h-36 w-36 items-center justify-center rounded-full border border-violet-300/20 bg-[radial-gradient(circle,rgba(167,139,250,0.24),rgba(15,23,42,0.2)_65%)]">
            <span className="text-7xl drop-shadow-[0_0_24px_rgba(167,139,250,0.7)]">✦</span>
          </div>
          <h2 className="text-2xl font-black">Your legend begins here</h2>
          <p className="mt-2 text-sm text-slate-400">Open your first hero pack and start building your collection.</p>
          <button onClick={handlePull} disabled={!isFreeAvailable || isRevealing} className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            {isRevealing ? "REVEALING…" : isFreeAvailable ? "✦ OPEN FREE HERO PACK" : "FREE PACK ALREADY CLAIMED"}
          </button>
          {!isFreeAvailable && <p className="mt-3 text-xs text-slate-500">Your next free pack is available tomorrow.</p>}
        </div>
      ) : (
        <div className={`w-full overflow-hidden rounded-3xl border-2 bg-gradient-to-b from-slate-900 to-slate-950 p-5 text-center shadow-2xl ${rarityColors[hero.rarity] || rarityColors.Common}`}>
          <div className="mb-3 inline-flex rounded-full border border-white/10 bg-black/40 px-4 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-200">{hero.rarity}</div>
          <div className="relative mx-auto mb-4 aspect-square w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-800 shadow-xl">
            <img src={hero.imageUrl} alt={hero.name} className="h-full w-full object-contain" onError={e => { e.currentTarget.src = "/og.png" }} />
          </div>
          <h2 className="text-2xl font-black">{hero.name}</h2>
          <p className="mt-1 text-xs text-slate-400">{hero.gender} · {hero.ability}</p>
          <div className="mx-auto mt-5 grid max-w-xs grid-cols-2 gap-2 text-sm">
            {[[ "HP", hero.health, "text-rose-300" ], [ "PWR", hero.power, "text-orange-300" ], [ "DEF", hero.defense, "text-sky-300" ], [ "LCK", hero.luck, "text-emerald-300" ]].map(([label, value, color]) => (
              <div key={String(label)} className="rounded-lg border border-white/10 bg-black/30 p-3">
                <span className={`font-bold ${color}`}>{label}</span><span className="ml-2 font-black text-white">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button onClick={handleShare} className="rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-bold hover:bg-white/10">Share hero</button>
            <a href="/collection" className="rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500">My collection</a>
          </div>
          {shareStatus && <p className="mt-2 text-xs text-slate-400">{shareStatus}</p>}
          <p className="mt-4 text-[11px] text-slate-500">This hero is saved to your collection and selected as your active hero.</p>
        </div>
      )}

      <div className="grid w-full grid-cols-2 gap-3">
        <a href="/arena" className="rounded-2xl border border-rose-400/20 bg-gradient-to-br from-rose-950/70 to-slate-950 p-4 transition hover:border-rose-400/50">
          <div className="text-2xl">⚔️</div><div className="mt-2 font-black">Arena</div><div className="mt-1 text-xs text-slate-400">Fight and earn rewards</div>
        </a>
        <a href="/dungeon" className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-950/60 to-slate-950 p-4 transition hover:border-amber-400/50">
          <div className="text-2xl">🏰</div><div className="mt-2 font-black">Dungeon</div><div className="mt-1 text-xs text-slate-400">Explore and defeat bosses</div>
        </a>
      </div>
      <div className="mt-3 grid w-full grid-cols-2 gap-3">
        <a href="/season" className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-950/70 to-slate-950 p-4 transition hover:border-violet-400/50"><div className="text-2xl">🎖️</div><div className="mt-2 font-black">Season & Quests</div><div className="mt-1 text-xs text-slate-400">Daily and weekly challenges</div></a>
        <a href="/guilds" className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-950/60 to-slate-950 p-4 transition hover:border-amber-400/50"><div className="text-2xl">🛡️</div><div className="mt-2 font-black">Guild Hall</div><div className="mt-1 text-xs text-slate-400">Community and guild rankings</div></a>
      </div>

    </div>
  )
}
