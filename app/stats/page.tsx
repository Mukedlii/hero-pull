"use client"

import { useEffect, useState } from "react"
import { readScore } from "@/lib/score"
import { getWalletAddress, loadStats } from "@/lib/db"
import MigrationPanel from "@/components/MigrationPanel"

type Item = { fid: number; score: number }

export default function StatsPage() {
  const [tab, setTab] = useState<"stats" | "migration">("stats")
  const [score, setScore] = useState<number | null>(null)
  const [fid, setFid] = useState<number | null>(null)
  const [leaderboard, setLeaderboard] = useState<Item[]>([])

  useEffect(() => {
    ;(async () => {
      // 1) Always try to load leaderboard (fid-based)
      try {
        const lb = await fetch("/api/leaderboard?limit=25", { cache: "no-store" }).then((r) => r.json())
        setLeaderboard(Array.isArray(lb?.items) ? lb.items : [])
      } catch {
        setLeaderboard([])
      }

      // 2) Prefer wallet stats IF available, but don't early-return if missing
      let walletPoints: number | null = null
      try {
        const wallet = await getWalletAddress()
        if (wallet) {
          const s: any = await loadStats(wallet)
          if (s?.points != null) walletPoints = Number(s.points)
        }
      } catch {
        // ignore
      }

      // 3) Fallback to fid-based score
      let fidPoints: number | null = null
      try {
        const mod: any = await import("@farcaster/frame-sdk")
        const ctx: any = await mod?.sdk?.context
        const f = ctx?.user?.fid
        if (f) {
          setFid(f)
          const me = await fetch(`/api/profile?fid=${f}`, { cache: "no-store" }).then((r) => r.json())
          if (me?.item?.score != null) fidPoints = Number(me.item.score)
          else {
            // legacy in-memory store
            fidPoints = await readScore().catch(() => 0)
          }
        }
      } catch {
        // ignore
      }

      // Choose best available
      if (walletPoints != null) setScore(walletPoints)
      else if (fidPoints != null) setScore(fidPoints)
      else readScore().then(setScore).catch(() => setScore(0))
    })()
  }, [])

  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">Stats</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">Airdrop points</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => setTab("stats")}
          className={`py-2 rounded-xl text-xs font-bold border ${tab === "stats" ? "bg-purple-700 border-purple-500" : "bg-gray-900 border-gray-800"}`}
        >
          Stats
        </button>
        <button
          onClick={() => setTab("migration")}
          className={`py-2 rounded-xl text-xs font-bold border ${tab === "migration" ? "bg-purple-700 border-purple-500" : "bg-gray-900 border-gray-800"}`}
        >
          Migration
        </button>
      </div>

      {tab === "migration" ? (
        <MigrationPanel />
      ) : (
        <>
          <div className="mt-8 border border-gray-800 bg-gray-900 rounded-2xl p-5">
            <div className="text-sm text-gray-400">Total Points</div>
            <div className="text-4xl font-extrabold mt-1">{score ?? "…"}</div>
            <div className="text-xs text-gray-500 mt-2">Battle scoring: Victory +5, Defeat -4 (never below 0).</div>
            <div className="text-xs text-gray-500 mt-1">Saved server-side (Supabase) when available.</div>
          </div>

          {leaderboard.length > 0 && (
            <div className="mt-6 border border-gray-800 bg-gray-900 rounded-2xl p-5">
              <div className="text-sm text-gray-400">Leaderboard (Top 25)</div>
              <div className="mt-3 flex flex-col gap-2">
                {leaderboard.map((it, idx) => (
                  <div
                    key={it.fid}
                    className={`flex items-center justify-between text-sm ${fid === it.fid ? "text-yellow-300" : "text-gray-200"}`}
                  >
                    <div>
                      #{idx + 1} • fid {it.fid}
                    </div>
                    <div className="font-bold">{it.score}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
