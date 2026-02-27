import type { Hero } from "./heroes"
import type { Item } from "./items"
import { supabase } from "./supabase"

type RequestArgs = { method: string; params?: any[] }

type Provider = {
  request: (args: RequestArgs) => Promise<any>
}

async function getProvider(): Promise<Provider | null> {
  if (typeof window === "undefined") return null

  try {
    const mod: any = await import("@farcaster/frame-sdk")
    return (
      mod?.default?.wallet?.ethProvider ??
      mod?.sdk?.wallet?.ethProvider ??
      (window as any).ethereum ??
      null
    )
  } catch {
    return (window as any).ethereum ?? null
  }
}

async function providerRequest(args: RequestArgs) {
  const provider = await getProvider()
  if (!provider) throw new Error("No wallet provider available")
  return provider.request(args)
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    if (typeof window === "undefined") return null
    const accounts = (await providerRequest({ method: "eth_accounts" })) as string[]
    return accounts?.[0] || null
  } catch {
    return null
  }
}

export async function saveHero(hero: Hero, walletAddress: string) {
  const { data, error } = await supabase()
    .from("heroes")
    .insert({
      wallet_address: walletAddress,
      name: hero.name,
      rarity: hero.rarity,
      power: hero.power,
      gender: hero.gender,
      attack: hero.attack,
      defense: hero.defense,
      speed: hero.speed,
      xp: hero.xp || 0,
      level: hero.level || 1,
      image_url: hero.imageUrl,
      equipped_items: hero.equippedItems ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function loadHeroes(walletAddress: string): Promise<Hero[]> {
  const { data, error } = await supabase()
    .from("heroes")
    .select("*")
    .eq("wallet_address", walletAddress)
    .order("created_at", { ascending: false })

  if (error) throw error
  if (!data) return []

  return data.map((h: any) => ({
    name: h.name,
    rarity: h.rarity,
    power: h.power,
    gender: h.gender,
    attack: h.attack,
    defense: h.defense,
    speed: h.speed,
    xp: h.xp,
    level: h.level,
    imageUrl: h.image_url,
    equippedItems: (h.equipped_items as any) ?? undefined,
    dbId: h.id,
  }))
}

export async function updateHeroEquippedItems(heroId: string, equippedItems: Hero["equippedItems"] | null) {
  const { error } = await supabase().from("heroes").update({ equipped_items: equippedItems }).eq("id", heroId)
  if (error) throw error
}

export async function saveItem(item: Item, walletAddress: string) {
  const { data, error } = await supabase()
    .from("items")
    .insert({
      wallet_address: walletAddress,
      name: item.name,
      slot: item.slot,
      rarity: item.rarity,
      bonus_atk: item.bonusATK,
      bonus_def: item.bonusDEF,
      bonus_spd: item.bonusSPD,
      image_emoji: item.imageEmoji,
      set_name: item.set ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function loadItems(walletAddress: string): Promise<Item[]> {
  const { data, error } = await supabase()
    .from("items")
    .select("*")
    .eq("wallet_address", walletAddress)
    .order("created_at", { ascending: false })

  if (error) throw error
  if (!data) return []

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    slot: row.slot,
    rarity: row.rarity,
    bonusATK: row.bonus_atk,
    bonusDEF: row.bonus_def,
    bonusSPD: row.bonus_spd,
    imageEmoji: row.image_emoji,
    set: row.set_name ?? undefined,
  }))
}

export async function markItemEquipped(itemId: string, heroId: string | null) {
  const { error } = await supabase().from("items").update({ equipped_to_hero_id: heroId }).eq("id", itemId)
  if (error) throw error
}

export async function saveStats(
  walletAddress: string,
  stats: {
    points?: number
    wins?: number
    losses?: number
    highest_streak?: number
    current_streak?: number
    total_pulls?: number
  }
) {
  const { error } = await supabase().from("player_stats").upsert({
    wallet_address: walletAddress,
    ...stats,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function loadStats(walletAddress: string) {
  const { data, error } = await supabase().from("player_stats").select("*").eq("wallet_address", walletAddress).single()
  if (error) return null
  return data
}
