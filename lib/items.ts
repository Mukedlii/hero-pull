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
  imageUrl?: string
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

function getItemImageUrl(slot: ItemSlot, rarity: ItemRarity, setName?: string): string {
  if (rarity === "Set" && setName) {
    return `/items/${slot}_set_${setName.toLowerCase()}.png`
  }
  return `/items/${slot}_${rarity.toLowerCase()}.png`
}

const itemNames: Record<ItemSlot, Record<Exclude<ItemRarity, "Set">, string[]>> = {
  weapon: {
    Common: ["Iron Blade", "Rusty Saber", "Soldier's Knife", "Worn Hatchet", "Militia Spear", "Scout Dagger", "Copper Mace"],
    Rare: ["Steel Edge", "Knight Saber", "Storm Pike", "Gleam Cutter", "War Hammer", "Frost Cleaver", "Silver Rapier"],
    Epic: ["Shadow Slicer", "Wraithfang", "Voidbrand", "Nightfall Axe", "Doom Halberd", "Soul Reaver", "Phantom Scythe"],
    Legendary: ["Divine Sword", "Sunpiercer", "Mythic Greatblade", "Eternity Edge", "Godslayer", "Starforged Glaive", "Archangel Blade"],
  },
  shield: {
    Common: ["Wooden Guard", "Tin Buckler", "Pine Wall", "Militia Shield", "Hide Barrier"],
    Rare: ["Iron Wall", "Aegis Plate", "Guardian Disc", "Templar Shield", "Frost Guard"],
    Epic: ["Void Barrier", "Nightguard", "Astral Bulwark", "Phantom Ward", "Eclipse Aegis"],
    Legendary: ["Celestial Shield", "Starward Aegis", "Godwall", "Divine Fortress", "Eternal Bastion"],
  },
  boots: {
    Common: ["Leather Boots", "Trail Treads", "Worn Runners", "Cloth Sandals", "Scout Shoes"],
    Rare: ["Swift Runners", "Windwalkers", "Fleet Steps", "Gale Treads", "Storm Striders"],
    Epic: ["Shadow Steps", "Blink Striders", "Umbral Greaves", "Phase Boots", "Nightstep Sabatons"],
    Legendary: ["Lightning Boots", "Thunder Greaves", "Eternal Sprint", "Celestial Treads", "Godspeed Sabatons"],
  },
  helmet: {
    Common: ["Copper Helm", "Cloth Hood", "Dented Cap", "Scout Cap", "Tin Visor"],
    Rare: ["Steel Crown", "Vanguard Helm", "Lion Visor", "Knight Sallet", "Battle Coif"],
    Epic: ["Dark Visor", "Phantom Helm", "Nightwatch Mask", "Void Crown", "Eclipse Circlet"],
    Legendary: ["God Helmet", "Halo Crown", "Astral Diadem", "Seraph Helm", "Eternal Visage"],
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

function randRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateItemBonuses(rarity: Exclude<ItemRarity, "Set">, slot?: ItemSlot): { pwr: number; def: number; lck: number } {
  let pwr = 0
  let def = 0
  let lck = 0

  if (rarity === "Common") {
    if (slot === "weapon") { pwr = randRange(3, 7); def = 0; lck = randRange(0, 3) }
    else if (slot === "shield") { pwr = 0; def = randRange(3, 7); lck = randRange(0, 2) }
    else if (slot === "helmet") { pwr = randRange(0, 2); def = randRange(2, 5); lck = randRange(1, 3) }
    else { pwr = randRange(0, 2); def = randRange(1, 3); lck = randRange(2, 5) }
  } else if (rarity === "Rare") {
    if (slot === "weapon") { pwr = randRange(8, 14); def = randRange(0, 4); lck = randRange(2, 6) }
    else if (slot === "shield") { pwr = randRange(0, 3); def = randRange(8, 14); lck = randRange(2, 5) }
    else if (slot === "helmet") { pwr = randRange(2, 5); def = randRange(5, 10); lck = randRange(3, 7) }
    else { pwr = randRange(2, 5); def = randRange(3, 6); lck = randRange(6, 12) }
  } else if (rarity === "Epic") {
    if (slot === "weapon") { pwr = randRange(16, 24); def = randRange(3, 8); lck = randRange(4, 10) }
    else if (slot === "shield") { pwr = randRange(3, 6); def = randRange(16, 24); lck = randRange(4, 8) }
    else if (slot === "helmet") { pwr = randRange(6, 12); def = randRange(10, 18); lck = randRange(5, 10) }
    else { pwr = randRange(4, 8); def = randRange(5, 10); lck = randRange(14, 22) }
  } else {
    if (slot === "weapon") { pwr = randRange(28, 40); def = randRange(8, 16); lck = randRange(10, 18) }
    else if (slot === "shield") { pwr = randRange(8, 14); def = randRange(28, 40); lck = randRange(10, 16) }
    else if (slot === "helmet") { pwr = randRange(14, 22); def = randRange(20, 32); lck = randRange(12, 20) }
    else { pwr = randRange(10, 18); def = randRange(12, 20); lck = randRange(26, 38) }
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
      imageUrl: getItemImageUrl(slot, rarity, set),
      set,
    }
  }

  const slot = randomSlot()
  const name = pick(itemNames[slot][rarity])
  const { pwr, def, lck } = generateItemBonuses(rarity, slot)
  return {
    id,
    name,
    slot,
    rarity,
    bonusPWR: pwr,
    bonusDEF: def,
    bonusLCK: lck,
    imageEmoji: slotEmoji[slot],
    imageUrl: getItemImageUrl(slot, rarity),
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
