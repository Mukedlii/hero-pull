"use client"

import { useEffect, useMemo, useState } from "react"
import { coerceHero, type Hero } from "@/lib/heroes"
import { getEquippedBonuses, getSetBonus } from "@/lib/items"

type Rune = { id: string; icon: string; name: string; power: number; kind: "strike" | "guard" | "fire" | "heal" | "gold" | "frost" }
type Enemy = { name: string; icon: string; hp: number; maxHp: number; attack: number; boss: boolean }
type Relic = { id: string; icon: string; name: string; text: string; kind: "power" | "health" | "defense" | "gold" | "fire"; value: number }

const HERO_KEY = "hero-pull-current-hero"
const PROGRESS_KEY = "hero-pull-rift-progress-v1"
const RUNES: Rune[] = [
  { id: "strike", icon: "⚔️", name: "Blade Rune", power: 5, kind: "strike" },
  { id: "guard", icon: "🛡️", name: "Aegis Rune", power: 3, kind: "guard" },
  { id: "fire", icon: "🔥", name: "Ember Rune", power: 7, kind: "fire" },
  { id: "heal", icon: "💚", name: "Mender Rune", power: 0, kind: "heal" },
  { id: "gold", icon: "💎", name: "Soul Shard", power: 0, kind: "gold" },
  { id: "frost", icon: "❄️", name: "Frost Rune", power: 0, kind: "frost" },
]
const ENEMIES = [
  ["Gloomfang", "🐺", 38, 7], ["Mire Troll", "👹", 52, 9], ["Bone Knight", "💀", 68, 11],
  ["Rift Stalker", "🦂", 86, 13], ["Abyss Drake", "🐉", 112, 16], ["The Hollow King", "👑", 150, 19],
] as const
const BOSS_RELICS: Relic[] = [
  { id: "void-heart", icon: "🖤", name: "Void Heart", text: "+30 maximum HP and heal 30", kind: "health", value: 30 },
  { id: "infernal-core", icon: "🌋", name: "Infernal Core", text: "+9 Ember Rune damage", kind: "fire", value: 9 },
  { id: "titan-sigil", icon: "🗿", name: "Titan Sigil", text: "+7 defense", kind: "defense", value: 7 },
  { id: "king-coffer", icon: "👑", name: "King's Coffer", text: "+10 gold after every victory", kind: "gold", value: 10 },
]
const RELICS: Relic[] = [
  { id: "fang", icon: "🐉", name: "Dragon Fang", text: "+4 hero power", kind: "power", value: 4 },
  { id: "heart", icon: "💚", name: "Heartstone", text: "+18 maximum HP and heal 18", kind: "health", value: 18 },
  { id: "aegis", icon: "🛡️", name: "Ancient Aegis", text: "+3 defense", kind: "defense", value: 3 },
  { id: "ember", icon: "🔥", name: "Ashen Lens", text: "+5 Ember Rune damage", kind: "fire", value: 5 },
  { id: "coin", icon: "💎", name: "Gilded Sigil", text: "+5 gold after every victory", kind: "gold", value: 5 },
]

