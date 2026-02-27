"use client"

import { useState } from "react"

export default function ArenaPage() {
  const [tab, setTab] = useState<"single" | "pvp">("single")

  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">Arena</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">Choose your mode</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => setTab("single")}
          className={`py-2 rounded-xl text-xs font-bold border ${tab === "single" ? "bg-purple-700 border-purple-500" : "bg-gray-900 border-gray-800"}`}
        >
          Single player
        </button>
        <button
          onClick={() => setTab("pvp")}
          className={`py-2 rounded-xl text-xs font-bold border ${tab === "pvp" ? "bg-purple-700 border-purple-500" : "bg-gray-900 border-gray-800"}`}
        >
          PvP
        </button>
      </div>

      {tab === "single" && (
        <div className="mt-6 border border-gray-800 bg-gray-900 rounded-2xl p-5">
          <div className="text-lg font-extrabold">Dungeon Run</div>
          <div className="text-sm text-gray-400 mt-1">Fight rooms, loot, and bosses.</div>

          <div className="flex flex-col gap-2 mt-4">
            <a href="/dungeon?v=1" className="bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold py-3 rounded-xl text-center">
              ▶ Start Dungeon
            </a>
            <a href="/collection?v=1" className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold py-3 rounded-xl text-center">
              Choose Hero
            </a>
          </div>
        </div>
      )}

      {tab === "pvp" && (
        <div className="mt-6 border border-gray-800 bg-gray-900 rounded-2xl p-5">
          <div className="text-lg font-extrabold">PvP (Work in progress)</div>
          <div className="text-sm text-gray-400 mt-1">
            Next step: async matchmaking + win/loss saved server-side.
          </div>

          <div className="mt-4 text-xs text-gray-500">
            For now: use Dungeon (single player). I’ll add PvP queue + challenge link next.
          </div>
        </div>
      )}
    </div>
  )
}
