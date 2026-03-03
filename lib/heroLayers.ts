export const LAYER_OPTIONS = {
  chars: [
    "char_warrior_m",
    "char_mage_m",
    "char_warrior_f",
    "char_mage_f",
    "char_rogue_m",
    "char_ranger_f",
    "char_paladin_m",
    "char_necro_f",
    "char_berserker_m",
    "char_cleric_f",
    "char_darkknight_m",
    "char_monk_f",
  ],
  overlays: [
    "ovr_pauldrons",
    "ovr_amulet",
    "ovr_hood",
    "ovr_scars",
    "ovr_crown",
    "ovr_runes",
    "ovr_eyepatch",
  ],
} as const

export type HeroLayers = {
  char: string
  overlay: string | null
}

export const RARITY_BG: Record<string, string> = {
  Common: "bg_common",
  Rare: "bg_rare",
  Epic: "bg_epic",
  Legendary: "bg_legendary",
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randomLayers(): HeroLayers {
  const hasOverlay = Math.random() < 0.5
  return {
    char: pick(LAYER_OPTIONS.chars),
    overlay: hasOverlay ? pick(LAYER_OPTIONS.overlays) : null,
  }
}

export function layersToQuery(layers: HeroLayers, rarity: string): string {
  const params = new URLSearchParams()
  params.set("char", layers.char)
  if (layers.overlay) params.set("ovr", layers.overlay)
  params.set("rarity", rarity)
  return params.toString()
}

export function heroImageUrl(layers: HeroLayers, rarity: string): string {
  return `/api/hero-image?${layersToQuery(layers, rarity)}`
}
