"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import frameSdk from "@farcaster/frame-sdk"
import type { Hero } from "@/lib/heroes"
import type { EquippedItems, Item, ItemRarity, ItemSlot } from "@/lib/items"
import { FULL_SET_BONUS, generateItem, getEquippedBonuses, getSetBonus } from "@/lib/items"
import { addItemToInventory } from "@/lib/inventory"
import { getWalletAddress, loadStats, saveStats } from "@/lib/db"
import { loadGold, saveGold } from "@/lib/gold"
import {
  DUNGEON_LEVELS,
  clampFloor,
  clampLevel,
  getLevelConfig,
  randInt,
  roomWeightsForFloor,
  type DungeonRoomType,
} from "@/lib/dungeonConfig"
import { DEFAULT_DUNGEON_PROGRESS, loadDungeonProgress, saveDungeonProgress, type DungeonProgress } from "@/lib/dungeonProgress"

type PotionType = "healing" | "mana" | "elixir"

type PotionCounts = Record<PotionType, number>

type Enemy = {
  name: string
  emoji: string
  hp: number
  maxHp: number
  atk: number
  def: number
  spd: number
  score: number
  gold: number
  boss: boolean
}

const CURRENT_HERO_KEY = "hero-pull-current-hero"
const EQUIP_MAP_KEY = "hero-pull-equipped-items" // { [tokenId]: EquippedItems }
const POTIONS_KEY = "hero-pull-potions" // PotionCounts
const POINTS_KEY = "hero-pull-points"

const DUNGEON_TREASURY = "0xa782922Ff9c54F4264FD049189eC66940f528Eb0"
const BASE_CHAIN_ID_HEX = "0x2105" // 8453

function clampInt(n: any, min: number, max: number) {
  const x = Math.floor(Number(n) || 0)
  return Math.max(min, Math.min(max, x))
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function pickWeighted<T extends string>(rows: Array<{ type: T; w: number }>): T {
  const tot = rows.reduce((s, r) => s + r.w, 0)
  let roll = Math.random() * (tot || 1)
  for (const r of rows) {
    roll -= r.w
    if (roll <= 0) return r.type
  }
  return rows[0]!.type
}

function hpFromHeroStats(atk: number, def: number) {
  // hero stats are 10..999 and items add +200 set; scale for 100 floors without going infinite.
  const v = 160 + Math.floor(def * 0.62) + Math.floor(atk * 0.22)
  return clampInt(v, 140, 1400)
}

function loadPotionCounts(): PotionCounts {
  if (typeof window === "undefined") return { healing: 2, mana: 1, elixir: 0 }
  const parsed = safeJsonParse<PotionCounts>(localStorage.getItem(POTIONS_KEY), { healing: 2, mana: 1, elixir: 0 })
  return {
    healing: clampInt((parsed as any).healing ?? 0, 0, 99),
    mana: clampInt((parsed as any).mana ?? 0, 0, 99),
    elixir: clampInt((parsed as any).elixir ?? 0, 0, 99),
  }
}

function savePotionCounts(pots: PotionCounts) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(POTIONS_KEY, JSON.stringify(pots))
  } catch {
    // ignore
  }
}

function capPotionsAtEntry(pots: PotionCounts, cap: number): PotionCounts {
  const c: PotionCounts = { healing: clampInt(pots.healing, 0, 99), mana: clampInt(pots.mana, 0, 99), elixir: clampInt(pots.elixir, 0, 99) }
  let total = c.healing + c.mana + c.elixir
  if (total <= cap) return c

  const order: PotionType[] = ["healing", "mana", "elixir"]
  while (total > cap) {
    const t = order.sort((a, b) => c[b] - c[a])[0]!
    if (c[t] <= 0) break
    c[t] -= 1
    total -= 1
  }
  return c
}

function readEquippedForHero(current: any): EquippedItems | undefined {
  if (current?.equippedItems) return current.equippedItems as EquippedItems
  const tokenId = current?.tokenId ? String(current.tokenId) : null
  if (!tokenId) return undefined
  if (typeof window === "undefined") return undefined
  const map = safeJsonParse<Record<string, EquippedItems | null>>(localStorage.getItem(EQUIP_MAP_KEY), {})
  return map[tokenId] ?? undefined
}

