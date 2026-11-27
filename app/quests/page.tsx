"use client"

import { useEffect, useState } from "react"
import { claimQuestReward, listQuests } from "@/lib/quests"
import { loadGold, saveGold } from "@/lib/gold"

type QuestView = ReturnType<typeof listQuests>[number]

export default function QuestsPage() {
  const [quests, setQuests] = useState<QuestView[]>([])
  const [gold, setGold] = useState(0)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState("")

  const refresh = () => {
    setQuests(listQuests())
    setGold(loadGold())
    setReady(true)
  }
  useEffect(() => { refresh() }, [])

  const claim = (id: string) => {
    const result = claimQuestReward(id)
    if (!result.ok) {
      setMessage("Quest is not complete yet.")
      return
    }
    const nextGold = loadGold() + result.reward
    saveGold(nextGold)
    setGold(nextGold)
    setMessage("Reward claimed: +" + result.reward + " gold.")
    refresh()
  }

  const daily = quests.filter((quest) => quest.period === "daily")
  const weekly = quests.filter((quest) => quest.period === "weekly")
  const renderQuest = (quest: QuestView) => {
    const percent = Math.min(100, Math.round((quest.progress / quest.target) * 100))
    return (
      <div key={quest.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-extrabold text-white">{quest.title}</div>
            <p className="mt-1 text-xs text-slate-400">{quest.description}</p>
          </div>
          <div className="shrink-0 rounded-lg border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-xs font-black text-amber-200">🪙 {quest.reward}</div>
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
          <span>Progress</span><span className="font-bold text-white">{quest.progress}/{quest.target}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all" style={{ width: percent + "%" }} />
        </div>
        <button
          disabled={!ready || quest.claimed || quest.progress < quest.target}
          onClick={() => claim(quest.id)}
          className="mt-4 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-extrabold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {quest.claimed ? "REWARD CLAIMED" : quest.progress >= quest.target ? "CLAIM REWARD" : "IN PROGRESS"}
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-6">
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-violet-300">Earn while you play</p>
        <h1 className="mt-2 text-3xl font-black text-white">QUEST BOARD</h1>
        <p className="mt-2 text-sm text-slate-400">Complete challenges, claim gold, and return tomorrow for new quests.</p>
      </div>
      <div className="mt-5 flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
        <div><div className="text-xs text-amber-200/70">YOUR GOLD</div><div className="mt-1 text-2xl font-black text-amber-200">🪙 {gold}</div></div>
        <a href="/arena" className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white">Enter Arena</a>
      </div>
      {message && <p role="status" className="mt-3 text-center text-xs text-emerald-300">{message}</p>}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black">☀️ Daily quests</h2><span className="text-[10px] text-slate-500">Reset at 00:00 UTC</span></div>
        <div className="grid gap-3">{daily.map(renderQuest)}</div>
      </section>
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black">🏆 Weekly challenges</h2><span className="text-[10px] text-slate-500">Reset Monday · UTC</span></div>
        <div className="grid gap-3">{weekly.map(renderQuest)}</div>
      </section>
      <p className="mt-6 text-center text-[10px] leading-relaxed text-slate-500">Quest progress and rewards are currently saved on this device. Clearing browser data or switching devices may reset or separate progress.</p>
    </div>
  )
}
