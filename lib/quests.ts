export type QuestEvent = "arena_victory" | "boss_kill" | "rune_spin"
type Quest = { id: string; title: string; description: string; event: QuestEvent; target: number; reward: number; period: "daily" | "weekly" }
type QuestState = { dailyKey: string; weeklyKey: string; progress: Record<string, number>; claimed: string[] }

const STORAGE_KEY = "hero-pull-quests-v1"
const QUESTS: Quest[] = [
  { id: "daily-arena", title: "Arena Challenger", description: "Win 2 Arena encounters", event: "arena_victory", target: 2, reward: 60, period: "daily" },
  { id: "daily-runes", title: "Rune Master", description: "Spin runes 5 times", event: "rune_spin", target: 5, reward: 40, period: "daily" },
  { id: "daily-boss", title: "Boss Hunter", description: "Defeat 1 Arena boss", event: "boss_kill", target: 1, reward: 100, period: "daily" },
  { id: "weekly-arena", title: "Arena Veteran", description: "Win 10 Arena encounters", event: "arena_victory", target: 10, reward: 250, period: "weekly" },
  { id: "weekly-runes", title: "Runic Devotion", description: "Spin runes 30 times", event: "rune_spin", target: 30, reward: 180, period: "weekly" },
]

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}
function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}
function emptyState(): QuestState {
  return { dailyKey: dateKey(), weeklyKey: weekKey(), progress: {}, claimed: [] }
}
function readState(): QuestState {
  if (typeof window === "undefined") return emptyState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const saved = raw ? JSON.parse(raw) : null
    const state: QuestState = {
      dailyKey: typeof saved?.dailyKey === "string" ? saved.dailyKey : dateKey(),
      weeklyKey: typeof saved?.weeklyKey === "string" ? saved.weeklyKey : weekKey(),
      progress: saved?.progress && typeof saved.progress === "object" ? saved.progress : {},
      claimed: Array.isArray(saved?.claimed) ? saved.claimed : [],
    }
    const today = dateKey()
    const thisWeek = weekKey()
    if (state.dailyKey !== today) {
      for (const q of QUESTS.filter((item) => item.period === "daily")) delete state.progress[q.id]
      state.claimed = state.claimed.filter((id) => !id.startsWith("daily-"))
      state.dailyKey = today
    }
    if (state.weeklyKey !== thisWeek) {
      for (const q of QUESTS.filter((item) => item.period === "weekly")) delete state.progress[q.id]
      state.claimed = state.claimed.filter((id) => !id.startsWith("weekly-"))
      state.weeklyKey = thisWeek
    }
    return state
  } catch {
    return emptyState()
  }
}
function writeState(state: QuestState) {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
export function listQuests() {
  const state = readState()
  writeState(state)
  return QUESTS.map((quest) => ({
    ...quest,
    progress: Math.min(quest.target, Math.max(0, Number(state.progress[quest.id] || 0))),
    claimed: state.claimed.includes(quest.id),
  }))
}
export function recordQuestEvent(event: QuestEvent, amount = 1) {
  if (typeof window === "undefined" || !Number.isFinite(amount) || amount <= 0) return
  const state = readState()
  for (const quest of QUESTS) {
    if (quest.event === event) state.progress[quest.id] = Math.min(quest.target, Math.max(0, Number(state.progress[quest.id] || 0)) + Math.floor(amount))
  }
  writeState(state)
}
export function claimQuestReward(id: string) {
  const state = readState()
  const quest = QUESTS.find((item) => item.id === id)
  if (!quest || state.claimed.includes(id)) return { ok: false as const, reward: 0 }
  const progress = Math.min(quest.target, Math.max(0, Number(state.progress[id] || 0)))
  if (progress < quest.target) return { ok: false as const, reward: 0 }
  state.claimed.push(id)
  writeState(state)
  return { ok: true as const, reward: quest.reward }
}
