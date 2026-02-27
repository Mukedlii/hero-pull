import type { Weapon, WeaponRarity, WeaponType } from "@/lib/weapons"

type Template = Omit<Weapon, "id"> & { tokenId: number }

type Tier = { rarity: WeaponRarity; tier: number; atk: number; def: number; spd: number }

const TIERS: Tier[] = [
  { tier: 0, rarity: "Common", atk: 5, def: 0, spd: 0 },
  { tier: 1, rarity: "Rare", atk: 10, def: 5, spd: 0 },
  { tier: 2, rarity: "Epic", atk: 15, def: 10, spd: 5 },
  { tier: 3, rarity: "Legendary", atk: 25, def: 25, spd: 25 },
]

const TYPES: Array<{ type: WeaponType; emoji: string; baseName: string }> = [
  { type: "Sword", emoji: "⚔️", baseName: "Blade" },
  { type: "Shield", emoji: "🛡️", baseName: "Guard" },
  { type: "Boots", emoji: "👢", baseName: "Boots" },
  { type: "Helmet", emoji: "⛑️", baseName: "Helm" },
  { type: "Gauntlet", emoji: "🥊", baseName: "Wrap" },
]

const NAME_PREFIX: Record<WeaponRarity, string> = {
  Common: "",
  Rare: "Steel ",
  Epic: "Dark ",
  Legendary: "Divine ",
}

function tokenIdFrom(tier: number, typeIndex: number) {
  // common: 1..5, rare: 11..15, epic: 21..25, legendary: 31..35
  return tier * 10 + (typeIndex + 1)
}

export const KNOWN_TOKEN_IDS = TIERS.flatMap((t) => TYPES.map((_, i) => tokenIdFrom(t.tier, i)))

const templates: Template[] = TIERS.flatMap((tier) =>
  TYPES.map((t, idx) => {
    const tokenId = tokenIdFrom(tier.tier, idx)
    const bonusATK = tier.atk
    const bonusDEF = tier.def
    const bonusSPD = tier.spd
    return {
      tokenId,
      name: `${NAME_PREFIX[tier.rarity]}${t.baseName}`.trim(),
      type: t.type,
      rarity: tier.rarity,
      bonusATK,
      bonusDEF,
      bonusSPD,
      imageEmoji: t.emoji,
    }
  })
)

export function tokenIdToWeapon(tokenId: number): Weapon {
  const t = templates.find((x) => x.tokenId === tokenId)
  if (!t) {
    return {
      id: `onchain-${tokenId}`,
      name: `Weapon #${tokenId}`,
      type: "Sword",
      rarity: "Common",
      bonusATK: 0,
      bonusDEF: 0,
      bonusSPD: 0,
      imageEmoji: "⚔️",
    }
  }
  return {
    id: `onchain-${tokenId}`,
    name: t.name,
    type: t.type,
    rarity: t.rarity,
    bonusATK: t.bonusATK,
    bonusDEF: t.bonusDEF,
    bonusSPD: t.bonusSPD,
    imageEmoji: t.imageEmoji,
  }
}
