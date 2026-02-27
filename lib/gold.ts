const GOLD_KEY = "hero-pull-gold"
const DEFAULT_GOLD = 500

export function loadGold(): number {
  if (typeof window === "undefined") return DEFAULT_GOLD
  try {
    const raw = localStorage.getItem(GOLD_KEY)
    const n = raw ? Number(raw) : DEFAULT_GOLD
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : DEFAULT_GOLD
  } catch {
    return DEFAULT_GOLD
  }
}

export function saveGold(n: number) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(GOLD_KEY, String(Math.max(0, Math.floor(n))))
  } catch {
    // ignore
  }
}
