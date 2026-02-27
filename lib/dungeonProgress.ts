import { getWalletAddress, loadStats, saveStats } from "@/lib/db"

export type DungeonProgress = {
  current_level: number
  current_floor: number
  highest_level_cleared: number
  highest_floor_cleared: number
  total_dungeon_runs: number
  total_bosses_killed: number
}

export const DEFAULT_DUNGEON_PROGRESS: DungeonProgress = {
  current_level: 1,
  current_floor: 1,
  highest_level_cleared: 0,
  highest_floor_cleared: 0,
  total_dungeon_runs: 0,
  total_bosses_killed: 0,
}

const KEY = "hero-pull-dungeon-progress"

export async function loadDungeonProgress(): Promise<{ progress: DungeonProgress; source: "supabase" | "local" }> {
  // Best-effort: if player_stats has matching columns, use it; otherwise fallback local.
  try {
    const w = await getWalletAddress()
    if (w) {
      const s: any = await loadStats(w)
      const p: DungeonProgress | null = s?.dungeon_progress ?? null
      if (p && typeof p === "object") {
        return { progress: { ...DEFAULT_DUNGEON_PROGRESS, ...p }, source: "supabase" }
      }
    }
  } catch {
    // ignore
  }

  if (typeof window === "undefined") return { progress: DEFAULT_DUNGEON_PROGRESS, source: "local" }
  try {
    const raw = localStorage.getItem(KEY)
    const p = raw ? (JSON.parse(raw) as Partial<DungeonProgress>) : null
    return { progress: { ...DEFAULT_DUNGEON_PROGRESS, ...(p || {}) }, source: "local" }
  } catch {
    return { progress: DEFAULT_DUNGEON_PROGRESS, source: "local" }
  }
}

export async function saveDungeonProgress(progress: DungeonProgress): Promise<void> {
  // Best-effort: store under player_stats.dungeon_progress json if available.
  try {
    const w = await getWalletAddress()
    if (w) {
      await saveStats(w, { dungeon_progress: progress } as any)
      return
    }
  } catch {
    // ignore
  }

  if (typeof window === "undefined") return
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    // ignore
  }
}
