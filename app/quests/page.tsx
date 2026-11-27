"use client"
import { useCallback, useEffect, useState } from "react"
import { claimQuestReward, readQuestStats, type QuestStats } from "@/lib/quests"
import { loadGold, saveGold } from "@/lib/gold"
type Quest = { id: string; title: string; detail: string; event: keyof QuestStats["daily"]; target: number; reward: number }
const DAILY: Quest[] = [
 { id:"d-arena", title:"Arena challenger", detail:"Win 3 Arena encounters", event:"arena_win", target:3, reward:40 },
 { id:"d-skill", title:"Master your power", detail:"Use a hero ability 2 times", event:"hero_ability", target:2, reward:30 },
 { id:"d-dungeon", title:"Into the depths", detail:"Start 1 Dungeon expedition", event:"dungeon_run", target:1, reward:35 }
]
const WEEKLY: Quest[] = [
 { id:"w-arena", title:"Arena veteran", detail:"Win 15 Arena encounters", event:"arena_win", target:15, reward:180 },
 { id:"w-boss", title:"Boss hunter", detail:"Defeat 3 bosses in Arena or Dungeon", event:"arena_boss", target:3, reward:220 },
 { id:"w-dungeon", title:"Delver", detail:"Start 5 Dungeon expeditions", event:"dungeon_run", target:5, reward:150 }
]
export default function QuestsPage() {
 const [stats,setStats] = useState<QuestStats|null>(null)
 const [gold,setGold] = useState(0)
 const refresh = useCallback(() => { setStats(readQuestStats()); setGold(loadGold()) }, [])
 useEffect(() => { refresh(); window.addEventListener("hero-pull-quests-updated",refresh); window.addEventListener("storage",refresh); return () => { window.removeEventListener("hero-pull-quests-updated",refresh); window.removeEventListener("storage",refresh) } },[refresh])
 const claim = (q:Quest,period:"daily"|"weekly") => {
  if (!stats || (stats[period][q.event]||0)<q.target || !claimQuestReward(q.id,period)) return
  const next=loadGold()+q.reward; saveGold(next); setGold(next); refresh()
 }
 const section = (title:string,subtitle:string,quests:Quest[],period:"daily"|"weekly") => <section className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
  <div className="flex items-center justify-between"><h2 className="font-black text-amber-200">{title}</h2><span className="text-[10px] text-slate-500">{subtitle}</span></div>
  <div className="mt-3 space-y-3">{quests.map(q=>{
   const count=stats?.[period][q.event]||0, done=count>=q.target
   const claimId=(period==="daily"?stats?.day:stats?.week)+":"+q.id
   const claimed=!!stats?.claimed.includes(claimId)
   const pct=Math.min(100,count/q.target*100)
   return <div key={q.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
    <div className="flex items-start justify-between gap-3"><div><b className="text-sm">{q.title}</b><p className="mt-1 text-xs text-slate-400">{q.detail}</p></div><span className="shrink-0 text-xs font-bold text-yellow-300">🪙 {q.reward}</span></div>
    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400"><span>{Math.min(count,q.target)} / {q.target}</span><span>{done?"Completed":"In progress"}</span></div>
    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400 transition-all" style={{width:pct+"%"}} /></div>
    <button disabled={!done||claimed} onClick={()=>claim(q,period)} className="mt-3 w-full rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-black disabled:bg-slate-800 disabled:text-slate-500">{claimed?"REWARD CLAIMED":done?"CLAIM REWARD":"KEEP GOING"}</button>
   </div>
  })}</div>
 </section>
 return <main className="mx-auto max-w-2xl px-4 pb-28 pt-6">
  <div className="flex items-center justify-between"><a href="/" className="text-xs text-slate-400 underline">← Home</a><span className="text-xs text-amber-300">QUEST BOARD</span></div>
  <h1 className="mt-3 text-center text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-violet-300">DAILY & WEEKLY QUESTS</h1>
  <p className="mt-2 text-center text-xs text-slate-400">Play the game, complete objectives and claim gold rewards.</p>
  <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-950/20 p-4 text-center"><div className="text-[10px] tracking-widest text-yellow-300">YOUR GOLD</div><div className="mt-1 text-2xl font-black">🪙 {gold}</div></div>
  {section("Daily missions","Reset every day",DAILY,"daily")}
  {section("Weekly challenges","Reset every week",WEEKLY,"weekly")}
  <p className="mt-4 text-center text-[10px] text-slate-600">Quest progress is stored on this device. Rewards are added to your local gold balance.</p>
 </main>
}
