export const STAT_CAP = 999 as const

export type ItemRarity = "Common" | "Rare" | "Epic" | "Legendary" | "Set"
export type ItemSlot = "weapon" | "shield" | "boots" | "helmet"

export type Item = {
  id: string
  name: string
  slot: ItemSlot
  rarity: ItemRarity
  bonusATK: number
  bonusDEF: number
  bonusSPD: number
  imageEmoji: string
  /** Present only for Set items */
  set?: string
}

export type EquippedItems = Partial<Record<ItemSlot, Item>>

export const FULL_SET_BONUS = { atk: 200, def: 200, spd: 200 } as const

const slotEmoji: Record<ItemSlot, string> = {
  weapon: "⚔️",
  shield: "🛡️",
  boots: "👢",
  helmet: "⛑️",
}

const itemNames: Record<ItemSlot, Record<Exclude<ItemRarity, "Set">, string[]>> = {
  weapon: {
    Common: ["Iron Blade", "Rusty Saber", "Soldier's Knife"],
    Rare: ["Steel Edge", "Knight's Rapier", "Gleam Cutter"],
    Epic: ["Shadow Slicer", "Wraithfang", "Voidbrand"],
    Legendary: ["Divine Sword", "Sunpiercer", "Mythic Greatblade"],
  },
  shield: {
    Common: ["Wooden Guard", "Tin Buckler", "Pine Wall"],
    Rare: ["Iron Wall", "Aegis Plate", "Guardian Disc"],
    Epic: ["Void Barrier", "Nightguard", "Astral Bulwark"],
    Legendary: ["Celestial Shield", "Starward Aegis", "Godwall"],
  },
  boots: {
    Common: ["Leather Boots", "Trail Treads", "Worn Runners"],
    Rare: ["Swift Runners", "Windwalkers", "Fleet Steps"],
    Epic: ["Shadow Steps", "Blink Striders", "Umbral Greaves"],
    Legendary: ["Lightning Boots", "Thunder Greaves", "Eternal Sprint"],
  },
  helmet: {
    Common: ["Copper Helm", "Cloth Hood", "Dented Cap"],
    Rare: ["Steel Crown", "Vanguard Helm", "Lion Visor"],
    Epic: ["Dark Visor", "Phantom Helm", "Nightwatch Mask"],
    Legendary: ["God Helmet", "Halo Crown", "Astral Diadem"],
  },
}

// --- Sets ---

type SetName = "Sunfire" | "Duskveil"

const setPieces: Record<SetName, Record<ItemSlot, Omit<Item, "id" | "rarity" | "slot" | "set"> & { name: string }>> = {
  Sunfire: {
    weapon: { name: "Sunfire Blade", bonusATK: 60, bonusDEF: 10, bonusSPD: 10, imageEmoji: "🔥" },
    shield: { name: "Sunfire Bulwark", bonusATK: 10, bonusDEF: 60, bonusSPD: 10, imageEmoji: "🔥" },
    boots: { name: "Sunfire Striders", bonusATK: 10, bonusDEF: 10, bonusSPD: 60, imageEmoji: "🔥" },
    helmet: { name: "Sunfire Crown", bonusATK: 25, bonusDEF: 25, bonusSPD: 25, imageEmoji: "🔥" },
  },
  Duskveil: {
    weapon: { name: "Duskveil Fang", bonusATK: 55, bonusDEF: 15, bonusSPD: 15, imageEmoji: "🌙" },
    shield: { name: "Duskveil Guard", bonusATK: 15, bonusDEF: 55, bonusSPD: 15, imageEmoji: "🌙" },
    boots: { name: "Duskveil Steps", bonusATK: 15, bonusDEF: 15, bonusSPD: 55, imageEmoji: "🌙" },
    helmet: { name: "Duskveil Visor", bonusATK: 20, bonusDEF: 20, bonusSPD: 20, imageEmoji: "🌙" },
  },
}

