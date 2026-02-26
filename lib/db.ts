import type { Hero, EquippedWeapon } from "./heroes"
import type { Weapon } from "./weapons"
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
      equipped_weapon: hero.equippedWeapon ?? null,
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
    equippedWeapon: (h.equipped_weapon as EquippedWeapon) ?? undefined,
    dbId: h.id,
  }))
}

export async function updateHeroEquippedWeapon(heroId: string, equippedWeapon: EquippedWeapon | null) {
  const { error } = await supabase().from("heroes").update({ equipped_weapon: equippedWeapon }).eq("id", heroId)
  if (error) throw error
}

export async function saveWeapon(weapon: Weapon, walletAddress: string) {
  const { data, error } = await supabase()
    .from("weapons")
    .insert({
      wallet_address: walletAddress,
      name: weapon.name,
      type: weapon.type,
      rarity: weapon.rarity,
      bonus_atk: weapon.bonusATK,
      bonus_def: weapon.bonusDEF,
      bonus_spd: weapon.bonusSPD,
      image_emoji: weapon.imageEmoji,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function loadWeapons(walletAddress: string): Promise<Weapon[]> {
  const { data, error } = await supabase()
    .from("weapons")
    .select("*")
    .eq("wallet_address", walletAddress)
    .order("created_at", { ascending: false })

  if (error) throw error
  if (!data) return []

  return data.map((w: any) => ({
    id: w.id,
    name: w.name,
    type: w.type,
    rarity: w.rarity,
    bonusATK: w.bonus_atk,
    bonusDEF: w.bonus_def,
    bonusSPD: w.bonus_spd,
    imageEmoji: w.image_emoji,
  }))
}

export async function markWeaponEquipped(weaponId: string, heroId: string | null) {
  const { error } = await supabase().from("weapons").update({ equipped_to_hero_id: heroId }).eq("id", weaponId)
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
