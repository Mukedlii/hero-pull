import { getEquippedBonuses, getSetBonus, type EquippedItems } from "@/lib/items"

export type PvPRole = "p1" | "p2"

export type PvPHero = {
  tokenId: string
  name: string
  rarity: string
  level: number
  health: number
  power: number
  defense: number
  luck: number
  imageUrl: string
  equippedItems?: EquippedItems
}

export type PvPState = {
  turn: PvPRole
  turnEndsAt: number // ms epoch
  log: string[]
  p1: { hp: number; maxHp: number; potions: number; defending: boolean }
  p2: { hp: number; maxHp: number; potions: number; defending: boolean }
  turnIndex: number
  finished: boolean
  winner?: PvPRole
}

export type PvPMove = "attack" | "defend" | "potion"

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function effectiveStats(h: PvPHero) {
  const itemBonus = getEquippedBonuses(h.equippedItems)
  const setBonus = getSetBonus(h.equippedItems)
  return {
    hp: h.health,
    pwr: h.power + itemBonus.pwr + setBonus.pwr,
    def: h.defense + itemBonus.def + setBonus.def,
    lck: h.luck + itemBonus.lck + setBonus.lck,
  }
}

export function baseHp(h: PvPHero) {
  const eff = effectiveStats(h)
  const hp = 60 + Math.floor(h.level * 6) + Math.floor(eff.hp * 3.0) + Math.floor(eff.def * 1.0)
  return clamp(hp, 70, 520)
}

export function startState(p1Hero: PvPHero, p2Hero: PvPHero, nowMs: number, turnMs: number): PvPState {
  const p1hp = baseHp(p1Hero)
  const p2hp = baseHp(p2Hero)
  const first: PvPRole = effectiveStats(p1Hero).lck >= effectiveStats(p2Hero).lck ? "p1" : "p2"
  return {
    turn: first,
    turnEndsAt: nowMs + turnMs,
    turnIndex: 0,
    finished: false,
    log: ["Match started", `First turn: ${first.toUpperCase()}`],
    p1: { hp: p1hp, maxHp: p1hp, potions: 1, defending: false },
    p2: { hp: p2hp, maxHp: p2hp, potions: 1, defending: false },
  }
}

export function applyMove(
  state: PvPState,
  mover: PvPRole,
  move: PvPMove,
  heroes: { p1: PvPHero; p2: PvPHero },
  nowMs: number,
  turnMs: number
): PvPState {
  if (state.finished) return state
  if (state.turn !== mover) return state

  const next: PvPState = JSON.parse(JSON.stringify(state))

  const self = mover === "p1" ? next.p1 : next.p2
  const opp = mover === "p1" ? next.p2 : next.p1
  const selfHero = mover === "p1" ? heroes.p1 : heroes.p2
  const oppHero = mover === "p1" ? heroes.p2 : heroes.p1

  // reset defend after it affected one hit
  const oppDefMult = opp.defending ? 0.5 : 1
  opp.defending = false

  if (move === "defend") {
    self.defending = true
    next.log.push(`${mover.toUpperCase()} defends`) 
  } else if (move === "potion") {
    if (self.potions <= 0) {
      next.log.push(`${mover.toUpperCase()} tried potion (none)`) 
    } else {
      self.potions -= 1
      const heal = Math.floor(self.maxHp * 0.35)
      self.hp = clamp(self.hp + heal, 0, self.maxHp)
      next.log.push(`${mover.toUpperCase()} uses potion +${heal}`)
    }
  } else {
    // attack
    const selfEff = effectiveStats(selfHero)
    const oppEff = effectiveStats(oppHero)
    const baseRaw = Math.floor(selfEff.pwr * (0.8 + (next.turnIndex % 3) * 0.05))

    const critChance = Math.min(0.6, 0.10 + (selfEff.lck / 10) * 0.01)
    const crit = Math.random() < critChance

    const raw = crit ? Math.floor(baseRaw * 1.9) : baseRaw
    const mitigated = Math.floor(oppEff.def * 0.35)
    const dmg = clamp(Math.floor((raw - mitigated) * oppDefMult), 1, 999)
    opp.hp = clamp(opp.hp - dmg, 0, opp.maxHp)
    next.log.push(crit ? `${mover.toUpperCase()} CRIT -${dmg}` : `${mover.toUpperCase()} attacks -${dmg}`)
  }

  if (opp.hp <= 0) {
    next.finished = true
    next.winner = mover
    next.log.push(`${mover.toUpperCase()} wins`) 
    return next
  }

  next.turn = mover === "p1" ? "p2" : "p1"
  next.turnIndex += 1
  next.turnEndsAt = nowMs + turnMs
  return next
}
