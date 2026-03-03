import type { EquippedItems } from "@/lib/items"
import { type HeroLayers, randomLayers, heroImageUrl } from "@/lib/heroLayers"

export type Hero = {
  name: string
  gender: "Male" | "Female" | "Unknown"
  /** Ability name (formerly `power`) */
  ability: string
  rarity: "Common" | "Rare" | "Epic" | "Legendary"
  imageUrl: string
  layers?: HeroLayers

  /** ❤️ Health (HP pool) */
  health: number
  /** ⚔️ Power (damage dealt) */
  power: number
  /** 🛡️ Defense (damage reduction) */
  defense: number
  /** 🍀 Luck (crit chance + drop rate) */
  luck: number

  xp: number
  level: number

  /** Four gear slots: weapon/shield/boots/helmet */
  equippedItems?: EquippedItems
  dbId?: string
}

/**
 * Backward-compatible coercion for heroes stored in localStorage/Supabase.
 * Accepts legacy shape: { attack, defense, speed, power } where `power` used to be ability.
 */
export function coerceHero(raw: any): Hero | null {
  if (!raw || typeof raw !== "object") return null

  const name = typeof raw.name === "string" ? raw.name : "Hero"
  const rarity = (raw.rarity as Hero["rarity"]) || "Common"
  const gender = (raw.gender as Hero["gender"]) || "Unknown"
  const imageUrl = typeof raw.imageUrl === "string" ? raw.imageUrl : "/og.png"

  // New shape
  const hasNewStats = raw.health != null || raw.luck != null || raw.ability != null

  // Legacy shape
  const legacyAttack = raw.attack
  const legacyDefense = raw.defense
  const legacySpeed = raw.speed
  const legacyPower = raw.power

  const num = (v: any, fallback: number) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }

  const xp = num(raw.xp, 0)
  const level = num(raw.level, 1)

  const layers: HeroLayers | undefined = raw.layers && typeof raw.layers === "object"
    ? raw.layers as HeroLayers
    : undefined

  const resolvedImageUrl = layers ? heroImageUrl(layers, rarity) : imageUrl

  if (hasNewStats) {
    const ability = typeof raw.ability === "string" ? raw.ability : typeof legacyPower === "string" ? legacyPower : "Unknown"
    return {
      name,
      gender,
      ability,
      rarity,
      imageUrl: resolvedImageUrl,
      layers,
      health: num(raw.health, num(legacyAttack, 10)),
      power: num(raw.power, num(legacyAttack, 10)),
      defense: num(raw.defense, num(legacyDefense, 10)),
      luck: num(raw.luck, num(legacySpeed, 10)),
      xp,
      level,
      equippedItems: raw.equippedItems ?? undefined,
      dbId: typeof raw.dbId === "string" ? raw.dbId : undefined,
    }
  }

  // Pure legacy
  const ability = typeof legacyPower === "string" ? legacyPower : "Unknown"
  return {
    name,
    gender,
    ability,
    rarity,
    imageUrl: resolvedImageUrl,
    layers,
    health: num(legacyAttack, 10),
    power: num(legacyAttack, 10),
    defense: num(legacyDefense, 10),
    luck: num(legacySpeed, 10),
    xp,
    level,
    equippedItems: raw.equippedItems ?? undefined,
    dbId: typeof raw.dbId === "string" ? raw.dbId : undefined,
  }
}

const names = [
  "Blood Reaver",
  "Void Sorceress",
  "Bone Lord",
  "Dawn Crusader",
  "Shadow Fang",
  "Iron Warlord",
  "Wild Shaman",
  "Crimson Hunter",
  "Frost Weaver",
  "Doom Knight",
  "Inferno Mage",
  "Divine Oracle",
  "Phantom Monk",
  "Blood Prince",
  "Stone Titan",
  "Grim Stalker",
  "Storm Herald",
  "Plague Walker",
  "Astral Archer",
  "Rage Berserker",
  "Death Warden",
  "War Maiden",
  "Dune Prophet",
  "Frost Queen",
  "Night Blade",
  "Rune Forger",
  "Ghost Walker",
  "Hex Warlock",
  "Dragon Slayer",
  "Arcane Sentinel",
  "Venom Blade",
  "Blood Mage",
  "Titan Guard",
  "Lunar Knight",
  "Chaos Weaver",
  "Iron Maiden",
  "Soul Reaper",
  "Crystal Sage",
  "Wind Dancer",
  "Hellfire Demon",
  "Cursed Captain",
  "War Priest",
  "Shadow Archer",
  "Beast Lord",
  "Enchantress",
  "Fallen Angel",
  "Mad Alchemist",
  "Grove Warden",
  "Void Mage",
  "Thunder God",
  "Oni Samurai",
  "Clockwork Knight",
  "Dark Witch",
  "Arena Champion",
  "Lich King",
]

const abilities = [
  "Time Freeze",
  "Mind Control",
  "Super Speed",
  "Telekinesis",
  "Invisibility",
  "Reality Shift",
  "Lightning Strike",
  "Shadow Clone",
  "Elemental Burst",
  "Healing Touch",
  "Gravity Pull",
  "Fire Storm",
  "Ice Prison",
  "Thunder Smash",
  "Dark Void",
  "Light Beam",
  "Psychic Wave",
  "Force Shield",
  "Energy Drain",
  "Dimension Slash",
  "Plasma Cannon",
  "Sonic Boom",
  "Meteor Strike",
  "Earthquake Fist",
  "Wind Slash",
]

const genders: Hero["gender"][] = ["Male", "Female", "Unknown"]

export function generateRarity(): Hero["rarity"] {
  const roll = Math.random() * 100
  if (roll < 60) return "Common"
  if (roll < 85) return "Rare"
  if (roll < 97) return "Epic"
  return "Legendary"
}

function generateStatForRarity(rarity: Hero["rarity"]): number {
  // Keep values reasonable (used as HP pool / power / defense / luck).
  const ranges: Record<Hero["rarity"], [number, number]> = {
    Common: [10, 25],
    Rare: [20, 35],
    Epic: [30, 45],
    Legendary: [40, 55],
  }
  const [min, max] = ranges[rarity]
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const HEROES: Hero[] = names.map((name, i) => {
  const ability = abilities[i % abilities.length]
  const filename = name.toLowerCase().replace(/ /g, "_") + ".png"
  const imageUrl = `/heroes/${filename}`
  return {
    name,
    gender: "Unknown",
    ability,
    rarity: "Common",
    imageUrl,
    health: 10,
    power: 10,
    defense: 10,
    luck: 10,
    xp: 0,
    level: 1,
  }
})

export function generateHero(): Hero {
  const name = names[Math.floor(Math.random() * names.length)]
  const gender = genders[Math.floor(Math.random() * genders.length)]
  const ability = abilities[Math.floor(Math.random() * abilities.length)]
  const rarity = generateRarity()
  const layers = randomLayers()
  const imageUrl = heroImageUrl(layers, rarity)
  return {
    name,
    gender,
    ability,
    rarity,
    imageUrl,
    layers,
    health: generateStatForRarity(rarity),
    power: generateStatForRarity(rarity),
    defense: generateStatForRarity(rarity),
    luck: generateStatForRarity(rarity),
    xp: 0,
    level: 1,
  }
}
