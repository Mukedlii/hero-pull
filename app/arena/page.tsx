"use client"

import { useEffect, useState } from "react"
import type { Hero } from "@/lib/heroes"
import { loadGold } from "@/lib/gold"

const challengers = [
  { id: "frost-queen", name: "Frost Queen", subtitle: "The Glacial Empress", level: 38, power: 98700, gold: 8500, gems: 75, trophies: 12, image: "/arena/frost-queen.webp", accent: "border-cyan-300/40" },
  { id: "lich-king", name: "Lich King", subtitle: "Lord of the Forgotten", level: 40, power: 112300, gold: 9200, gems: 80, trophies: 15, image: "/arena/lich-king.webp", accent: "border-blue-300/40" },
  { id: "iron-warlord", name: "Iron Warlord", subtitle: "Breaker of Oaths", level: 42, power: 118900, gold: 10000, gems: 90, trophies: 18, image: "/arena/iron-warlord.webp", accent: "border-amber-300/40" },
]
const number = (v: number) => new Intl.NumberFormat("en-US").format(v)

export default function ArenaLobbyPage() {
  const [hero, setHero] = useState<Hero | null>(null)
  const [gold, setGold] = useState(0)
  const [tab, setTab] = useState("Arena")
  useEffect(() => {
    try {
      const raw = localStorage.getItem("hero-pull-current-hero")
      if (raw) setHero(JSON.parse(raw) as Hero)
      setGold(loadGold())
    } catch { setHero(null) }
  }, [])
  const playerName = hero?.name || "Mukedlii"
  const power = hero ? hero.power + hero.defense : 125400
  const portrait = hero?.imageUrl || "/arena/player-warden.webp"

  return <main className="relative isolate min-h-screen overflow-hidden bg-[#070b18] px-3 pb-28 pt-4 text-white sm:px-5 sm:pt-6">
    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_14%_22%,rgba(37,99,235,.3),transparent_38%),radial-gradient(ellipse_at_88%_12%,rgba(147,51,234,.25),transparent_34%),linear-gradient(180deg,#101b36,#080d1b_55%,#050812)]" />
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-3">
      <a href="/" className="flex min-w-0 items-center gap-2">
        <span className="text-xl font-black uppercase leading-[.8] text-amber-300 sm:text-2xl">HERO<br/>PULL</span>
        <span className="h-11 w-11 overflow-hidden rounded-full border-2 border-amber-300/70 bg-slate-900"><img src={portrait} alt={playerName} className="h-full w-full object-cover"/></span>
        <span className="min-w-0"><b className="block text-xs text-amber-200">Lv. {hero?.level || 1}</b><span className="block max-w-28 truncate text-xs">{playerName}</span><span className="mt-1 block h-1.5 w-20 overflow-hidden rounded-full bg-slate-700"><span className="block h-full w-2/3 bg-sky-400"/></span></span>
      </a>
      <div className="rounded-full border border-amber-300/30 bg-black/45 px-3 py-2 text-xs font-bold text-amber-100 sm:px-4 sm:text-sm">🪙 {number(gold)}</div>
    </header>

    <section className="mx-auto mt-6 max-w-6xl">
      <div className="grid items-end gap-5 lg:grid-cols-[minmax(260px,34%)_1fr]">
        <div className="relative mx-auto flex w-full max-w-[390px] items-end justify-center lg:row-span-4 lg:mx-0 lg:max-w-none">
          <div className="pointer-events-none absolute inset-x-4 bottom-8 h-64 rounded-full bg-blue-500/20 blur-3xl"/>
          <img src="/arena/player-warden.webp" alt="Arena champion" className="relative max-h-[440px] w-full object-contain object-bottom drop-shadow-[0_20px_40px_rgba(30,64,175,.42)]"/>
          <div className="absolute inset-x-2 bottom-2 rounded-2xl border border-amber-300/35 bg-[#080e20]/90 p-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.22em] text-amber-300">Your Power</div><div className="text-2xl font-black sm:text-3xl">{number(power)}</div></div><a href="/collection" className="rounded-xl border border-sky-300/60 bg-gradient-to-b from-sky-500 to-blue-800 px-4 py-3 text-xs font-black sm:px-6">👥 Edit Team</a></div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 lg:pt-2">
          <div><p className="text-center text-[10px] font-bold uppercase tracking-[.32em] text-amber-200/80 lg:text-left">Prove your strength and climb the ranks!</p><h1 className="mt-1 text-center text-4xl font-black tracking-[.08em] text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-600 lg:text-left sm:text-5xl">ARENA</h1></div>
          <div className="flex items-center gap-3 rounded-2xl border border-fuchsia-400/40 bg-gradient-to-r from-amber-950/70 to-fuchsia-950/70 px-4 py-2"><span className="text-3xl">🛡️</span><span><b className="block text-sm text-amber-200">Gold League</b><span className="text-xs">Rank #247</span></span></div>
        </div>

        <div className="flex gap-1 rounded-xl border border-amber-300/25 bg-black/50 p-1">
          {["Arena","Rankings","Rewards","Season"].map(item => <button key={item} onClick={() => setTab(item)} className={`flex-1 rounded-lg px-2 py-2.5 text-[11px] font-bold sm:text-sm ${tab === item ? "bg-gradient-to-b from-amber-400 to-amber-700 text-black" : "text-slate-300 hover:bg-white/10"}`}>{item === "Arena" ? "⚔ " : item === "Rankings" ? "🏆 " : item === "Rewards" ? "🎁 " : "👑 "}{item}</button>)}
        </div>

        {tab === "Arena" ? <div className="space-y-2.5">
          {challengers.map(enemy => <article key={enemy.id} className="grid grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-slate-500/40 bg-gradient-to-r from-[#101a31]/95 via-[#0b1325]/95 to-[#090e1b]/95 p-2.5 sm:grid-cols-[104px_minmax(0,1fr)_auto] sm:gap-4 sm:p-3">
            <div className={`h-[76px] overflow-hidden rounded-xl border bg-slate-950 sm:h-24 ${enemy.accent}`}><img src={enemy.image} alt={enemy.name} className="h-full w-full object-cover"/></div>
            <div className="min-w-0"><h2 className="truncate text-sm font-black sm:text-lg">{enemy.name}</h2><p className="truncate text-[10px] text-slate-400 sm:text-xs">{enemy.subtitle}</p><p className="mt-1 text-[10px] text-slate-300">Lv. {enemy.level}</p><p className="text-sm font-black text-amber-300 sm:text-base">⚔ {number(enemy.power)}</p><div className="mt-1 flex flex-wrap gap-2 text-[9px] text-slate-300 sm:text-[10px]"><span>🪙 {number(enemy.gold)}</span><span>💎 {enemy.gems}</span><span>🏆 +{enemy.trophies}</span></div></div>
            <a href="/arena/fight" className="rounded-xl border border-amber-200/70 bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-800 px-3 py-3 text-xs font-black text-black shadow-[0_3px_0_#713f12] hover:brightness-110 sm:px-5 sm:text-sm">⚔ Fight</a>
          </article>)}
        </div> : <div className="rounded-2xl border border-amber-300/25 bg-black/45 p-5 text-center"><div className="text-3xl">{tab === "Rankings" ? "🏆" : tab === "Rewards" ? "🎁" : "👑"}</div><h2 className="mt-2 text-xl font-black text-amber-200">{tab}</h2><p className="mt-1 text-sm text-slate-300">{tab === "Rankings" ? "Win Arena battles to climb the league ladder." : tab === "Rewards" ? "Earn gold, gems and trophies through Arena victories." : "Season rewards are based on your final Arena rank."}</p><a href={tab === "Rewards" ? "/quests" : "/stats"} className="mt-4 inline-flex rounded-xl border border-amber-300/40 bg-amber-500/15 px-5 py-2 text-xs font-bold text-amber-200">Open {tab}</a></div>}

        <div className="grid grid-cols-3 gap-2 rounded-xl border border-amber-300/20 bg-black/55 p-3 text-center"><div><div className="text-[9px] uppercase tracking-wider text-slate-400">Daily Attempts</div><b className="text-sm text-fuchsia-300">3 / 5</b></div><div><div className="text-[9px] uppercase tracking-wider text-slate-400">Arena Mode</div><b className="text-sm text-amber-200">Rift Run</b></div><div><div className="text-[9px] uppercase tracking-wider text-slate-400">Season ends</div><b className="text-sm text-amber-200">12d 14h</b></div></div>
      </div>
    </section>

    <nav className="mx-auto mt-7 grid max-w-6xl grid-cols-4 gap-1 rounded-2xl border border-amber-300/25 bg-[#080d1c]/95 p-1.5 sm:grid-cols-8">
      {[["⌂","Home","/"],["⚔","Arena","/arena"],["♙","Heroes","/collection"],["🚪","Dungeon","/dungeon"],["📜","Quests","/quests"],["🎁","Shop","/shop"],["⚑","Guild","/stats"],["▥","Rankings","/stats"]].map(([icon,label,href]) => <a key={label} href={href} className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2.5 text-[10px] font-bold sm:text-xs ${label === "Arena" ? "border-amber-300/80 bg-gradient-to-b from-amber-500 to-amber-800 text-black" : "border-white/5 bg-slate-900/80 text-slate-300 hover:border-amber-300/40 hover:text-amber-200"}`}><span className="text-xl sm:text-2xl">{icon}</span>{label}</a>)}
    </nav>
  </main>
}
