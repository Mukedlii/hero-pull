import { HEROES, type Hero } from "@/lib/heroes"
import { LAYER_OPTIONS, type HeroLayers, heroImageUrl } from "@/lib/heroLayers"

export type Tier = 0 | 1 | 2 | 3

export function tierToRarity(t: Tier): Hero["rarity"] {
  return t === 3 ? "Legendary" : t === 2 ? "Epic" : t === 1 ? "Rare" : "Common"
}

function deterministicPick<T>(arr: readonly T[], seed: bigint, offset: bigint): T {
  const idx = Number((seed ^ offset) % BigInt(arr.length))
  return arr[(idx + arr.length) % arr.length]
}

export function heroFromSeedAndTier(seedBig: bigint, tokenId: bigint, tier: Tier): Hero {
  const idx = Number((seedBig ^ (tokenId * 9973n)) % BigInt(HEROES.length))
  const base = HEROES[(idx + HEROES.length) % HEROES.length]

  const rarity = tierToRarity(tier)

  const roll = Number(seedBig % 16n)
  const tierMin = tier === 3 ? 40 : tier === 2 ? 30 : tier === 1 ? 20 : 10
  const baseStat = tierMin + roll

  const level = 1 + Number(seedBig % 10n)

  const layers: HeroLayers = {
    char: deterministicPick(LAYER_OPTIONS.chars, seedBig, 1n),
    overlay: Number((seedBig >> 8n) % 2n) === 0
      ? deterministicPick(LAYER_OPTIONS.overlays, seedBig, 2n)
      : null,
  }

  const imageUrl = heroImageUrl(layers, rarity)

  return {
    ...base,
    rarity,
    level,
    health: baseStat,
    power: baseStat,
    defense: baseStat,
    luck: baseStat,
    ability: base.ability,
    imageUrl,
    layers,
  }
}
