"use client"

export default function DungeonPage() {
  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">Dungeon</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">Coming soon.</p>

      <div className="mt-6 border border-gray-800 bg-gray-900 rounded-2xl p-5 text-sm text-gray-300">
        Dungeon mode is under construction in this build.
        <div className="text-xs text-gray-500 mt-2">
          Arena (single + PvP) uses your hero’s effective stats including item bonuses.
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <a href="/arena" className="bg-purple-700 hover:bg-purple-600 text-white text-sm font-bold py-3 rounded-xl text-center">
          Back to Arena
        </a>
        <a href="/collection" className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold py-3 rounded-xl text-center">
          Heroes
        </a>
      </div>
    </div>
  )
}