export function generateItemRarity(): ItemRarity {
  // Common 55, Rare 28, Epic 14, Legendary 2, Set 1
  const roll = Math.random() * 100
  if (roll < 55) return "Common"
  if (roll < 83) return "Rare"
  if (roll < 97) return "Epic"
  if (roll < 99) return "Legendary"
  return "Set"
}

function randomSlot(): ItemSlot {
  const slots: ItemSlot[] = ["weapon", "shield", "boots", "helmet"]
  return slots[Math.floor(Math.random() * slots.length)]
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateItemBonuses(rarity: Exclude<ItemRarity, "Set">): { atk: number; def: number; spd: number } {
  // Keep the same feel as the old weapon system.
  let atk = 0
  let def = 0
  let spd = 0

  if (rarity === "Common") {
    const stats: Array<"atk" | "def" | "spd"> = ["atk", "def", "spd"]
    const chosen = pick(stats)
    if (chosen === "atk") atk = 5
    if (chosen === "def") def = 5
    if (chosen === "spd") spd = 5
  } else if (rarity === "Rare") {
    const stats: Array<"atk" | "def" | "spd"> = ["atk", "def", "spd"]
    const first = pick(stats)
    const remaining = stats.filter((s) => s !== first)
    const second = pick(remaining)
    if (first === "atk") atk = 10
    if (first === "def") def = 10
    if (first === "spd") spd = 10
    if (second === "atk") atk += 5
    if (second === "def") def += 5
    if (second === "spd") spd += 5
  } else if (rarity === "Epic") {
    atk = 15
    def = 10
    spd = 5
  } else {
    // Legendary
    atk = 25
    def = 25
    spd = 25
  }

  return { atk, def, spd }
}

export function generateItem(): Item {
  const rarity = generateItemRarity()
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

  if (rarity === "Set") {
    const sets = Object.keys(setPieces) as SetName[]
    const set = pick(sets)
    const slot = randomSlot()
    const piece = setPieces[set][slot]
    return {
      id,
      name: piece.name,
      slot,
      rarity,
      bonusATK: piece.bonusATK,
      bonusDEF: piece.bonusDEF,
      bonusSPD: piece.bonusSPD,
      imageEmoji: piece.imageEmoji,
      set,
    }
  }

  const slot = randomSlot()
  const name = pick(itemNames[slot][rarity])
  const { atk, def, spd } = generateItemBonuses(rarity)
  return {
    id,
    name,
    slot,
    rarity,
    bonusATK: atk,
    bonusDEF: def,
    bonusSPD: spd,
    imageEmoji: slotEmoji[slot],
  }
}

export function nextItemRarity(r: Exclude<ItemRarity, "Set">): Exclude<ItemRarity, "Set"> {
  if (r === "Common") return "Rare"
  if (r === "Rare") return "Epic"
  if (r === "Epic") return "Legendary"
  return "Legendary"
}

export function getEquippedBonuses(equipped: EquippedItems | undefined): { atk: number; def: number; spd: number } {
  const items = equipped ? Object.values(equipped).filter(Boolean) as Item[] : []
  return {
    atk: items.reduce((s, it) => s + (it.bonusATK || 0), 0),
    def: items.reduce((s, it) => s + (it.bonusDEF || 0), 0),
    spd: items.reduce((s, it) => s + (it.bonusSPD || 0), 0),
  }
}

export function getFullSetName(equipped: EquippedItems | undefined): string | null {
  if (!equipped) return null
  const slots: ItemSlot[] = ["weapon", "shield", "boots", "helmet"]
  const pieces = slots.map((s) => equipped[s]).filter(Boolean) as Item[]
  if (pieces.length !== 4) return null
  const set = pieces[0]?.set
  if (!set) return null
  if (pieces.every((p) => p.set === set && p.rarity === "Set")) return set
  return null
}

export function getSetBonus(equipped: EquippedItems | undefined): { atk: number; def: number; spd: number; setName: string | null } {
  const setName = getFullSetName(equipped)
  if (!setName) return { atk: 0, def: 0, spd: 0, setName: null }
  return { atk: FULL_SET_BONUS.atk, def: FULL_SET_BONUS.def, spd: FULL_SET_BONUS.spd, setName }
}
