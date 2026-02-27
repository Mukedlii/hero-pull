import type { Item, ItemSlot } from "@/lib/items"

export type ShopItemTemplate = Omit<Item, "id"> & { templateId: string; priceGold: number }

const slotEmoji: Record<ItemSlot, string> = {
  weapon: "⚔️",
  shield: "🛡️",
  boots: "👢",
  helmet: "⛑️",
}

export const SHOP_ITEMS_GOLD: ShopItemTemplate[] = [
  // Common (cheap)
  { templateId: "c-weapon-1", name: "Iron Blade", slot: "weapon", rarity: "Common", bonusPWR: 5, bonusDEF: 0, bonusLCK: 0, imageEmoji: slotEmoji.weapon, priceGold: 120 },
  { templateId: "c-weapon-2", name: "Bronze Dagger", slot: "weapon", rarity: "Common", bonusPWR: 4, bonusDEF: 0, bonusLCK: 2, imageEmoji: slotEmoji.weapon, priceGold: 110 },
  { templateId: "c-weapon-3", name: "Hunter Spear", slot: "weapon", rarity: "Common", bonusPWR: 6, bonusDEF: 0, bonusLCK: 0, imageEmoji: slotEmoji.weapon, priceGold: 135 },

  { templateId: "c-shield-1", name: "Wooden Guard", slot: "shield", rarity: "Common", bonusPWR: 0, bonusDEF: 5, bonusLCK: 0, imageEmoji: slotEmoji.shield, priceGold: 120 },
  { templateId: "c-shield-2", name: "Rusty Buckler", slot: "shield", rarity: "Common", bonusPWR: 0, bonusDEF: 4, bonusLCK: 1, imageEmoji: slotEmoji.shield, priceGold: 115 },

  { templateId: "c-boots-1", name: "Leather Boots", slot: "boots", rarity: "Common", bonusPWR: 0, bonusDEF: 0, bonusLCK: 5, imageEmoji: slotEmoji.boots, priceGold: 120 },
  { templateId: "c-boots-2", name: "Trail Boots", slot: "boots", rarity: "Common", bonusPWR: 1, bonusDEF: 0, bonusLCK: 4, imageEmoji: slotEmoji.boots, priceGold: 120 },

  { templateId: "c-helmet-1", name: "Copper Helm", slot: "helmet", rarity: "Common", bonusPWR: 0, bonusDEF: 5, bonusLCK: 0, imageEmoji: slotEmoji.helmet, priceGold: 140 },
  { templateId: "c-helmet-2", name: "Scout Cap", slot: "helmet", rarity: "Common", bonusPWR: 0, bonusDEF: 3, bonusLCK: 2, imageEmoji: slotEmoji.helmet, priceGold: 135 },

  // Rare (better)
  { templateId: "r-weapon-1", name: "Steel Edge", slot: "weapon", rarity: "Rare", bonusPWR: 10, bonusDEF: 0, bonusLCK: 5, imageEmoji: slotEmoji.weapon, priceGold: 350 },
  { templateId: "r-weapon-2", name: "Knight Saber", slot: "weapon", rarity: "Rare", bonusPWR: 12, bonusDEF: 0, bonusLCK: 3, imageEmoji: slotEmoji.weapon, priceGold: 390 },
  { templateId: "r-weapon-3", name: "Storm Pike", slot: "weapon", rarity: "Rare", bonusPWR: 11, bonusDEF: 0, bonusLCK: 4, imageEmoji: slotEmoji.weapon, priceGold: 375 },

  { templateId: "r-shield-1", name: "Iron Wall", slot: "shield", rarity: "Rare", bonusPWR: 0, bonusDEF: 10, bonusLCK: 5, imageEmoji: slotEmoji.shield, priceGold: 350 },
  { templateId: "r-shield-2", name: "Aegis Plate", slot: "shield", rarity: "Rare", bonusPWR: 0, bonusDEF: 12, bonusLCK: 3, imageEmoji: slotEmoji.shield, priceGold: 390 },

  { templateId: "r-boots-1", name: "Swift Runners", slot: "boots", rarity: "Rare", bonusPWR: 5, bonusDEF: 0, bonusLCK: 10, imageEmoji: slotEmoji.boots, priceGold: 350 },
  { templateId: "r-boots-2", name: "Windwalkers", slot: "boots", rarity: "Rare", bonusPWR: 4, bonusDEF: 0, bonusLCK: 12, imageEmoji: slotEmoji.boots, priceGold: 380 },

  { templateId: "r-helmet-1", name: "Vanguard Helm", slot: "helmet", rarity: "Rare", bonusPWR: 5, bonusDEF: 10, bonusLCK: 0, imageEmoji: slotEmoji.helmet, priceGold: 380 },
  { templateId: "r-helmet-2", name: "Warden Helm", slot: "helmet", rarity: "Rare", bonusPWR: 3, bonusDEF: 12, bonusLCK: 0, imageEmoji: slotEmoji.helmet, priceGold: 390 },
]

export function instantiateShopItem(t: ShopItemTemplate): Item {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  return {
    id,
    name: t.name,
    slot: t.slot,
    rarity: t.rarity,
    bonusPWR: t.bonusPWR,
    bonusDEF: t.bonusDEF,
    bonusLCK: t.bonusLCK,
    imageEmoji: t.imageEmoji,
    set: t.set,
  }
}
