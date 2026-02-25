"use client"

import { useEffect, useState } from "react"
import { readScore } from "@/lib/score"

export default function StatsPage() {
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    readScore().then(setScore).catch(() => setScore(0))
  }, [])

  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">Stats</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">Airdrop points</p>

      <div className="mt-8 border border-gray-800 bg-gray-900 rounded-2xl p-5">
        <div className="text-sm text-gray-400">Total Points</div>
        <div className="text-4xl font-extrabold mt-1">{score ?? "…"}</div>
        <div className="text-xs text-gray-500 mt-2">
          Battle scoring: Victory +5, Defeat -4 (never below 0).
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Anti-cheat: basic local integrity checks (still client-side).
        </div>
      </div>
    </div>
  )
}
