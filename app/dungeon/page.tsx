"use client"

import { useEffect, useMemo, useState } from "react"
import type { Hero } from "@/lib/heroes"
import { getEquippedBonuses, getSetBonus } from "@/lib/items"
import { addItemToInventory } from "@/lib/inventory"
import { loadGold, saveGold } from "@/lib/gold"
import { awardBattlePoints } from "@/lib/score"
import { DUNGEON_LEVELS, getLevelConfig, randInt, roomTypeForFloor, type DungeonRoomType } from "@/lib/dungeonConfig"
import { DEFAULT_DUNGEON_PROGRESS, loadDungeonProgress, saveDungeonProgress, type DungeonProgress } from "@/lib/dungeonProgress"
import { generateItem } from "@/lib/items"

type RunState = {
  runId: string
  level: number
  floor: number
  roomType: DungeonRoomType
  score: number
  goldGained: number
  hero: {
    hp: number
    maxHp: number
    potions: number
  }
  enemy?: {
    name: string
    hp: number
    maxHp: number
    atk: number
    def: number
    spd: number
    isBoss: boolean
  }
  log: string[]
  finished: boolean
  victory?: boolean
}

const RUN_KEY = "hero-pull-dungeon-run-v2"

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function effectiveStats(hero: Hero) {
  const itemBonus = getEquippedBonuses(hero.equippedItems)
  const setBonus = getSetBonus(hero.equippedItems)
  return {
    atk: hero.attack + itemBonus.atk + setBonus.atk,
    def: hero.defense + itemBonus.def + setBonus.def,
    spd: hero.speed + itemBonus.spd + setBonus.spd,
    setName: setBonus.setName,
  }
}

function baseHp(hero: Hero) {
  const eff = effectiveStats(hero)
  const hp = 90 + Math.floor(hero.level * 6) + Math.floor(eff.def * 1.1)
  return clamp(hp, 80, 420)
}

function loadCurrentHero(): Hero | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("hero-pull-current-hero")
    return raw ? (JSON.parse(raw) as Hero) : null
  } catch {
    return null
  }
}

function makeEnemy(level: number, isBoss: boolean) {
  const cfg = getLevelConfig(level)
  const r = isBoss ? cfg.boss : cfg.enemy
  const name = isBoss ? cfg.boss.name : "Enemy"
  return {
    name,
    hp: randInt(r.hp[0], r.hp[1]),
    maxHp: randInt(r.hp[0], r.hp[1]),
    atk: randInt(r.atk[0], r.atk[1]),
    def: randInt(r.def[0], r.def[1]),
    spd: randInt(r.spd[0], r.spd[1]),
    isBoss,
  }
}

function newRun(level: number, hero: Hero): RunState {
  const runId = globalThis.crypto?.randomUUID?.() ?? String(Date.now())
  const hp = baseHp(hero)
  const floor = 1
  const roomType = roomTypeForFloor(floor)
  const st: RunState = {
    runId,
    level,
    floor,
    roomType,
    score: 0,
    goldGained: 0,
    hero: { hp, maxHp: hp, potions: 1 },
    log: ["Entered the dungeon"],
    finished: false,
  }
  return st
}

function saveRunState(st: RunState | null) {
  if (typeof window === "undefined") return
  try {
    if (!st) localStorage.removeItem(RUN_KEY)
    else localStorage.setItem(RUN_KEY, JSON.stringify(st))
  } catch {
    // ignore
  }
}

function loadRunState(): RunState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(RUN_KEY)
    return raw ? (JSON.parse(raw) as RunState) : null
  } catch {
    return null
  }
}

