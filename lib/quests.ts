export type QuestStats = {
  day: string
  week: string
  daily: Record<string, number>
  weekly: Record<string, number>
  claimed: string[]
}
const KEY = "hero-pull-quests-v1"
const dayKey = () => new Date().toISOString().slice(0, 10)
function weekKey() {
  const d = new Date()
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return String(date.getUTCFullYear()) + "-W" + String(week).padStart(2, "0")
}
const empty = (): QuestStats => ({ day: dayKey(), week: weekKey(), daily: {}, weekly: {}, claimed: [] })
export function readQuestStats(): QuestStats {
  if (typeof window === "undefined") return empty()
  try {
    const raw = localStorage.getItem(KEY)
    const saved = raw ? JSON.parse(raw) : {}
    const current = empty()
    const claimed = Array.isArray(saved.claimed) ? saved.claimed.filter((id: unknown) => typeof id === "string" && (id.startsWith(current.day + ":") || id.startsWith(current.week + ":"))) : []
    return { day: current.day, week: current.week, daily: saved.day === current.day && saved.daily && typeof saved.daily === "object" ? saved.daily : {}, weekly: saved.week === current.week && saved.weekly && typeof saved.weekly === "object" ? saved.weekly : {}, claimed }
  } catch { return empty() }
}
export function recordQuestProgress(event: "arena_win" | "arena_boss" | "hero_ability" | "dungeon_run", amount = 1) {
  if (typeof window === "undefined") return
  const stats = readQuestStats()
  const value = Math.max(0, Math.min(1000, Math.floor(amount)))
  stats.daily[event] = Math.min(1000, (stats.daily[event] || 0) + value)
  stats.weekly[event] = Math.min(10000, (stats.weekly[event] || 0) + value)
  try { localStorage.setItem(KEY, JSON.stringify(stats)); window.dispatchEvent(new Event("hero-pull-quests-updated")) } catch {}
}
export function claimQuestReward(id: string, period: "daily" | "weekly") {
  if (typeof window === "undefined") return false
  const stats = readQuestStats()
  const claimId = (period === "daily" ? stats.day : stats.week) + ":" + id
  if (stats.claimed.includes(claimId)) return false
  stats.claimed.push(claimId)
  try { localStorage.setItem(KEY, JSON.stringify(stats)); window.dispatchEvent(new Event("hero-pull-quests-updated")); return true } catch { return false }
}
