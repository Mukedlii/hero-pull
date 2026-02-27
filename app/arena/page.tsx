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
            <a href="/dungeon?v=2" className="bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold py-3 rounded-xl text-center">
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
          <div className="text-lg font-extrabold">PvP</div>
          <div className="text-sm text-gray-400 mt-1">Live turn-based PvP (7s per turn)</div>

          <div className="flex flex-col gap-2 mt-4">
            <a
              href="/pvp"
              className="bg-purple-700 hover:bg-purple-600 text-white text-sm font-bold py-3 rounded-xl text-center"
            >
              ▶ Open PvP
            </a>
            <div className="text-xs text-gray-500 text-center">Create a match and share the link.</div>
          </div>
        </div>
      )}
    </div>
  )
}
