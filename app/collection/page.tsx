"use client"

import { WalletHeroes } from "@/components/WalletHeroes"
import type { Hero } from "@/lib/heroes"

export default function CollectionPage() {
  const selectHero = (hero: Hero & { tokenId?: string }) => {
    // Store only the selected hero for the next screen
    localStorage.setItem("hero-pull-current-hero", JSON.stringify(hero))
    window.location.href = "/battle"
  }

  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">My Heroes</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">Loaded directly from your wallet (on-chain)</p>

      <WalletHeroes onSelect={selectHero} />

      <div className="flex justify-center mt-8">
        <a href="/" className="bg-purple-700 hover:bg-purple-600 text-white py-2 px-4 rounded-lg">
          Go Pull a Hero
        </a>
      </div>
    </div>
  )
}
