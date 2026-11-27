"use client"
import { useEffect, useState } from "react"
import { claimLiveReward, readLiveOps } from "@/lib/liveOps"
const missions = [
 {id:"daily:arena",title:"Arena Champion",desc:"Win 3 Arena fights",event:"arena_win" as const,target:3,xp:60,period:"DAILY"},
 {id:"daily:boss",title:"Boss Hunter",desc:"Defeat 1 boss",event:"boss_kill" as const,target:1,xp:90,period:"DAILY"},
 {id:"weekly:dungeon",title:"Deep Delver",desc:"Clear 3 dungeon bosses",event:"dungeon_clear" as const,target:3,xp:250,period:"WEEKLY"},
 {id:"weekly:floors",title:"Floor Breaker",desc:"Win 10 dungeon battles",event:"floor_clear" as const,target:10,xp:180,period:"WEEKLY"},
]
export default function SeasonPage(){
 const [state,setState]=useState(readLiveOps())
 useEffect(()=>{const refresh=()=>setState(readLiveOps());window.addEventListener("hero-pull-liveops-updated",refresh);return()=>window.removeEventListener("hero-pull-liveops-updated",refresh)},[])
 const pct=(n:number,t:number)=>Math.min(100,Math.round(n/t*100))
 return <main className="mx-auto max-w-2xl px-4 pb-28 pt-6 text-white">
  <div className="rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-950 via-slate-950 to-fuchsia-950 p-5">
   <div className="text-[10px] font-black tracking-[.3em] text-violet-300">HERO PULL · LIVE OPERATIONS</div><h1 className="mt-2 text-3xl font-black">Season of the Rift</h1>
   <p className="mt-1 text-sm text-gray-300">Earn Season XP by playing Arena and Dungeon.</p>
   <div className="mt-5 flex items-end justify-between"><div><div className="text-xs text-gray-400">SEASON XP</div><div className="text-4xl font-black">{state.seasonXp}</div></div><div className="text-right text-xs text-violet-200">Tier {Math.floor(state.seasonXp/500)+1}<br/>{500-state.seasonXp%500} XP to next tier</div></div>
   <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/50"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-300" style={{width:(state.seasonXp%500)/5+"%"}}/></div>
   <div className="mt-2 text-[10px] text-gray-400">Prototype: progress is stored on this device. Online season sync and paid rewards are not enabled.</div>
  </div>
  <h2 className="mt-7 text-lg font-black">Challenges</h2><div className="mt-3 space-y-3">{missions.map(m=>{const count=state.counts[m.event]||0,done=count>=m.target,claimed=state.claimed.includes(m.id);return <section key={m.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
   <div className="flex items-start justify-between gap-3"><div><div className="text-[9px] font-black tracking-widest text-violet-300">{m.period}</div><div className="mt-1 font-bold">{m.title}</div><div className="text-xs text-gray-400">{m.desc}</div></div><div className="text-right text-xs font-bold text-amber-300">+{m.xp} XP</div></div>
   <div className="mt-3 flex justify-between text-[10px] text-gray-400"><span>{Math.min(count,m.target)} / {m.target}</span><span>{pct(count,m.target)}%</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-black/50"><div className="h-full bg-violet-400" style={{width:pct(count,m.target)+"%"}}/></div>
   <button disabled={!done||claimed} onClick={()=>setState(claimLiveReward(m.id,m.xp))} className="mt-3 w-full rounded-xl bg-violet-700 py-2 text-xs font-black disabled:opacity-40">{claimed?"REWARD CLAIMED":done?"CLAIM REWARD":"IN PROGRESS"}</button>
  </section>})}</div><a href="/stats" className="mt-5 block rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-4 text-sm font-bold text-cyan-200">🏆 View existing global leaderboard →</a>
 </main>
}
