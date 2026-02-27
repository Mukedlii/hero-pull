export const STAT_CAP = 999 as const

export type ItemRarity = "Common" | "Rare" | "Epic" | "Legendary" | "Set"
export type ItemSlot = "weapon" | "shield" | "boots" | "helmet"

export type Item = {
  id: string
  name: string
  slot: ItemSlot
  rarity: ItemRarity
  bonusPWR: number
  bonusDEF: number
  bonusLCK: number
  imageEmoji: string
  /** Present only for Set items */
  set?: string
}

export type EquippedItems = Partial<Record<ItemSlot, Item>>

export const FULL_SET_BONUS = { pwr: 200, def: 200, lck: 200 } as const

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

type SetName = "Dragon" | "Shadow"

const setPieces: Record<SetName, Record<ItemSlot, Omit<Item, "id" | "rarity" | "slot" | "set"> & { name: string }>> = {
  Dragon: {
    weapon: { name: "Dragonfang Blade", bonusPWR: 65, bonusDEF: 10, bonusLCK: 10, imageEmoji: "🐉" },
    shield: { name: "Dragonhide Aegis", bonusPWR: 10, bonusDEF: 65, bonusLCK: 10, imageEmoji: "🐉" },
    boots: { name: "Dragonstep Greaves", bonusPWR: 10, bonusDEF: 10, bonusLCK: 65, imageEmoji: "🐉" },
    helmet: { name: "Dragoncrest Helm", bonusPWR: 25, bonusDEF: 25, bonusLCK: 25, imageEmoji: "🐉" },
  },
  Shadow: {
    weapon: { name: "Shadowbrand", bonusPWR: 55, bonusDEF: 15, bonusLCK: 15, imageEmoji: "🕶️" },
    shield: { name: "Shadowguard", bonusPWR: 15, bonusDEF: 55, bonusLCK: 15, imageEmoji: "🕶️" },
    boots: { name: "Shadowstride", bonusPWR: 15, bonusDEF: 15, bonusLCK: 55, imageEmoji: "🕶️" },
    helmet: { name: "Shadowveil Visor", bonusPWR: 20, bonusDEF: 20, bonusLCK: 20, imageEmoji: "🕶️" },
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

export function generateItemBonuses(rarity: Exclude<ItemRarity, "Set">): { pwr: number; def: number; lck: number } {
  let pwr = 0
  let def = 0
  let lck = 0

  if (rarity === "Common") {
    const stats: Array<"pwr" | "def" | "lck"> = ["pwr", "def", "lck"]
    const chosen = pick(stats)
    if (chosen === "pwr") pwr = 5
    if (chosen === "def") def = 5
    if (chosen === "lck") lck = 5
  } else if (rarity === "Rare") {
    const stats: Array<"pwr" | "def" | "lck"> = ["pwr", "def", "lck"]
    const first = pick(stats)
    const remaining = stats.filter((s) => s !== first)
    const second = pick(remaining)
    if (first === "pwr") pwr = 10
    if (first === "def") def = 10
    if (first === "lck") lck = 10
    if (second === "pwr") pwr += 5
    if (second === "def") def += 5
    if (second === "lck") lck += 5
  } else if (rarity === "Epic") {
    pwr = 15
    def = 10
    lck = 5
  } else {
    // Legendary
    pwr = 25
    def = 25
    lck = 25
  }

  return { pwr, def, lck }
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
      bonusPWR: piece.bonusPWR,
      bonusDEF: piece.bonusDEF,
      bonusLCK: piece.bonusLCK,
      imageEmoji: piece.imageEmoji,
      set,
    }
  }

  const slot = randomSlot()
  const name = pick(itemNames[slot][rarity])
  const { pwr, def, lck } = generateItemBonuses(rarity)
  return {
    id,
    name,
    slot,
    rarity,
    bonusPWR: pwr,
    bonusDEF: def,
    bonusLCK: lck,
    imageEmoji: slotEmoji[slot],
  }
}

export function nextItemRarity(r: Exclude<ItemRarity, "Set">): Exclude<ItemRarity, "Set"> {
  if (r === "Common") return "Rare"
  if (r === "Rare") return "Epic"
  if (r === "Epic") return "Legendary"
  return "Legendary"
}

export function getEquippedBonuses(equipped: EquippedItems | undefined): { pwr: number; def: number; lck: number } {
  const items = equipped ? (Object.values(equipped).filter(Boolean) as Item[]) : []
  return {
    pwr: items.reduce((s, it) => s + (it.bonusPWR || 0), 0),
    def: items.reduce((s, it) => s + (it.bonusDEF || 0), 0),
    lck: items.reduce((s, it) => s + (it.bonusLCK || 0), 0),
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

export function getSetBonus(equipped: EquippedItems | undefined): { pwr: number; def: number; lck: number; setName: string | null } {
  const setName = getFullSetName(equipped)
  if (!setName) return { pwr: 0, def: 0, lck: 0, setName: null }
  return { pwr: FULL_SET_BONUS.pwr, def: FULL_SET_BONUS.def, lck: FULL_SET_BONUS.lck, setName }
}