function persistEquippedForHero(current: any, equipped: EquippedItems) {
  if (typeof window === "undefined") return
  try {
    const next = { ...(current || {}), equippedItems: equipped }
    localStorage.setItem(CURRENT_HERO_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }

  const tokenId = current?.tokenId ? String(current.tokenId) : null
  if (tokenId) {
    try {
      const map = safeJsonParse<Record<string, EquippedItems | null>>(localStorage.getItem(EQUIP_MAP_KEY), {})
      map[tokenId] = equipped
      localStorage.setItem(EQUIP_MAP_KEY, JSON.stringify(map))
    } catch {
      // ignore
    }
  }
}

function calcDamage(attackerAtk: number, defenderDef: number, critChance: number, critMult: number) {
  const roll = 0.85 + Math.random() * 0.3
  let dmg = Math.floor(attackerAtk * 0.12 * roll)
  dmg -= Math.floor(defenderDef * 0.07)
  dmg = Math.max(1, dmg)
  const crit = Math.random() < critChance
  if (crit) dmg = Math.floor(dmg * critMult)
  return { dmg, crit }
}

function getProvider() {
  return frameSdk?.wallet?.ethProvider ?? (typeof window !== "undefined" ? (window as any).ethereum : null)
}

async function providerRequest(args: { method: string; params?: any[] }) {
  const p = getProvider()
  if (!p) throw new Error("No wallet provider available")
  return p.request(args)
}

async function sendTx0_0002Eth() {
  const p = getProvider()
  if (!p) throw new Error("No wallet provider found")

  try {
    await providerRequest({ method: "eth_requestAccounts" })
  } catch {
    // ignore
  }

  let from: string | undefined
  try {
    const accounts = (await providerRequest({ method: "eth_accounts" })) as string[]
    from = accounts?.[0]
  } catch {
    // ignore
  }

  const valueWeiHex = "0x" + BigInt("200000000000000").toString(16)
  const hash = (await providerRequest({
    method: "eth_sendTransaction",
    params: [
      {
        chainId: BASE_CHAIN_ID_HEX,
        from,
        to: DUNGEON_TREASURY,
        value: valueWeiHex,
        data: "0x",
      },
    ],
  })) as string

  return hash
}

async function addPoints(delta: number) {
  const d = clampInt(delta, 0, 1_000_000_000)
  if (!d) return

  try {
    const wallet = await getWalletAddress()
    if (wallet) {
      const cur: any = await loadStats(wallet)
      const curPts = clampInt(cur?.points ?? 0, 0, 2_000_000_000)
      await saveStats(wallet, { points: curPts + d })
      return
    }
  } catch {
    // ignore
  }

  if (typeof window !== "undefined") {
    const cur = clampInt(localStorage.getItem(POINTS_KEY) || "0", 0, 2_000_000_000)
    localStorage.setItem(POINTS_KEY, String(cur + d))
  }
}

function rarityBorder(r: ItemRarity) {
  if (r === "Common") return "border-gray-700"
  if (r === "Rare") return "border-blue-500 shadow-[0_0_12px_#60a5fa]"
  if (r === "Epic") return "border-purple-500 shadow-[0_0_15px_#c084fc]"
  if (r === "Legendary") return "border-yellow-400 shadow-[0_0_20px_#ffd700]"
  return "border-[#f97316] shadow-[0_0_22px_#f97316]"
}

function slotLabel(slot: ItemSlot) {
  if (slot === "weapon") return "Weapon"
  if (slot === "shield") return "Shield"
  if (slot === "boots") return "Boots"
  return "Helmet"
}

function desiredSetForDepth(depth: number): "Shadow" | "Dragon" {
  // bias toward Shadow midgame, Dragon endgame
  return depth >= 75 ? "Dragon" : "Shadow"
}

function depthToDropRarity(depth: number): ItemRarity {
  const roll = Math.random() * 100

  // depth 1..100
  if (depth <= 20) {
    if (roll < 70) return "Common"
    if (roll < 95) return "Rare"
    return "Epic"
  }
  if (depth <= 45) {
    if (roll < 45) return "Common"
    if (roll < 84) return "Rare"
    if (roll < 97) return "Epic"
    return "Legendary"
  }
  if (depth <= 80) {
    if (roll < 25) return "Common"
    if (roll < 62) return "Rare"
    if (roll < 88) return "Epic"
    if (roll < 97) return "Legendary"
    return "Set"
  }
  // 81..100
  if (roll < 18) return "Common"
  if (roll < 48) return "Rare"
  if (roll < 76) return "Epic"
  if (roll < 90) return "Legendary"
  return "Set"
}

function generateRarityTarget(r: Exclude<ItemRarity, "Set">): Item {
  let it = generateItem()
  for (let i = 0; i < 250 && it.rarity !== r; i++) it = generateItem()
  if (it.rarity !== r) it = { ...it, rarity: r } as any
  return it
}

function generateSetTarget(set: "Shadow" | "Dragon"): Item {
  let it = generateItem()
  for (let i = 0; i < 350 && !(it.rarity === "Set" && it.set === set); i++) it = generateItem()
  return it
}

function generateDropForDepth(depth: number): Item {
  const target = depthToDropRarity(depth)
  if (target === "Set") return generateSetTarget(desiredSetForDepth(depth))
  return generateRarityTarget(target)
}

function generateUnlockReward(rarity: ItemRarity, depth: number): Item {
  if (rarity === "Set") return generateSetTarget(desiredSetForDepth(depth))
  return generateRarityTarget(rarity)
}

function shareUrl(text: string) {
  const frameUrl = "https://hero-pull.vercel.app"
  return `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(frameUrl)}`
}

function enemyFromLevel(level: number, floor: number, boss: boolean): Enemy {
  const cfg = getLevelConfig(level)
  const fScale = 1 + (clampFloor(floor) - 1) * 0.08

  const base = boss ? cfg.boss : { ...cfg.enemy, name: "Enemy", emoji: "👺" }

  const hp = clampInt(randInt(base.hp[0], base.hp[1]) * (boss ? 1.0 : fScale), 1, 999999)
  const atk = clampInt(randInt(base.atk[0], base.atk[1]) * (boss ? 1.0 : fScale), 1, 999999)
  const def = clampInt(randInt(base.def[0], base.def[1]) * (boss ? 1.0 : fScale), 1, 999999)
  const spd = clampInt(randInt(base.spd[0], base.spd[1]) * (boss ? 1.0 : 1 + (floor - 1) * 0.03), 1, 999999)

  const score = clampInt(22 + level * 10 + floor * 3 + Math.floor((atk + def + spd) / 180), 1, 999999)
  const gold = clampInt(randInt(cfg.battleGold[0], cfg.battleGold[1]) + Math.floor(level * 2 + floor * 0.5), 0, 999999)

  return {
    name: boss ? cfg.boss.name : `Lv${level} ${floor <= 3 ? "Scavenger" : floor <= 6 ? "Raider" : "Elite"}`,
    emoji: boss ? cfg.boss.emoji : level >= 8 ? "🐲" : level >= 5 ? "👹" : "👺",
    hp,
    maxHp: hp,
    atk,
    def,
    spd,
    score,
    gold,
    boss,
  }
}

export default function DungeonPage() {
  const [loading, setLoading] = useState(true)
  const [heroRaw, setHeroRaw] = useState<any | null>(null)
  const [hero, setHero] = useState<Hero | null>(null)
  const [equipped, setEquipped] = useState<EquippedItems>({})

  const eff = useMemo(() => {
    if (!hero) return null
    const itemBonus = getEquippedBonuses(equipped)
    const setBonus = getSetBonus(equipped)
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
  }, [hero, equipped])

  const [progress, setProgress] = useState<DungeonProgress>(DEFAULT_DUNGEON_PROGRESS)
  const [progressSource, setProgressSource] = useState<"supabase" | "local">("local")

  // Menu / run selection
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [started, setStarted] = useState(false)

  // Run state
  const [level, setLevel] = useState(1)
  const [floor, setFloor] = useState(1)
  const [room, setRoom] = useState<DungeonRoomType>("battle")

  const [runScore, setRunScore] = useState(0)
  const [runGold, setRunGold] = useState(0)
  const [mp, setMp] = useState(50)
  const [pots, setPots] = useState<PotionCounts>({ healing: 2, mana: 1, elixir: 0 })

  const [playerHp, setPlayerHp] = useState(0)
  const [playerMaxHp, setPlayerMaxHp] = useState(0)

  const [enemy, setEnemy] = useState<Enemy | null>(null)
  const [inBattle, setInBattle] = useState(false)
  const [playerTurn, setPlayerTurn] = useState(true)
  const [defending, setDefending] = useState(false)

  const [log, setLog] = useState<string[]>([])
  const [loot, setLoot] = useState<Item | null>(null)
  const [shopItems, setShopItems] = useState<Item[]>([])

  const [busy, setBusy] = useState(false)
  const [dead, setDead] = useState(false)
  const [wonLevel, setWonLevel] = useState(false)
  const [wonGame, setWonGame] = useState(false)
  const [revived, setRevived] = useState(false)

  const topRef = useRef<HTMLDivElement | null>(null)

  const depth = (level - 1) * 10 + floor

  const levelCfg = useMemo(() => getLevelConfig(level), [level])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem(CURRENT_HERO_KEY) : null
        const parsed = safeJsonParse<any | null>(raw, null)
        setHeroRaw(parsed)
        setHero(parsed as Hero)
        setEquipped(readEquippedForHero(parsed) ?? {})

        const entryPots = capPotionsAtEntry(loadPotionCounts(), 5)
        savePotionCounts(entryPots)
        setPots(entryPots)

        const dp = await loadDungeonProgress()
        setProgress(dp.progress)
        setProgressSource(dp.source)
        setSelectedLevel(dp.progress.current_level)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!topRef.current) return
    topRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [started, level, floor, room, inBattle, loot, dead, wonLevel, wonGame])

  const appendLog = (line: string) => {
    setLog((prev) => [...prev.slice(-28), line])
  }

  const persistProgress = async (next: DungeonProgress) => {
    const saved = await saveDungeonProgress(next)
    setProgress(saved.progress)
    setProgressSource(saved.source)
  }

  const startRun = async (startLevel: number, startFloor: number) => {
    if (!hero || !eff) return

    const L = clampLevel(startLevel)
    const F = clampFloor(startFloor)

    setStarted(true)
    setDead(false)
    setWonLevel(false)
    setWonGame(false)
    setRevived(false)

    setLevel(L)
    setFloor(F)
    setRoom(F === 10 ? "boss" : pickWeighted(roomWeightsForFloor(F)))

    const mhp = hpFromHeroStats(eff.total.atk, eff.total.def)
    setPlayerMaxHp(mhp)
    setPlayerHp(mhp)

    setRunScore(0)
    setRunGold(0)
    setMp(50)
    setLoot(null)
    setShopItems([])
    setLog([`🏰 Entering Level ${L} - Floor ${F}/10.`])

    const nextProgress: DungeonProgress = {
      ...progress,
      current_level: L,
      current_floor: F,
      total_runs: progress.total_runs + 1,
    }
    await persistProgress(nextProgress)
  }

  const leaveToMenu = () => {
    setStarted(false)
    setDead(false)
    setWonLevel(false)
    setWonGame(false)
    setEnemy(null)
    setInBattle(false)
    setLoot(null)
    setShopItems([])
  }

  const canSelectLevel = (L: number) => {
    // unlocked: up to highest cleared + 1
    const maxUnlocked = Math.max(1, progress.highest_level_cleared + 1)
    return L <= maxUnlocked
  }

  const ensureRoom = (t: DungeonRoomType) => {
    setLoot(null)
    setShopItems([])

    if (t === "boss") {
      beginBattle(true)
      return
    }
    if (t === "battle") {
      beginBattle(false)
      return
    }

    setEnemy(null)
    setInBattle(false)
    setPlayerTurn(true)
    setDefending(false)

    if (t === "treasure") {
      const roll = Math.random()
      if (roll < 0.4) {
        const g = clampInt(randInt(levelCfg.treasureGold[0], levelCfg.treasureGold[1]) + floor * 2, 0, 999999)
        setRunGold((x) => x + g)
        setRunScore((s) => s + 25 + level * 2)
        appendLog(`💰 Treasure: +${g} gold.`)
      } else if (roll < 0.72) {
        const heal = Math.floor(playerMaxHp * 0.42)
        setPlayerHp((hp) => Math.min(playerMaxHp, hp + heal))
        setRunScore((s) => s + 20 + level)
        appendLog(`💎 Healing crystal: +${heal} HP.`)
      } else {
        const it = generateDropForDepth(depth)
        setLoot(it)
        appendLog(`🎁 Found gear: ${it.name} (${it.rarity}${it.set ? ` / ${it.set}` : ""}).`)
      }
      return
    }

    if (t === "shop") {
      // shop in-run shows three items; purchases spend persistent wallet gold and go to inventory.
      const items = [generateDropForDepth(depth), generateDropForDepth(depth), generateDropForDepth(depth)]
      setShopItems(items)
      appendLog("🏪 A merchant offers 3 items.")
      return
    }

    if (t === "trap") {
      appendLog("⚠️ Trap detected.")
      return
    }

    // blessing
    appendLog("🌟 A shrine hums with power.")
  }

  useEffect(() => {
    if (!started) return
    ensureRoom(room)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, room, level, floor])

  const beginBattle = (boss: boolean) => {
    if (!eff) return
    const e = enemyFromLevel(level, floor, boss)
    setEnemy(e)
    setInBattle(true)
    setDefending(false)
    setLoot(null)

    const heroFirst = eff.total.spd >= e.spd
    setPlayerTurn(heroFirst)

    appendLog(`${boss ? "🐉" : "⚔️"} ${e.name} appears! ${heroFirst ? "Your move." : "It strikes first!"}`)

    if (!heroFirst) {
      setTimeout(() => enemyAct(e, false), 550)
    }
  }

  const enemyAct = (e: Enemy, fromState: boolean) => {
    if (!eff) return

    const heroDef = eff.total.def
    const critChance = 0.08 + Math.min(0.07, Math.max(0, (e.spd - eff.total.spd) / 1200))
    const { dmg, crit } = calcDamage(e.atk, heroDef * (defending ? 1.6 : 1), critChance, 1.7)

    setDefending(false)

    setPlayerHp((hp) => {
      const nextHp = Math.max(0, hp - dmg)
      if (nextHp <= 0) {
        appendLog(`💥 ${e.name} hits for ${dmg}${crit ? " (CRIT)" : ""}. You fall...`)
        setTimeout(() => finishRun(false).catch(() => {}), 0)
      } else {
        appendLog(`👹 ${e.name} hits for ${dmg}${crit ? " (CRIT)" : ""}.`)
      }
      return nextHp
    })

    setPlayerTurn(true)

    if (!fromState) {
      // no-op
    }
  }

  const endBattleWin = async (e: Enemy) => {
    setInBattle(false)
    setEnemy(null)
    setDefending(false)

    const pts = clampInt(e.score * (e.boss ? 4 : 1) + level * 12 + floor * 5, 0, 999999)
    const gold = clampInt(e.gold + Math.floor(Math.random() * 12) + floor, 0, 999999)

    setRunScore((s) => s + pts)
    setRunGold((g) => g + gold)

    appendLog(`💀 ${e.name} defeated! +${pts} score, +${gold} gold.`)

    // Potion find
    if (!e.boss && Math.random() < 0.2) {
      setPots((p) => {
        const next = { ...p, healing: p.healing + 1 }
        savePotionCounts(next)
        return next
      })
      appendLog("🧪 Found a healing potion.")
    }

    // Drops
    if (!e.boss && Math.random() < levelCfg.itemDropRate) {
      const it = generateDropForDepth(depth)
      setLoot(it)
      appendLog(`🎁 Loot dropped: ${it.name} (${it.rarity}${it.set ? ` / ${it.set}` : ""}).`)
    }

    // Boss rewards + progression
    if (e.boss) {
      const reward = generateUnlockReward(levelCfg.unlockRewardRarity, depth)
      setLoot(reward)
      appendLog(`🏆 Level cleared reward: ${reward.name} (${reward.rarity}${reward.set ? ` / ${reward.set}` : ""}).`)

      const nextProgress: DungeonProgress = {
        ...progress,
        total_bosses: progress.total_bosses + 1,
        highest_level_cleared: Math.max(progress.highest_level_cleared, level),
        highest_floor_cleared: 10,
        current_level: Math.min(10, level + 1),
        current_floor: 1,
      }
      await persistProgress(nextProgress)

      setWonLevel(true)
      if (level >= 10) setWonGame(true)
    } else {
      // update highest floor cleared within current frontier
      const nextHF = Math.max(progress.highest_floor_cleared, floor)
      const nextProgress: DungeonProgress = {
        ...progress,
        current_level: level,
        current_floor: floor,
        highest_floor_cleared: nextHF,
      }
      await persistProgress(nextProgress)
    }
  }

  const doAttack = () => {
    if (!eff || !enemy || !inBattle || !playerTurn) return

    setPlayerTurn(false)

    const heroAtk = eff.total.atk
    const critChance = 0.1 + Math.min(0.08, Math.max(0, (eff.total.spd - enemy.spd) / 1500))
    const { dmg, crit } = calcDamage(heroAtk, enemy.def, critChance, 1.9)

    const nextEnemyHp = Math.max(0, enemy.hp - dmg)
    setEnemy({ ...enemy, hp: nextEnemyHp })
    appendLog(`⚔️ You attack for ${dmg}${crit ? " (CRIT)" : ""}.`)

    if (nextEnemyHp <= 0) {
      endBattleWin({ ...enemy, hp: nextEnemyHp }).catch(() => {})
      return
    }

    setTimeout(() => enemyAct({ ...enemy, hp: nextEnemyHp }, true), 650)
  }

  const doDefend = () => {
    if (!enemy || !inBattle || !playerTurn) return
    setDefending(true)
    setPlayerTurn(false)
    appendLog("🛡️ You defend. Incoming damage reduced.")
    setTimeout(() => enemyAct(enemy, true), 650)
  }

  const doSkill = () => {
    if (!eff || !enemy || !inBattle || !playerTurn) return

    const cost = 25
    if (mp < cost) {
      appendLog("✨ Not enough MP.")
      return
    }

    setPlayerTurn(false)
    setMp((m) => Math.max(0, m - cost))

    const heroAtk = eff.total.atk
    const base = Math.floor(heroAtk * 0.18 + eff.total.spd * 0.03)
    const dmg = Math.max(1, base - Math.floor(enemy.def * 0.06))

    const nextEnemyHp = Math.max(0, enemy.hp - dmg)
    setEnemy({ ...enemy, hp: nextEnemyHp })
    appendLog(`✨ ${hero?.power || "Skill"}! You deal ${dmg}.`)

    if (nextEnemyHp <= 0) {
      endBattleWin({ ...enemy, hp: nextEnemyHp }).catch(() => {})
      return
    }

    setTimeout(() => enemyAct({ ...enemy, hp: nextEnemyHp }, true), 650)
  }

  const usePotion = (type: PotionType) => {
    if (!enemy || !inBattle || !playerTurn) return
    if (pots[type] <= 0) return

    setPots((p) => {
      const next = { ...p, [type]: Math.max(0, p[type] - 1) }
      savePotionCounts(next)
      return next
    })

    if (type === "healing") {
      const heal = Math.floor(playerMaxHp * 0.38)
      setPlayerHp((hp) => Math.min(playerMaxHp, hp + heal))
      appendLog(`🧪 Healing potion: +${heal} HP.`)
    } else if (type === "mana") {
      const gain = 22
      setMp((m) => Math.min(50, m + gain))
      appendLog(`🧪 Mana potion: +${gain} MP.`)
    } else {
      const heal = Math.floor(playerMaxHp * 0.24)
      const gain = 14
      setPlayerHp((hp) => Math.min(playerMaxHp, hp + heal))
      setMp((m) => Math.min(50, m + gain))
      appendLog(`🧪 Elixir: +${heal} HP, +${gain} MP.`)
    }

    setPlayerTurn(false)
    setTimeout(() => enemyAct(enemy, true), 650)
  }

  const equipItem = (it: Item) => {
    const next = { ...equipped, [it.slot]: it }
    setEquipped(next)
    persistEquippedForHero(heroRaw, next)
    appendLog(`✅ Equipped ${slotLabel(it.slot)}: ${it.name}.`)
  }

  const saveLootToInventory = async (it: Item) => {
    setBusy(true)
    try {
      await addItemToInventory(it)
      appendLog(`📦 Saved to inventory: ${it.name}.`)
    } catch (e: any) {
      appendLog(`⚠️ Failed to save item: ${e?.message || String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  const buyShopItem = async (it: Item) => {
    // Prices scale with rarity + depth
    const base = it.rarity === "Common" ? 45 : it.rarity === "Rare" ? 90 : it.rarity === "Epic" ? 155 : it.rarity === "Legendary" ? 240 : 280
    const cost = clampInt(base + Math.floor(depth * 0.6) + Math.floor(Math.random() * 18), 1, 999999)

    const currentGold = loadGold()
    if (currentGold < cost) {
      appendLog(`❌ Not enough gold. Need ${cost}. (Wallet gold: ${currentGold})`)
      return
    }

    setBusy(true)
    try {
      saveGold(currentGold - cost)
      await addItemToInventory(it)
      appendLog(`🛒 Bought ${it.name} for ${cost} gold (saved to inventory).`)
    } catch (e: any) {
      appendLog(`⚠️ Purchase failed: ${e?.message || String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  const nextFloor = async () => {
    if (!started) return

    if (floor >= 10) {
      // after boss, proceed to next level (or end)
      if (level >= 10) {
        await finishRun(true)
        return
      }

      const nextLevel = level + 1
      setLevel(nextLevel)
      setFloor(1)
      setWonLevel(false)
      setRoom(pickWeighted(roomWeightsForFloor(1)))

      // between-level regen
      const heal = Math.floor(playerMaxHp * 0.2)
      setPlayerHp((hp) => Math.min(playerMaxHp, hp + heal))
      setMp((m) => Math.min(50, m + 20))
      setRunScore((s) => s + 120)

      appendLog(`➡️ Level ${nextLevel} begins. (+${heal} HP, +20 MP)`)

      await persistProgress({
        ...progress,
        current_level: nextLevel,
        current_floor: 1,
      })
      return
    }

    const heal = Math.floor(playerMaxHp * 0.12)
    setPlayerHp((hp) => Math.min(playerMaxHp, hp + heal))
    setMp((m) => Math.min(50, m + 12))
    setRunScore((s) => s + 45)

    const nf = floor + 1
    setFloor(nf)
    setRoom(nf === 10 ? "boss" : pickWeighted(roomWeightsForFloor(nf)))
    setLoot(null)
    appendLog(`➡️ Advancing to Floor ${nf}/10. (+${heal} HP, +12 MP)`)

    await persistProgress({
      ...progress,
      current_level: level,
      current_floor: nf,
      highest_floor_cleared: Math.max(progress.highest_floor_cleared, nf),
    })
  }

  const finishRun = async (victory: boolean) => {
    setInBattle(false)
    setEnemy(null)
    setLoot(null)
    setShopItems([])

    setDead(!victory)

    // award persistent gold
    const baseGold = loadGold()
    saveGold(baseGold + runGold)

    // final points
    const bonus = victory ? 1000 : 0
    const finalScore = runScore + bonus
    setRunScore(finalScore)
    await addPoints(finalScore)

    if (victory) {
      // if full game victory, mark progress fully cleared
      await persistProgress({
        ...progress,
        highest_level_cleared: 10,
        highest_floor_cleared: 10,
        current_level: 10,
        current_floor: 10,
      })
    }

    appendLog(victory ? "🏆 Dungeon conquered (all 10 levels)!" : "💀 Run ended.")
  }

  const doTrapDisarm = () => {
    const ok = Math.random() < 0.55
    if (ok) {
      setRunScore((s) => s + 30 + level)
      setRunGold((g) => g + 12 + level)
      appendLog("✅ Disarmed! +score +gold.")
    } else {
      const dmg = 12 + floor * 6 + level * 3
      setPlayerHp((hp) => {
        const next = Math.max(0, hp - dmg)
        if (next <= 0) finishRun(false).catch(() => {})
        return next
      })
      appendLog(`💥 Failed! -${dmg} HP.`)
    }
  }

  const doTrapTank = () => {
    const dmg = 8 + floor * 4 + level * 2
    setPlayerHp((hp) => {
      const next = Math.max(0, hp - dmg)
      if (next <= 0) finishRun(false).catch(() => {})
      return next
    })
    appendLog(`💨 You push through. -${dmg} HP.`)
  }

  const doBlessing = () => {
    const blessings = [
      { name: "Life Surge", fn: () => setPlayerHp(playerMaxHp) },
      { name: "Magic Refill", fn: () => setMp(50) },
      {
        name: "Potion Cache",
        fn: () =>
          setPots((p) => {
            const types: PotionType[] = ["healing", "mana", "elixir"]
            const t = types[Math.floor(Math.random() * types.length)]!
            const next = { ...p, [t]: p[t] + 1 }
            savePotionCounts(next)
            return next
          }),
      },
      { name: "Gold Rain", fn: () => setRunGold((g) => g + 60 + level * 5) },
      { name: "Score Blessing", fn: () => setRunScore((s) => s + 80 + level * 10) },
    ]

    const b = blessings[Math.floor(Math.random() * blessings.length)]!
    b.fn()
    appendLog(`✨ Blessing received: ${b.name}.`)
  }

  const doRevive = async () => {
    if (busy || revived || !dead || wonGame) return
    setBusy(true)
    try {
      await sendTx0_0002Eth()
      setRevived(true)
      setDead(false)

      const healed = Math.max(1, Math.floor(playerMaxHp * 0.55))
      setPlayerHp(healed)
      setMp(30)

      appendLog("❤️ Revived! Back in the dungeon.")

      // continue on a battle room on the same level/floor
      setRoom(floor === 10 ? "boss" : "battle")
      setStarted(true)
    } catch (e: any) {
      appendLog(`⚠️ Revive failed: ${e?.message || String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  const doMintVictory = async () => {
    if (busy || !wonGame) return
    setBusy(true)
    try {
      const hash = await sendTx0_0002Eth()
      await addPoints(100)
      appendLog(`🏆 Victory badge minted! +100 points. Tx ${hash.slice(0, 10)}…`)
    } catch (e: any) {
      appendLog(`⚠️ Mint failed: ${e?.message || String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  const doShare = () => {
    const txt = wonGame
      ? `I just CLEARED the Hero Pull Dungeon (10 levels / 100 floors)! 🏰🐉⚔️\nFinal score: ${runScore} ⭐\n\nTry it:`
      : dead
        ? `I got wrecked in the Hero Pull Dungeon… 💀\nReached Level ${level} - Floor ${floor}/10\nScore: ${runScore} ⭐\n\nTry it:`
        : `I’m running the Hero Pull Dungeon! 🏰\nCurrently Level ${level} - Floor ${floor}/10\nScore: ${runScore} ⭐\n\nTry it:`

    const url = shareUrl(txt)
    ;(async () => {
      try {
        if ((frameSdk as any)?.actions?.openUrl) {
          await (frameSdk as any).actions.openUrl(url)
          return
        }
      } catch {
        // ignore
      }
      window.open(url, "_blank")
    })().catch(() => {})
  }

  if (loading) {
    return (
      <div className="px-4 pb-24">
        <div className="text-xs text-gray-400 text-center mt-10">Loading…</div>
      </div>
    )
  }

  if (!hero || !eff) {
    return (
      <div className="px-4 pb-24">
        <h1 className="text-2xl font-extrabold text-center mt-6">Dungeon</h1>
        <p className="text-center text-gray-400 mt-2 text-sm">Select a hero first.</p>

        <div className="mt-6 border border-gray-800 bg-gray-900 rounded-2xl p-5 text-sm text-gray-300">
          No active hero found in localStorage.
          <div className="text-xs text-gray-500 mt-2">Go to Heroes, pick a hero, then “Use in Arena” (it sets the current hero).</div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <a href="/collection" className="bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-bold py-3 rounded-xl text-center">
            Choose Hero
          </a>
          <a href="/arena" className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold py-3 rounded-xl text-center">
            Back to Arena
          </a>
        </div>
      </div>
    )
  }

  const showSetBonus = eff.setBonus.setName
  const titleLabel = started ? `LEVEL ${level} - FLOOR ${floor}/10` : "Dungeon"

  return (
    <div className="px-4 pb-24">
      <div ref={topRef} />

      <div className="flex items-center justify-between mt-6">
        <div>
          <div className="text-xl font-extrabold">{titleLabel}</div>
          <div className="text-xs text-gray-400">{started ? `${levelCfg.name} • ${levelCfg.difficulty}` : `Progress: ${progressSource}`}</div>
        </div>
        <div className="text-right text-xs">
          <div className="text-yellow-300 font-bold">🪙 Run +{runGold}</div>
          <div className="text-green-400 font-bold">⭐ {runScore}</div>
        </div>
      </div>

      {/* Hero panel */}
      <div className="mt-4 border border-gray-800 bg-gray-900 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <img src={hero.imageUrl} alt={hero.name} className="w-16 h-16 rounded-2xl object-cover border border-gray-700" />
          <div className="min-w-0 flex-1">
            <div className="font-extrabold truncate">{hero.name}</div>
            <div className="text-xs text-gray-400 truncate">{hero.rarity} • {hero.power}</div>
            {showSetBonus ? (
              <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold text-[#f97316] border border-[#f97316]/60 bg-[#f97316]/10 px-2 py-0.5 rounded-full">
                🔥 FULL SET BONUS • {eff.setBonus.setName} (+{FULL_SET_BONUS.atk}/{FULL_SET_BONUS.def}/{FULL_SET_BONUS.spd})
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="border border-gray-800 rounded-xl p-2 bg-gray-950/30">
            <div className="text-gray-400">HP</div>
            <div className="font-bold text-gray-100">{playerHp}/{playerMaxHp}</div>
          </div>
          <div className="border border-gray-800 rounded-xl p-2 bg-gray-950/30">
            <div className="text-gray-400">MP</div>
            <div className="font-bold text-gray-100">{mp}/50</div>
          </div>
          <div className="border border-gray-800 rounded-xl p-2 bg-gray-950/30">
            <div className="text-gray-400">ATK / DEF / SPD</div>
            <div className="font-bold text-gray-100">{eff.total.atk} / {eff.total.def} / {eff.total.spd}</div>
          </div>
          <div className="border border-gray-800 rounded-xl p-2 bg-gray-950/30">
            <div className="text-gray-400">Potions (cap 5)</div>
            <div className="font-bold text-gray-100">🧪 {pots.healing} • 🔷 {pots.mana} • ✨ {pots.elixir}</div>
          </div>
        </div>
      </div>

      {/* Menu: level map */}
      {!started ? (
        <div className="mt-6 border border-gray-800 bg-gray-900 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold">🗺️ Level Map</div>
              <div className="text-[11px] text-gray-500 mt-1">Locked levels require clearing the previous boss.</div>
            </div>
            <a href="/stats" className="text-xs text-indigo-300 underline">Stats</a>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {DUNGEON_LEVELS.map((lv) => {
              const unlocked = canSelectLevel(lv.level)
              const active = selectedLevel === lv.level
              return (
                <button
                  key={lv.level}
                  disabled={!unlocked}
                  onClick={() => setSelectedLevel(lv.level)}
                  className={`text-left border rounded-2xl p-3 ${active ? "border-indigo-500 bg-indigo-500/10" : "border-gray-800 bg-gray-950/30"} ${!unlocked ? "opacity-50" : "hover:border-gray-600"}`}
                >
                  <div className="text-xs font-extrabold">Level {lv.level} {unlocked ? "" : "🔒"}</div>
                  <div className="text-[11px] text-gray-400 mt-1 truncate">{lv.name}</div>
                  <div className="text-[11px] text-gray-500">{lv.difficulty} • Reward: {lv.unlockRewardRarity}</div>
                </button>
              )
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => startRun(selectedLevel, 1).catch(() => {})}
              className="bg-yellow-600 hover:bg-yellow-500 text-white font-extrabold py-3 rounded-xl"
            >
              ▶ Start Level {selectedLevel}
            </button>
            <button
              onClick={() => startRun(progress.current_level, progress.current_floor).catch(() => {})}
              className="bg-purple-700 hover:bg-purple-600 text-white font-extrabold py-3 rounded-xl"
            >
              ⏵ Resume
            </button>
          </div>

          <div className="mt-3 text-[11px] text-gray-500">
            Current progress: Level {progress.current_level} • Floor {progress.current_floor}/10 • Highest cleared: Level {progress.highest_level_cleared}
          </div>
        </div>
      ) : null}

      {/* End states */}
      {started && wonGame ? (
        <div className="mt-6 border border-yellow-500/40 bg-yellow-500/10 rounded-2xl p-5">
          <div className="text-lg font-extrabold text-yellow-200">🏆 Dungeon Cleared (100 floors)!</div>
          <div className="text-xs text-gray-300 mt-1">Final score saved to points. Run gold added to your wallet gold.</div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="border border-gray-800 rounded-xl p-2 bg-gray-950/30">⭐ Score: <span className="font-bold">{runScore}</span></div>
            <div className="border border-gray-800 rounded-xl p-2 bg-gray-950/30">🪙 Gold gained: <span className="font-bold">{runGold}</span></div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              disabled={busy}
              onClick={() => doMintVictory().catch(() => {})}
              className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-extrabold py-3 rounded-xl"
            >
              {busy ? "Processing…" : "⛓ Mint Victory Badge (0.0002 ETH)"}
            </button>
            <button onClick={doShare} className="w-full bg-indigo-700 hover:bg-indigo-600 text-white font-extrabold py-3 rounded-xl">Share</button>
            <button onClick={leaveToMenu} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-extrabold py-3 rounded-xl">Back to Map</button>
          </div>
        </div>
      ) : null}

      {started && dead ? (
        <div className="mt-6 border border-red-500/40 bg-red-500/10 rounded-2xl p-5">
          <div className="text-lg font-extrabold text-red-200">💀 You Died</div>
          <div className="text-xs text-gray-300 mt-1">Collected items you saved are kept. Run gold is still awarded.</div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="border border-gray-800 rounded-xl p-2 bg-gray-950/30">Reached: <span className="font-bold">L{level} F{floor}/10</span></div>
            <div className="border border-gray-800 rounded-xl p-2 bg-gray-950/30">⭐ Score: <span className="font-bold">{runScore}</span></div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              disabled={busy || revived}
              onClick={() => doRevive().catch(() => {})}
              className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-extrabold py-3 rounded-xl"
            >
              {revived ? "Revive used" : busy ? "Processing…" : "❤️ Revive (0.0002 ETH)"}
            </button>
            <button onClick={doShare} className="w-full bg-indigo-700 hover:bg-indigo-600 text-white font-extrabold py-3 rounded-xl">Share</button>
            <button onClick={leaveToMenu} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-extrabold py-3 rounded-xl">Back to Map</button>
          </div>
        </div>
      ) : null}

      {/* Active room */}
      {started && !dead && !wonGame ? (
        <div className="mt-6 border border-gray-800 bg-gray-900 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="font-extrabold">
              {room === "battle" ? "⚔️ Battle" : room === "boss" ? "🐉 Boss" : room === "treasure" ? "💰 Treasure" : room === "shop" ? "🏪 Shop" : room === "trap" ? "⚠️ Trap" : "🌟 Shrine"}
            </div>
            <div className="text-xs text-gray-500">Depth {depth}/100</div>
          </div>

          {(room === "battle" || room === "boss") && enemy ? (
            <div className="mt-3">
              <div className="flex items-center justify-between border border-gray-800 rounded-xl p-3 bg-gray-950/30">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{enemy.emoji}</div>
                  <div>
                    <div className="font-bold text-sm text-red-200">{enemy.name}</div>
                    <div className="text-[11px] text-gray-400">ATK {enemy.atk} • DEF {enemy.def} • SPD {enemy.spd}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">HP</div>
                  <div className="font-extrabold text-sm text-gray-100">{enemy.hp}/{enemy.maxHp}</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button disabled={!inBattle || !playerTurn} onClick={doAttack} className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-extrabold py-3 rounded-xl text-sm">Attack</button>
                <button disabled={!inBattle || !playerTurn} onClick={doDefend} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-extrabold py-3 rounded-xl text-sm">Defend</button>
                <button disabled={!inBattle || !playerTurn} onClick={doSkill} className="bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-extrabold py-3 rounded-xl text-sm">Skill (25 MP)</button>
                <div className="grid grid-cols-3 gap-1">
                  <button disabled={!inBattle || !playerTurn || pots.healing <= 0} onClick={() => usePotion("healing")} className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-[11px]">🧪 {pots.healing}</button>
                  <button disabled={!inBattle || !playerTurn || pots.mana <= 0} onClick={() => usePotion("mana")} className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-[11px]">🔷 {pots.mana}</button>
                  <button disabled={!inBattle || !playerTurn || pots.elixir <= 0} onClick={() => usePotion("elixir")} className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-[11px]">✨ {pots.elixir}</button>
                </div>
              </div>

              {!inBattle ? (
                <button onClick={() => nextFloor().catch(() => {})} className="mt-4 w-full bg-yellow-600 hover:bg-yellow-500 text-white font-extrabold py-3 rounded-xl">
                  ▶ Continue
                </button>
              ) : (
                <div className="mt-3 text-xs text-gray-400">{playerTurn ? "Your turn" : "Enemy turn"}</div>
              )}
            </div>
          ) : null}

          {room === "shop" ? (
            <div className="mt-3">
              <div className="text-xs text-gray-400">Buys spend your wallet gold (hero-pull-gold) and save items to inventory.</div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {shopItems.map((it) => (
                  <div key={it.id} className={`border-2 rounded-xl p-3 bg-gray-950/30 ${rarityBorder(it.rarity)}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-extrabold text-sm">{it.imageEmoji} {it.name}</div>
                        <div className="text-[11px] text-gray-400">{it.rarity} • {slotLabel(it.slot)}{it.set ? ` • Set ${it.set}` : ""}</div>
                        <div className="text-[11px] text-gray-300 mt-1">+{it.bonusATK} ATK • +{it.bonusDEF} DEF • +{it.bonusSPD} SPD</div>
                      </div>
                      <button disabled={busy} onClick={() => buyShopItem(it).catch(() => {})} className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-extrabold py-2 px-3 rounded-xl text-xs">Buy</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => nextFloor().catch(() => {})} className="mt-4 w-full bg-yellow-600 hover:bg-yellow-500 text-white font-extrabold py-3 rounded-xl">▶ Leave Shop</button>
            </div>
          ) : null}

          {room === "trap" ? (
            <div className="mt-3">
              <div className="text-xs text-gray-400">A pressure plate blocks your way.</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={doTrapDisarm} className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 rounded-xl text-sm">Disarm (55%)</button>
                <button onClick={doTrapTank} className="bg-red-600 hover:bg-red-500 text-white font-extrabold py-3 rounded-xl text-sm">Tank it</button>
              </div>
              <button onClick={() => nextFloor().catch(() => {})} className="mt-4 w-full bg-yellow-600 hover:bg-yellow-500 text-white font-extrabold py-3 rounded-xl">▶ Continue</button>
            </div>
          ) : null}

          {room === "blessing" ? (
            <div className="mt-3">
              <div className="text-xs text-gray-400">Accept a random blessing.</div>
              <button onClick={doBlessing} className="mt-3 w-full bg-purple-700 hover:bg-purple-600 text-white font-extrabold py-3 rounded-xl">Accept Blessing</button>
              <button onClick={() => nextFloor().catch(() => {})} className="mt-3 w-full bg-yellow-600 hover:bg-yellow-500 text-white font-extrabold py-3 rounded-xl">▶ Continue</button>
            </div>
          ) : null}

          {room === "treasure" ? (
            <div className="mt-3">
              <div className="text-xs text-gray-400">You explore the room and collect what you can.</div>
              <button onClick={() => nextFloor().catch(() => {})} className="mt-4 w-full bg-yellow-600 hover:bg-yellow-500 text-white font-extrabold py-3 rounded-xl">▶ Continue</button>
            </div>
          ) : null}

          {/* Loot */}
          {loot ? (
            <div className={`mt-4 border-2 rounded-2xl p-4 bg-gray-950/30 ${rarityBorder(loot.rarity)}`}>
              <div className="text-sm font-extrabold">🎁 Loot</div>
              <div className="mt-1 text-xs text-gray-300 font-bold">{loot.imageEmoji} {loot.name}</div>
              <div className="text-[11px] text-gray-400">{loot.rarity} • {slotLabel(loot.slot)}{loot.set ? ` • Set ${loot.set}` : ""}</div>
              <div className="text-[11px] text-gray-300 mt-1">+{loot.bonusATK} ATK • +{loot.bonusDEF} DEF • +{loot.bonusSPD} SPD</div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => equipItem(loot)} className="bg-green-700 hover:bg-green-600 text-white font-extrabold py-2 rounded-xl text-xs">Equip</button>
                <button disabled={busy} onClick={() => saveLootToInventory(loot).catch(() => {})} className="bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white font-extrabold py-2 rounded-xl text-xs">Save</button>
              </div>
              <div className="mt-2 text-[11px] text-gray-500">Equip updates your hero’s equipped items; Save adds it to your inventory.</div>
            </div>
          ) : null}

          {wonLevel ? (
            <div className="mt-4 border border-indigo-500/40 bg-indigo-500/10 rounded-2xl p-4">
              <div className="text-sm font-extrabold text-indigo-200">✅ Level {level} cleared</div>
              <div className="text-[11px] text-gray-400 mt-1">Next level unlocked (if available). Continue to proceed.</div>
            </div>
          ) : null}

          {/* Log */}
          <div className="mt-4 border border-gray-800 bg-black/20 rounded-xl p-3 text-[11px] text-gray-400 leading-relaxed max-h-52 overflow-auto">
            {log.length ? log.map((l, i) => <div key={i}>{l}</div>) : <div>(log)</div>}
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={doShare} className="flex-1 bg-indigo-700 hover:bg-indigo-600 text-white font-extrabold py-2 rounded-xl text-xs">Share</button>
            <button onClick={leaveToMenu} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-extrabold py-2 rounded-xl text-xs">Quit</button>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-2">
        <a href="/arena" className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold py-3 rounded-xl text-center">Back to Arena</a>
        <a href="/collection" className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold py-3 rounded-xl text-center">Heroes</a>
      </div>
    </div>
  )
}
