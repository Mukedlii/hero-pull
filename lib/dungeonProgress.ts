import { getWalletAddress, loadStats, saveStats } from "@/lib/db"
import { clampFloor, clampLevel } from "@/lib/dungeonConfig"

export type DungeonProgress = {
  current_level: number
  current_floor: number
  highest_level_cleared: number
  highest_floor_cleared: number
  total_dungeon_runs: number
  total_bosses_killed: number
}

const KEY = "hero-pull-dungeon-progress"

export const DEFAULT_DUNGEON_PROGRESS: DungeonProgress = {
  current_level: 1,
  current_floor: 1,
  highest_level_cleared: 0,
  highest_floor_cleared: 0,
  total_dungeon_runs: 0,
  total_bosses_killed: 0,
}

function clampProgress(p: Partial<DungeonProgress> | any | null | undefined): DungeonProgress {
  const n = (x: any, d: number) => {
    const v = Number(x)
    return Number.isFinite(v) ? Math.floor(v) : d
  }

  // Backwards compat (older keys): total_runs/total_bosses
  const totalRuns = p?.total_dungeon_runs ?? p?.total_runs
  const totalBosses = p?.total_bosses_killed ?? p?.total_bosses

  return {
    current_level: clampLevel(n(p?.current_level, DEFAULT_DUNGEON_PROGRESS.current_level)),
    current_floor: clampFloor(n(p?.current_floor, DEFAULT_DUNGEON_PROGRESS.current_floor)),
    highest_level_cleared: Math.max(0, Math.min(10, n(p?.highest_level_cleared, DEFAULT_DUNGEON_PROGRESS.highest_level_cleared))),
    highest_floor_cleared: Math.max(0, Math.min(10, n(p?.highest_floor_cleared, DEFAULT_DUNGEON_PROGRESS.highest_floor_cleared))),
    total_dungeon_runs: Math.max(0, n(totalRuns, DEFAULT_DUNGEON_PROGRESS.total_dungeon_runs)),
    total_bosses_killed: Math.max(0, n(totalBosses, DEFAULT_DUNGEON_PROGRESS.total_bosses_killed)),
  }
}

export async function loadDungeonProgress(): Promise<{ progress: DungeonProgress; source: "supabase" | "local"; wallet: string | null }> {
  try {
    const wallet = await getWalletAddress()
    if (wallet) {
      const s: any = await loadStats(wallet)
      if (s) {
        const progress = clampProgress({
          current_level: s.current_level,
          current_floor: s.current_floor,
          highest_level_cleared: s.highest_level_cleared,
          highest_floor_cleared: s.highest_floor_cleared,
          total_dungeon_runs: s.total_dungeon_runs ?? s.total_runs,
          total_bosses_killed: s.total_bosses_killed ?? s.total_bosses,
        })
        return { progress, source: "supabase", wallet }
      }
      await saveStats(wallet, { ...DEFAULT_DUNGEON_PROGRESS } as any)
      return { progress: DEFAULT_DUNGEON_PROGRESS, source: "supabase", wallet }
    }
  } catch {
    // ignore
  }

  if (typeof window === "undefined") return { progress: DEFAULT_DUNGEON_PROGRESS, source: "local", wallet: null }
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<DungeonProgress>) : null
    return { progress: clampProgress(parsed), source: "local", wallet: null }
  } catch {
    return { progress: DEFAULT_DUNGEON_PROGRESS, source: "local", wallet: null }
  }
}

export async function saveDungeonProgress(next: DungeonProgress): Promise<{ progress: DungeonProgress; source: "supabase" | "local"; wallet: string | null }> {
  const progress = clampProgress(next)

  try {
    const wallet = await getWalletAddress()
    if (wallet) {
      await saveStats(wallet, { ...progress } as any)
      return { progress, source: "supabase", wallet }
    }
  } catch {
    // ignore
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(KEY, JSON.stringify(progress))
    } catch {
      // ignore
    }
  }

  return { progress, source: "local", wallet: null }
}
