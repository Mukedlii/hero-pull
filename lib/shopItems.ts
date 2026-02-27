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
  { templateId: "c-weapon-1", name: "Iron Blade", slot: "weapon", rarity: "Common", bonusATK: 5, bonusDEF: 0, bonusSPD: 0, imageEmoji: slotEmoji.weapon, priceGold: 120 },
  { templateId: "c-shield-1", name: "Wooden Guard", slot: "shield", rarity: "Common", bonusATK: 0, bonusDEF: 5, bonusSPD: 0, imageEmoji: slotEmoji.shield, priceGold: 120 },
  { templateId: "c-boots-1", name: "Leather Boots", slot: "boots", rarity: "Common", bonusATK: 0, bonusDEF: 0, bonusSPD: 5, imageEmoji: slotEmoji.boots, priceGold: 120 },
  { templateId: "c-helmet-1", name: "Copper Helm", slot: "helmet", rarity: "Common", bonusATK: 0, bonusDEF: 5, bonusSPD: 0, imageEmoji: slotEmoji.helmet, priceGold: 140 },

  // Rare (better)
  { templateId: "r-weapon-1", name: "Steel Edge", slot: "weapon", rarity: "Rare", bonusATK: 10, bonusDEF: 0, bonusSPD: 5, imageEmoji: slotEmoji.weapon, priceGold: 350 },
  { templateId: "r-shield-1", name: "Iron Wall", slot: "shield", rarity: "Rare", bonusATK: 0, bonusDEF: 10, bonusSPD: 5, imageEmoji: slotEmoji.shield, priceGold: 350 },
  { templateId: "r-boots-1", name: "Swift Runners", slot: "boots", rarity: "Rare", bonusATK: 5, bonusDEF: 0, bonusSPD: 10, imageEmoji: slotEmoji.boots, priceGold: 350 },
  { templateId: "r-helmet-1", name: "Vanguard Helm", slot: "helmet", rarity: "Rare", bonusATK: 5, bonusDEF: 10, bonusSPD: 0, imageEmoji: slotEmoji.helmet, priceGold: 380 },
]

export function instantiateShopItem(t: ShopItemTemplate): Item {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  return { id, name: t.name, slot: t.slot, rarity: t.rarity, bonusATK: t.bonusATK, bonusDEF: t.bonusDEF, bonusSPD: t.bonusSPD, imageEmoji: t.imageEmoji, set: t.set }
}
