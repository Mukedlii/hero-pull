import type { Weapon, WeaponRarity, WeaponType } from "@/lib/weapons"

type Template = Omit<Weapon, "id"> & { tokenId: number }

const templates: Template[] = [
  { tokenId: 1, name: "Iron Blade", type: "Sword" as WeaponType, rarity: "Common" as WeaponRarity, bonusATK: 5, bonusDEF: 0, bonusSPD: 0, imageEmoji: "⚔️" },
  { tokenId: 2, name: "Wooden Guard", type: "Shield" as WeaponType, rarity: "Common" as WeaponRarity, bonusATK: 0, bonusDEF: 5, bonusSPD: 0, imageEmoji: "🛡️" },
  { tokenId: 3, name: "Leather Boots", type: "Boots" as WeaponType, rarity: "Common" as WeaponRarity, bonusATK: 0, bonusDEF: 0, bonusSPD: 5, imageEmoji: "👢" },
  { tokenId: 4, name: "Copper Helm", type: "Helmet" as WeaponType, rarity: "Common" as WeaponRarity, bonusATK: 0, bonusDEF: 0, bonusSPD: 5, imageEmoji: "⛑️" },
  { tokenId: 5, name: "Cloth Wrap", type: "Gauntlet" as WeaponType, rarity: "Common" as WeaponRarity, bonusATK: 0, bonusDEF: 0, bonusSPD: 5, imageEmoji: "🥊" },
]

export function tokenIdToWeapon(tokenId: number): Weapon {
  const t = templates.find((x) => x.tokenId === tokenId) ?? templates[0]
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

export const KNOWN_TOKEN_IDS = templates.map((t) => t.tokenId)