function int(v: unknown, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback
}
function enemyFor(floor: number): Enemy {
  const base = ENEMIES[Math.min(floor - 1, ENEMIES.length - 1)]
  const chapter = Math.floor((floor - 1) / ENEMIES.length)
  const boss = floor % 5 === 0
  const bossNames = ["The Hollow King", "Ash Tyrant", "The Rift Maw", "Dread Empress"]
  const bossIcons = ["👑", "🔥", "🐲", "🧿"]
  const normalHp = base[2] + chapter * 24
  const hp = Math.floor(normalHp * (boss ? 1.8 : 1))
  const attack = Math.floor((base[3] + chapter * 2) * (boss ? 1.35 : 1))
  const index = (Math.floor(floor / 5) - 1) % bossNames.length
  return { name: boss ? bossNames[index] : base[0], icon: boss ? bossIcons[index] : base[1], hp, maxHp: hp, attack, boss }
}
function shuffle<T,>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export default function ArenaBattlePage() {
  const [hero, setHero] = useState<Hero | null>(null)
  const [heroError, setHeroError] = useState("")
  const [floor, setFloor] = useState(1)
  const [gold, setGold] = useState(8)
  const [hp, setHp] = useState(100)
  const [maxHp, setMaxHp] = useState(100)
  const [powerBonus, setPowerBonus] = useState(0)
  const [defenseBonus, setDefenseBonus] = useState(0)
  const [fireBonus, setFireBonus] = useState(0)
  const [goldBonus, setGoldBonus] = useState(0)
  const [enemy, setEnemy] = useState<Enemy>(() => enemyFor(1))
  const [rolled, setRolled] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [runes, setRunes] = useState<Rune[]>([])
  const [guard, setGuard] = useState(0)
  const [weakened, setWeakened] = useState(false)
  const [enemyStunned, setEnemyStunned] = useState(false)
  const [skillCooldown, setSkillCooldown] = useState(0)
  const [teamPower, setTeamPower] = useState(0)
  const [relics, setRelics] = useState<Relic[]>([])
  const [choices, setChoices] = useState<Relic[]>([])
  const [nemesisRune, setNemesisRune] = useState<string | null>(null)
  const [runeUse, setRuneUse] = useState<Record<string, number>>({})
  const [log, setLog] = useState<string[]>(["The Arena is open. Your selected Hero has been summoned."])
  const [finished, setFinished] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HERO_KEY)
      const parsed = raw ? coerceHero(JSON.parse(raw)) : null
      if (!parsed) {
        setHeroError("No active hero found. Open Heroes, choose a hero, then tap Use in Arena.")
        return
      }
      setHero(parsed)
      const item = getEquippedBonuses(parsed.equippedItems)
      const set = getSetBonus(parsed.equippedItems)
      const heroHp = Math.min(500, 70 + parsed.health * 2 + parsed.defense + item.def + set.def)
      setMaxHp(heroHp)
      setHp(heroHp)
      setLog([parsed.name + " enters the Arena. " + parsed.rarity + " hero • Level " + parsed.level + "."])
      const saved = localStorage.getItem(PROGRESS_KEY)
      if (saved) {
        const p = JSON.parse(saved)
        if (Number.isFinite(p.bestFloor)) setLog((prev) => ["Best Rift floor: " + p.bestFloor + ".", ...prev])
      }
    } catch {
      setHeroError("Could not read the selected hero. Please select it again in Heroes.")
    }
  }, [])

  const stats = useMemo(() => {
    if (!hero) return { power: 10, defense: 0, luck: 0 }
    const item = getEquippedBonuses(hero.equippedItems)
    const set = getSetBonus(hero.equippedItems)
    return {
      power: hero.power + item.pwr + set.pwr + powerBonus,
      defense: hero.defense + item.def + set.def + defenseBonus,
      luck: hero.luck + item.lck + set.lck,
    }
  }, [hero, powerBonus, defenseBonus])

  const addLog = (line: string) => setLog((old) => [line, ...old].slice(0, 9))

  const spin = () => {
    if (busy || rolled || finished || choices.length > 0 || gold < 2) return
    setBusy(true)
    setSpinning(true)
    setGold((v) => v - 2)
    let ticks = 0
    const timer = window.setInterval(() => {
      setRunes(Array.from({ length: 3 }, () => RUNES[Math.floor(Math.random() * RUNES.length)]))
      ticks += 1
      if (ticks >= 12) {
        window.clearInterval(timer)
        const result = Array.from({ length: 3 }, () => RUNES[Math.floor(Math.random() * RUNES.length)])
        const counts = result.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.id]: (acc[r.id] || 0) + 1 }), {})
        let damage = 0
        let block = 0
        let heal = 0
        let extraGold = 0
        let frost = false
        const uses = { ...runeUse }
        result.forEach((r) => {
          if (r.kind === "strike") { damage += r.power; uses.strike = (uses.strike || 0) + 1 }
          if (r.kind === "fire") { damage += r.power + fireBonus; uses.fire = (uses.fire || 0) + 1 }
          if (r.kind === "guard") block += r.power
          if (r.kind === "heal") heal += 12
          if (r.kind === "gold") extraGold += 3
          if (r.kind === "frost") frost = true
        })
        let combo = 0
        Object.values(counts).forEach((n) => { if (n >= 2) combo += n === 3 ? 18 : 8 })
        if (nemesisRune && result.some((r) => r.id === nemesisRune)) damage = Math.floor(damage * 0.6)
        damage += combo
        setEnemy((e) => ({ ...e, hp: Math.max(0, e.hp - damage) }))
        setGuard(block)
        setWeakened(frost)
        setHp((v) => Math.min(maxHp, v + heal))
        setGold((v) => v + extraGold)
        setTeamPower(damage)
        setRuneUse(uses)
        setRunes(result)
        setRolled(true)
        setSpinning(false)
        setBusy(false)
        addLog("Runes dealt " + damage + " damage" + (combo ? " including " + combo + " combo damage" : "") + (block ? ", gained " + block + " guard" : "") + (heal ? ", restored " + heal + " HP" : "") + (extraGold ? ", found " + extraGold + " gold" : "") + (frost ? ", Frost weakened the enemy" : "") + ".")
      }
    }, 90)
  }

  const battle = () => {
    if (!rolled || busy || finished || choices.length > 0) return
    setBusy(true)
    const afterRuneHp = enemy.hp
    if (afterRuneHp <= 0) {
      winFloor()
      return
    }
    const critChance = Math.min(0.45, 0.05 + stats.luck / 500)
    const crit = Math.random() < critChance
    const damage = Math.max(3, Math.floor(stats.power * (0.32 + Math.random() * 0.12) * (crit ? 1.8 : 1)))
    const remaining = Math.max(0, afterRuneHp - damage)
    setEnemy((e) => ({ ...e, hp: remaining }))
    if (remaining <= 0) {
      addLog("Critical strike! " + hero?.name + " defeats " + enemy.name + ".")
      winFloor()
      return
    }
    const baseIncoming = Math.max(1, enemy.attack - Math.floor(stats.defense * 0.12) - guard)
    const incoming = enemyStunned ? 0 : Math.max(1, weakened ? Math.floor(baseIncoming * 0.65) : baseIncoming)
    const nextHp = Math.max(0, hp - incoming)
    setHp(nextHp)
    addLog((crit ? "CRITICAL! " : "") + hero?.name + " strikes for " + damage + ". " + enemy.name + " counters for " + incoming + ".")
    setRolled(false)
    setGuard(0)
    setWeakened(false)
    setEnemyStunned(false)
    setSkillCooldown((value) => Math.max(0, value - 1))
    setTeamPower(0)
    if (nextHp <= 0) {
      setFinished(true)
      addLog("Your hero has fallen. Start a new run to challenge the Arena again.")
    } else {
      setEnemy((e) => ({ ...e, hp: remaining }))
    }
    setBusy(false)
  }

  const winFloor = () => {
    const reward = enemy.boss ? 12 : 4
    setBusy(false)
    setRolled(false)
    setGuard(0)
    setWeakened(false)
    setEnemyStunned(false)
    setSkillCooldown(0)
    setTeamPower(0)
    setGold((v) => v + reward + goldBonus)
    const nextFloor = floor + 1
    setFloor(nextFloor)
    const nextEnemy = enemyFor(nextFloor)
    if (nextFloor % 3 === 0) {
      const uses = { ...runeUse }
      const preferred = Object.entries(uses).sort((a, b) => b[1] - a[1])[0]?.[0]
      setNemesisRune(preferred || null)
      addLog("NEMESIS ALERT: the next guardian is adapting to your " + (preferred || "runes") + " strategy.")
    } else {
      setNemesisRune(null)
    }
    setEnemy(nextEnemy)
    setChoices(shuffle(enemy.boss ? BOSS_RELICS : RELICS).slice(0, 3))
    addLog((enemy.boss ? "BOSS DEFEATED! " : "Floor cleared! ") + "+" + (reward + goldBonus) + " gold. Choose a relic.")
  }

  const useAbility = () => {
    if (!hero || !rolled || busy || finished || choices.length > 0 || skillCooldown > 0 || enemy.hp <= 0) return
    const ability = hero.ability.toLowerCase()
    const isHeal = /heal|healing|oracle|priest|mender/.test(ability)
    const isShield = /shield|guard|barrier|defen|freeze|prison|time/.test(ability)
    const isControl = /freeze|prison|time|control|gravity|invisibility|telekinesis/.test(ability)
    const isDrain = /drain|blood|vampir|reaper/.test(ability)
    const isFire = /fire|inferno|meteor|plasma|elemental|lightning|thunder|hellfire/.test(ability)
    const damage = Math.max(8, Math.floor(stats.power * (isFire ? 1.45 : isDrain ? 0.9 : 1.15)))
    if (isHeal) {
      const amount = Math.max(12, Math.floor(maxHp * 0.22))
      setHp((value) => Math.min(maxHp, value + amount))
      addLog(hero.ability + ": restored " + amount + " HP.")
    } else if (isShield) {
      const amount = Math.max(8, Math.floor(stats.defense * 0.7) + 8)
      setGuard((value) => value + amount)
      if (isControl) setEnemyStunned(true)
      addLog(hero.ability + ": gained " + amount + " guard" + (isControl ? " and stunned the enemy" : "") + ".")
    } else {
      setEnemy((value) => ({ ...value, hp: Math.max(0, value.hp - damage) }))
      if (isDrain) {
        const amount = Math.max(6, Math.floor(damage * 0.35))
        setHp((value) => Math.min(maxHp, value + amount))
        addLog(hero.ability + ": dealt " + damage + " damage and drained " + amount + " HP.")
      } else {
        if (isControl) setEnemyStunned(true)
        addLog(hero.ability + ": dealt " + damage + " ability damage" + (isControl ? " and stunned the enemy" : "") + ".")
      }
    }
    setSkillCooldown(2)
  }

  const chooseRelic = (r: Relic) => {
    if (!choices.some((choice) => choice.id === r.id)) return
    setRelics((old) => [...old, r])
    if (r.kind === "power") setPowerBonus((v) => v + r.value)
    if (r.kind === "health") { setMaxHp((v) => v + r.value); setHp((v) => Math.min(maxHp + r.value, v + r.value)) }
    if (r.kind === "defense") setDefenseBonus((v) => v + r.value)
    if (r.kind === "fire") setFireBonus((v) => v + r.value)
    if (r.kind === "gold") setGoldBonus((v) => v + r.value)
    setChoices([])
    addLog("Relic claimed: " + r.name + ".")
  }

  const restart = () => {
    setFloor(1); setGold(8); setRelics([]); setPowerBonus(0); setDefenseBonus(0); setFireBonus(0); setGoldBonus(0)
    setEnemy(enemyFor(1)); setRolled(false); setSpinning(false); setGuard(0); setWeakened(false); setEnemyStunned(false); setSkillCooldown(0); setTeamPower(0); setNemesisRune(null)
    setRuneUse({}); setChoices([]); setFinished(false); setLog(["A new expedition begins."])
    if (hero) { const item = getEquippedBonuses(hero.equippedItems); const set = getSetBonus(hero.equippedItems); const h = Math.min(500, 70 + hero.health * 2 + hero.defense + item.def + set.def); setMaxHp(h); setHp(h) }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY)
      const prev = raw ? JSON.parse(raw) : {}
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ bestFloor: Math.max(int(prev.bestFloor, 0), floor), updatedAt: new Date().toISOString() }))
    } catch {}
  }, [floor])

  if (heroError) {
    return <div className="px-4 pb-24 pt-8 text-center">
      <h1 className="text-2xl font-black text-purple-300">Riftbound Arena</h1>
      <p className="text-sm text-gray-400 mt-3">{heroError}</p>
      <a href="/collection" className="inline-block mt-5 bg-purple-700 rounded-xl px-5 py-3 font-bold">Choose a Hero</a>
      <a href="/arena" className="block mt-4 text-xs text-gray-500 underline">Back to Arena</a>
    </div>
  }

  const hpPercent = Math.max(0, Math.min(100, (hp / Math.max(1, maxHp)) * 100))
  const enemyPercent = Math.max(0, Math.min(100, (enemy.hp / Math.max(1, enemy.maxHp)) * 100))

  return (
    <div className="px-4 pb-28 pt-5">
      <div className="flex items-center justify-between gap-2">
        <a href="/collection" className="text-xs text-gray-400 underline">← Heroes</a>
        <a href="/pvp" className="text-xs text-fuchsia-300 underline">Live PvP →</a>
        <span className="text-[10px] tracking-[2px] text-purple-300 font-extrabold">ARENA · RUNE COMBAT</span>
      </div>
      <h1 className="text-3xl font-black text-center mt-3 bg-gradient-to-r from-purple-300 via-fuchsia-300 to-yellow-200 bg-clip-text text-transparent">ARENA</h1>
      <p className="text-center text-xs text-gray-500 mt-1">Your active champion enters the Rune Arena.</p>

      <div className="grid grid-cols-3 gap-2 mt-5">
        <div className="rounded-xl border border-yellow-700/40 bg-yellow-950/20 p-2 text-center"><div className="text-[9px] text-yellow-300">GOLD</div><b>{gold}</b></div>
        <div className="rounded-xl border border-purple-700/40 bg-purple-950/20 p-2 text-center"><div className="text-[9px] text-purple-300">FLOOR</div><b>{floor}</b></div>
        <div className="rounded-xl border border-cyan-700/40 bg-cyan-950/20 p-2 text-center"><div className="text-[9px] text-cyan-300">RELICS</div><b>{relics.length}</b></div>
      </div>

      <div className="mt-4 rounded-2xl border border-purple-700/60 bg-gradient-to-br from-[#251631] via-gray-900 to-[#101322] p-4 shadow-[0_0_28px_rgba(139,92,246,0.12)]">
        <div className="flex items-center gap-3">
          <img src={hero?.imageUrl || "/og.png"} alt={hero?.name || "Hero"} className="w-16 h-16 rounded-xl object-cover border border-purple-400/50" />
          <div className="min-w-0 flex-1">
            <div className="text-[9px] tracking-widest text-purple-300">YOUR CHAMPION · {hero?.rarity?.toUpperCase()}</div>
            <b className="block truncate">{hero?.name}</b>
            <div className="text-[10px] text-gray-400">Lv.{hero?.level} · {hero?.ability}</div>
            <div className="text-[10px] text-gray-300 mt-1">PWR {stats.power} · DEF {stats.defense} · LCK {stats.luck}</div>
          </div>
        </div>
        <div className="mt-3 flex justify-between text-[10px] text-gray-400"><span>HERO HP</span><span>{hp}/{maxHp}</span></div>
        <div className="h-2 rounded-full bg-gray-800 overflow-hidden mt-1"><div className="h-full bg-gradient-to-r from-red-600 to-amber-400 transition-all" style={{ width: hpPercent + "%" }} /></div>
      </div>

      <div className="mt-4 rounded-2xl border border-red-900/70 bg-gradient-to-br from-[#2a1726] to-gray-950 p-4">
        <div className="flex items-center justify-between"><div><div className="text-[9px] tracking-widest text-red-300">ARENA OPPONENT</div><b>{enemy.name}</b></div><div className="text-4xl">{enemy.icon}</div></div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-3"><span>ENEMY HP</span><span>{enemy.hp}/{enemy.maxHp}</span></div>
        <div className="h-2 rounded-full bg-gray-800 overflow-hidden mt-1"><div className="h-full bg-red-500 transition-all" style={{ width: enemyPercent + "%" }} /></div>
        <div className="text-[10px] text-gray-500 mt-2">{enemy.boss ? "☠ BOSS ENCOUNTER · " : ""}Attack {enemy.attack}{nemesisRune ? " · Nemesis resists your " + (nemesisRune === "strike" ? "Blade" : "Ember") + " rune" : ""}{enemyStunned ? " · STUNNED" : ""}{weakened ? " · WEAKENED" : ""}</div>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-800 bg-gray-900/80 p-4">
        <div className="flex items-center justify-between"><h2 className="text-xs font-extrabold tracking-widest text-yellow-300">✦ RUNE ENGINE</h2><span className="text-[10px] text-gray-500">2 GOLD / SPIN</span></div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[0,1,2].map((i) => <div key={i} className={`h-24 rounded-xl border border-purple-500/50 bg-gradient-to-b from-purple-950 to-gray-950 flex flex-col items-center justify-center ${spinning ? "animate-pulse" : ""}`}><span className="text-3xl">{runes[i]?.icon || "✧"}</span><span className="text-[9px] text-gray-400 mt-1">{runes[i]?.name || "RUNE"}</span></div>)}
        </div>
        {nemesisRune && <p className="text-[10px] text-cyan-300 mt-2">Nemesis adaptation active: matching attack rune damage is reduced by 40%.</p>}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button disabled={rolled || spinning || finished || choices.length > 0 || gold < 2} onClick={spin} className="rounded-xl py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-xs font-black disabled:opacity-40">{spinning ? "RUNES SPINNING…" : "✦ SPIN RUNES"}</button>
          <button disabled={!rolled || spinning || busy || finished || choices.length > 0} onClick={battle} className="rounded-xl py-3 bg-gradient-to-r from-red-600 to-fuchsia-700 text-white text-xs font-black disabled:opacity-40">⚔ STRIKE</button>
        </div>
        <button disabled={!rolled || spinning || busy || finished || choices.length > 0 || skillCooldown > 0 || enemy.hp <= 0} onClick={useAbility} className="w-full mt-2 rounded-xl border border-cyan-500/40 bg-cyan-950/50 py-3 text-xs font-bold text-cyan-200 disabled:opacity-40">{skillCooldown > 0 ? hero?.ability + " · COOLDOWN " + skillCooldown : "✧ USE HERO ABILITY · " + (hero?.ability || "SPECIAL SKILL")}</button>
        <p className="text-[10px] text-gray-500 mt-2">Matching runes trigger combo damage. Frost weakens the counterattack; your hero ability adds a tactical skill with a short cooldown.</p>
      </div>

      {choices.length > 0 && <div className="mt-4 rounded-2xl border border-yellow-700/50 bg-yellow-950/10 p-4"><h2 className="text-xs font-extrabold text-yellow-300 tracking-widest">VICTORY · CHOOSE A RELIC</h2><div className="grid grid-cols-1 gap-2 mt-3">{choices.map((r) => <button key={r.id} onClick={() => chooseRelic(r)} className="text-left rounded-xl border border-yellow-700/30 bg-gray-950/80 p-3 hover:border-yellow-400"><span className="text-xl mr-2">{r.icon}</span><b className="text-sm">{r.name}</b><div className="text-[10px] text-gray-400 ml-8">{r.text}</div></button>)}</div></div>}

      {relics.length > 0 && <div className="mt-4 rounded-xl border border-gray-800 bg-gray-950/70 p-3"><div className="text-[10px] text-yellow-300 font-bold tracking-widest">YOUR RELICS</div><div className="flex flex-wrap gap-2 mt-2">{relics.map((r, i) => <span key={r.id + i} className="text-[10px] rounded-full border border-yellow-700/40 px-2 py-1">{r.icon} {r.name}</span>)}</div></div>}

      <div className="mt-4 rounded-xl border border-gray-800 bg-black/40 p-3"><div className="text-[10px] font-bold text-gray-300 tracking-widest">BATTLE LOG</div><div className="mt-2 space-y-1">{log.map((line, i) => <div key={i} className="text-[10px] text-gray-400">{line}</div>)}</div></div>
      {finished && <div className="mt-4 rounded-xl border border-red-800 bg-red-950/30 p-4 text-center"><b className="text-red-300">YOUR HERO HAS FALLEN</b><button onClick={restart} className="block w-full mt-3 rounded-xl bg-purple-700 py-3 font-bold text-sm">Start New Run</button></div>}
      {!finished && <button onClick={restart} className="w-full mt-4 text-xs text-gray-500 underline">Restart battle</button>}
      <a href="/collection" className="block text-center text-xs text-purple-300 underline mt-4">Change active hero</a>
    </div>
  )
}
