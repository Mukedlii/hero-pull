import { HEROES, type Hero } from "@/lib/heroes"

export type Tier = 0 | 1 | 2 | 3

export function tierToRarity(t: Tier): Hero["rarity"] {
  return t === 3 ? "Legendary" : t === 2 ? "Epic" : t === 1 ? "Rare" : "Common"
}

// Simple deterministic stats from seed + tier
export function heroFromSeedAndTier(seedBig: bigint, tokenId: bigint, tier: Tier): Hero {
  const idx = Number((seedBig ^ (tokenId * 9973n)) % BigInt(HEROES.length))
  const base = HEROES[(idx + HEROES.length) % HEROES.length]

  const rarity = tierToRarity(tier)

  // Keep stat ordering strict by tier (so Legendary > Epic > Rare > Common)
  // while still having some deterministic variance.
  const roll = Number(seedBig % 16n) // 0..15
  const tierMin = tier === 3 ? 40 : tier === 2 ? 30 : tier === 1 ? 20 : 10
  const baseStat = tierMin + roll // Common 10..25, Rare 20..35, Epic 30..45, Legendary 40..55

  const level = 1 + Number(seedBig % 10n)

  return {
    ...base,
    rarity,
    level,
    attack: baseStat,
    defense: baseStat,
    speed: baseStat,
    power: base.power,
  }
}
