import { HEROES, type Hero } from '@/lib/heroes'

// Deterministic PRNG (mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function rarityFromRng(r: number): Hero['rarity'] {
  // Similar to current generateRarity(): tweak as desired
  if (r < 0.03) return 'Legendary'
  if (r < 0.15) return 'Epic'
  if (r < 0.4) return 'Rare'
  return 'Common'
}

export function heroFromTokenId(tokenId: bigint): Hero {
  const seed = Number(tokenId % 2147483647n) || 1
  const rand = mulberry32(seed)

  const rarity = rarityFromRng(rand())

  // Pick a hero name deterministically.
  const idx = Math.floor(rand() * HEROES.length)
  const base = HEROES[idx]

  // Derive stats deterministically but stable.
  const level = 1 + Math.floor(rand() * 10)
  const bump = rarity === 'Legendary' ? 10 : rarity === 'Epic' ? 6 : rarity === 'Rare' ? 3 : 0

  return {
    ...base,
    rarity,
    level,
    attack: base.attack + bump,
    defense: base.defense + bump,
    speed: base.speed + bump,
    power: base.power + bump * 3,
  }
}
