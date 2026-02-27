import type { Item } from "@/lib/items"
import { getWalletAddress, loadItems, saveItem } from "@/lib/db"

const ITEMS_KEY = "hero-pull-items"

export async function loadInventory(): Promise<{ items: Item[]; wallet: string | null; source: "supabase" | "local" }> {
  // Prefer Supabase if wallet connected
  try {
    const wallet = await getWalletAddress()
    if (wallet) {
      const items = await loadItems(wallet)
      return { items, wallet, source: "supabase" }
    }
  } catch {
    // ignore
  }

  // local fallback
  if (typeof window === "undefined") return { items: [], wallet: null, source: "local" }
  try {
    const raw = localStorage.getItem(ITEMS_KEY)
    const items = raw ? (JSON.parse(raw) as Item[]) : []
    return { items, wallet: null, source: "local" }
  } catch {
    return { items: [], wallet: null, source: "local" }
  }
}

export async function addItemToInventory(item: Item): Promise<{ item: Item; wallet: string | null; source: "supabase" | "local" }> {
  // Prefer Supabase if wallet connected
  try {
    const wallet = await getWalletAddress()
    if (wallet) {
      const row: any = await saveItem(item, wallet)
      return { item: { ...item, id: row?.id ?? item.id }, wallet, source: "supabase" }
    }
  } catch {
    // ignore
  }

  // local fallback
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(ITEMS_KEY)
      const items = raw ? (JSON.parse(raw) as Item[]) : []
      localStorage.setItem(ITEMS_KEY, JSON.stringify([{ ...item }, ...items]))
    } catch {
      // ignore
    }
  }

  return { item, wallet: null, source: "local" }
}