export default function DungeonPage() {
  const [hero, setHero] = useState<Hero | null>(null)
  const [progress, setProgress] = useState<DungeonProgress>(DEFAULT_DUNGEON_PROGRESS)
  const [progressSource, setProgressSource] = useState<string>("…")
  const [run, setRun] = useState<RunState | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setHero(loadCurrentHero())

    ;(async () => {
      const loaded = await loadDungeonProgress()
      setProgress(loaded.progress)
      setProgressSource(loaded.source)
    })()

    const existing = loadRunState()
    if (existing) setRun(existing)
  }, [])

  useEffect(() => {
    saveRunState(run)
  }, [run])

  const header = useMemo(() => {
    if (!run) return null
    return `LEVEL ${run.level} — FLOOR ${run.floor}/10`
  }, [run])

  const unlockedLevelMax = useMemo(() => {
    return Math.min(10, Math.max(1, progress.highest_level_cleared + 1))
  }, [progress.highest_level_cleared])

  async function bumpProgress(patch: Partial<DungeonProgress>) {
    const next: DungeonProgress = { ...progress, ...patch }
    setProgress(next)
    await saveDungeonProgress(next)
  }

  async function startLevel(level: number) {
    if (!hero) {
      alert("Choose a hero first (Collection)")
      return
    }
    setBusy(true)
    try {
      const st = newRun(level, hero)
      // persist run counter + current position
      await bumpProgress({
        current_level: level,
        current_floor: 1,
        total_dungeon_runs: progress.total_dungeon_runs + 1,
      })
      setRun(st)
    } finally {
      setBusy(false)
    }
  }

  function ensureBattleEnemy(st: RunState): RunState {
    if (st.roomType !== "battle" && st.roomType !== "boss") return st
    if (st.enemy) return st
    const isBoss = st.roomType === "boss"
    const enemy = makeEnemy(st.level, isBoss)
    return { ...st, enemy, log: [...st.log, isBoss ? `Boss encountered: ${enemy.name}` : "Enemy encountered"] }
  }

  async function nextFloor() {
    if (!run) return
    const nextFloor = run.floor + 1
    if (nextFloor > 10) return

    const nextRoomType = roomTypeForFloor(nextFloor)
    const next: RunState = {
      ...run,
      floor: nextFloor,
      roomType: nextRoomType,
      enemy: undefined,
      log: [...run.log, `Descending to floor ${nextFloor}`],
    }

    setRun(next)
    await bumpProgress({ current_level: run.level, current_floor: nextFloor })
  }

  async function clearFloorRewards(floor: number, isBoss: boolean) {
    if (!run) return
    const cfg = getLevelConfig(run.level)

    // Gold reward
    const goldNow = loadGold()
    const goldDelta = isBoss ? randInt(cfg.battleGold[0], cfg.battleGold[1]) * 2 : randInt(cfg.battleGold[0], cfg.battleGold[1])
    saveGold(goldNow + goldDelta)

    // Item drop for non-boss battles
    if (!isBoss && Math.random() < cfg.itemDropRate) {
      const item = generateItem()
      await addItemToInventory(item)
      setRun((prev) => (prev ? { ...prev, log: [...prev.log, `Loot: ${item.name} (${item.rarity})`] } : prev))
    }

    // Points
    const battleId = `${run.runId}:${run.level}:${floor}`
    const delta = isBoss ? 10 : 2
    try {
      const mod: any = await import("@farcaster/frame-sdk")
      const ctx: any = await mod?.sdk?.context
      const fid = ctx?.user?.fid
      await awardBattlePoints({ battleId, delta, fid }).catch(() => {})
    } catch {
      await awardBattlePoints({ battleId, delta }).catch(() => {})
    }

    // local score + gold counters in run UI
    setRun((prev) => (prev ? { ...prev, score: prev.score + delta, goldGained: prev.goldGained + goldDelta } : prev))

    // Progress best-cleared marker (deepest floor in the current frontier level)
    if (run.level === progress.highest_level_cleared + 1) {
      if (floor > progress.highest_floor_cleared) {
        if (floor === 10) {
          await bumpProgress({ highest_level_cleared: run.level, highest_floor_cleared: 10 })
        } else {
          await bumpProgress({ highest_floor_cleared: floor })
        }
      }
    } else if (run.level > progress.highest_level_cleared + 1) {
      // Shouldn't happen, but keep it monotonic.
      if (floor === 10) await bumpProgress({ highest_level_cleared: run.level, highest_floor_cleared: 10 })
      else await bumpProgress({ highest_level_cleared: run.level - 1, highest_floor_cleared: floor })
    }

  }

  async function doTreasure() {
    if (!run) return
    const cfg = getLevelConfig(run.level)
    const goldNow = loadGold()
    const goldDelta = randInt(cfg.treasureGold[0], cfg.treasureGold[1])
    saveGold(goldNow + goldDelta)
    setRun({ ...run, goldGained: run.goldGained + goldDelta, log: [...run.log, `Found treasure: +${goldDelta} gold`], roomType: "battle" })
  }

  async function doRest() {
    if (!run) return
    const heal = Math.floor(run.hero.maxHp * 0.3)
    const hp = clamp(run.hero.hp + heal, 0, run.hero.maxHp)
    setRun({ ...run, hero: { ...run.hero, hp }, log: [...run.log, `Rested: +${heal} HP`], roomType: "battle" })
  }

  async function doShop() {
    if (!run) return
    const cost = 60
    const goldNow = loadGold()
    if (goldNow < cost) {
      setRun({ ...run, log: [...run.log, `Shop: need ${cost} gold for a potion`], roomType: "battle" })
      return
    }
    saveGold(goldNow - cost)
    setRun({ ...run, hero: { ...run.hero, potions: run.hero.potions + 1 }, log: [...run.log, `Bought potion (-${cost} gold)`], roomType: "battle" })
  }

  async function startBattle() {
    if (!run || !hero) return
    setRun(ensureBattleEnemy(run))
  }

  function calcDamage(attAtk: number, defDef: number, variance: number) {
    const raw = Math.floor(attAtk * variance)
    const mitigated = Math.floor(defDef * 0.33)
    return clamp(raw - mitigated, 1, 9999)
  }

  async function moveAttack() {
    if (!run || !hero) return
    const st = ensureBattleEnemy(run)
    if (!st.enemy) return

    const eff = effectiveStats(hero)
    const enemy = st.enemy

    // hero hits
    const heroDmg = calcDamage(eff.atk, enemy.def, 0.85 + Math.random() * 0.3)
    let enemyHp = clamp(enemy.hp - heroDmg, 0, enemy.maxHp)
    const log: string[] = [...st.log, `You attack -${heroDmg}`]

    // enemy dead?
    if (enemyHp <= 0) {
      const floor = st.floor
      const isBoss = enemy.isBoss
      const after: RunState = { ...st, enemy: { ...enemy, hp: 0 }, log: [...log, isBoss ? "Boss defeated!" : "Enemy defeated!"], roomType: "battle" }
      setRun(after)
      await clearFloorRewards(floor, isBoss)

      if (isBoss) {
        // boss kill stat + level clear reward
        await bumpProgress({ total_bosses_killed: progress.total_bosses_killed + 1 })
        await grantLevelClearReward(st.level)

        // advance progression current to next level
        const nextLevel = Math.min(10, st.level + 1)
        await bumpProgress({
          current_level: nextLevel,
          current_floor: 1,
          highest_level_cleared: Math.max(progress.highest_level_cleared, st.level),
          highest_floor_cleared: 10,
        })

        setRun((prev) => (prev ? { ...prev, finished: true, victory: true } : prev))
      } else {
        await nextFloor()
      }
      return
    }

    // enemy retaliates
    const enemyDmg = calcDamage(enemy.atk, eff.def, 0.8 + Math.random() * 0.25)
    const hp = clamp(st.hero.hp - enemyDmg, 0, st.hero.maxHp)
    log.push(`${enemy.name} hits -${enemyDmg}`)

    if (hp <= 0) {
      setRun({ ...st, hero: { ...st.hero, hp }, enemy: { ...enemy, hp: enemyHp }, log: [...log, "You died."], finished: true, victory: false })
      return
    }

    setRun({ ...st, hero: { ...st.hero, hp }, enemy: { ...enemy, hp: enemyHp }, log })
  }

  async function movePotion() {
    if (!run) return
    if (run.hero.potions <= 0) {
      setRun({ ...run, log: [...run.log, "No potions left"] })
      return
    }
    const heal = Math.floor(run.hero.maxHp * 0.35)
    const hp = clamp(run.hero.hp + heal, 0, run.hero.maxHp)
    setRun({ ...run, hero: { ...run.hero, hp, potions: run.hero.potions - 1 }, log: [...run.log, `Potion +${heal} HP`] })
  }

  async function grantLevelClearReward(level: number) {
    const cfg = getLevelConfig(level)
    // Create an item and force its rarity by re-rolling until match (cheap, ok at small n)
    let it = generateItem()
    let guard = 0
    while (it.rarity !== cfg.unlockRewardRarity && guard < 40) {
      it = generateItem()
      guard++
    }
    await addItemToInventory(it)
    setRun((prev) => (prev ? { ...prev, log: [...prev.log, `Level clear reward: ${it.name} (${it.rarity})`] } : prev))
  }

  function resetToMap() {
    setRun(null)
    saveRunState(null)
  }

  if (!hero) {
    return (
      <div className="px-4 pb-24">
        <h1 className="text-2xl font-extrabold text-center mt-6">Dungeon</h1>
        <p className="text-center text-gray-400 mt-2 text-sm">Choose a hero to enter.</p>
        <div className="mt-6 flex flex-col gap-2">
          <a href="/collection?v=1" className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold py-3 rounded-xl text-center">
            Choose Hero
          </a>
          <a href="/arena" className="bg-purple-700 hover:bg-purple-600 text-white text-sm font-bold py-3 rounded-xl text-center">
            Back to Arena
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">Dungeon</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">10 Levels • 10 Floors each</p>

      {run ? (
        <div className="mt-6">
          <div className="border border-gray-800 bg-gray-900 rounded-2xl p-5">
            <div className="text-sm text-gray-400">{header}</div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-300">
              <div>
                HP: <span className="font-bold">{run.hero.hp}</span>/{run.hero.maxHp}
              </div>
              <div>
                🧪 <span className="font-bold">{run.hero.potions}</span>
              </div>
              <div>
                ⭐ <span className="font-bold">{run.score}</span>
              </div>
              <div>
                🪙 <span className="font-bold">{run.goldGained}</span>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              {run.roomType === "boss" ? "Boss Floor" : run.roomType === "battle" ? "Battle" : run.roomType === "treasure" ? "Treasure" : run.roomType === "rest" ? "Rest" : "Shop"}
            </div>

            {!run.finished && run.roomType === "treasure" && (
              <button onClick={doTreasure} className="mt-3 w-full bg-yellow-700 hover:bg-yellow-600 text-white text-sm font-bold py-3 rounded-xl">
                Open Treasure
              </button>
            )}

            {!run.finished && run.roomType === "rest" && (
              <button onClick={doRest} className="mt-3 w-full bg-green-700 hover:bg-green-600 text-white text-sm font-bold py-3 rounded-xl">
                Rest (+HP)
              </button>
            )}

            {!run.finished && run.roomType === "shop" && (
              <button onClick={doShop} className="mt-3 w-full bg-purple-700 hover:bg-purple-600 text-white text-sm font-bold py-3 rounded-xl">
                Buy Potion (60 gold)
              </button>
            )}

            {!run.finished && (run.roomType === "battle" || run.roomType === "boss") && (
              <div className="mt-4">
                {!run.enemy ? (
                  <button onClick={startBattle} className="w-full bg-red-700 hover:bg-red-600 text-white text-sm font-bold py-3 rounded-xl">
                    {run.roomType === "boss" ? "Fight Boss" : "Fight"}
                  </button>
                ) : (
                  <div className="border border-gray-800 bg-black/20 rounded-xl p-3">
                    <div className="flex items-center justify-between text-sm text-gray-200">
                      <div className="font-bold">{run.enemy.name}{run.enemy.isBoss ? " (BOSS)" : ""}</div>
                      <div className="text-xs text-gray-400">
                        HP {run.enemy.hp}/{run.enemy.maxHp}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button onClick={moveAttack} className="bg-red-700 hover:bg-red-600 text-white text-sm font-bold py-3 rounded-xl">
                        Attack
                      </button>
                      <button onClick={movePotion} className="bg-orange-700 hover:bg-orange-600 text-white text-sm font-bold py-3 rounded-xl">
                        Potion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {run.finished && (
              <div className="mt-4">
                <div className={`text-center text-lg font-extrabold ${run.victory ? "text-yellow-300" : "text-red-300"}`}>
                  {run.victory ? "LEVEL CLEARED" : "RUN FAILED"}
                </div>
                <div className="text-center text-xs text-gray-400 mt-1">Score gained: {run.score} • Gold gained: {run.goldGained}</div>
                <button onClick={resetToMap} className="mt-3 w-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold py-3 rounded-xl">
                  Back to Map
                </button>
              </div>
            )}

            <div className="mt-4 text-[11px] text-gray-500 whitespace-pre-line">
              {run.log.slice(-6).join("\n")}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href="/collection" className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold py-3 rounded-xl text-center">
              Hero / Items
            </a>
            <button onClick={resetToMap} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white text-sm font-bold py-3 rounded-xl">
              Abandon
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 border border-gray-800 bg-gray-900 rounded-2xl p-5">
            <div className="text-sm text-gray-400">Progress ({progressSource})</div>
            <div className="mt-2 text-xs text-gray-300">
              Current: Level {progress.current_level}, Floor {progress.current_floor}/10
            </div>
            <div className="mt-1 text-xs text-gray-300">
              Highest cleared: Level {progress.highest_level_cleared}, Floor {progress.highest_floor_cleared}/10
            </div>
            <div className="mt-1 text-xs text-gray-300">Runs: {progress.total_dungeon_runs} • Bosses: {progress.total_bosses_killed}</div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {DUNGEON_LEVELS.map((lvl) => {
              const unlocked = lvl.level <= unlockedLevelMax
              return (
                <button
                  key={lvl.level}
                  disabled={!unlocked || busy}
                  onClick={() => startLevel(lvl.level)}
                  className={`text-left border rounded-2xl p-4 ${unlocked ? "bg-gray-900 border-gray-800 hover:border-purple-500" : "bg-gray-950 border-gray-900 opacity-60"}`}
                >
                  <div className="text-xs text-gray-400">LEVEL {lvl.level}</div>
                  <div className="text-sm font-extrabold mt-1 text-white">{lvl.name}</div>
                  <div className="text-[11px] text-gray-400 mt-1">{lvl.difficulty}</div>
                  <div className="text-[11px] text-gray-500 mt-2">Reward: {lvl.unlockRewardRarity} item</div>
                  {!unlocked && <div className="text-[11px] text-red-300 mt-2">🔒 Locked</div>}
                </button>
              )
            })}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <a href="/arena" className="bg-purple-700 hover:bg-purple-600 text-white text-sm font-bold py-3 rounded-xl text-center">
              Back to Arena
            </a>
            <a href="/stats" className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold py-3 rounded-xl text-center">
              View Stats
            </a>
          </div>
        </>
      )}
    </div>
  )
}
