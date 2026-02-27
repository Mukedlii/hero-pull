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

  const baseStat = 10 + Number(seedBig % 31n) // 10..40
  const bump = tier === 3 ? 30 : tier === 2 ? 20 : tier === 1 ? 10 : 0

  const level = 1 + Number(seedBig % 10n)

  return {
    ...base,
    rarity,
    level,
    attack: baseStat + bump,
    defense: baseStat + bump,
    speed: baseStat + bump,
    power: base.power,
  }
}
