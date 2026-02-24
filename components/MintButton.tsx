"use client"

import { useState } from "react"
import { generateHero, Hero } from "@/lib/heroes"

interface Props {
  onPulled: (hero: Hero) => void
}

/**
 * TEMP: This button currently simulates a paid pull.
 * Crossmint checkout/minting will be wired next (the previous
 * CrossmintPayButton export is not available in the installed SDK).
 */
export default function MintButton({ onPulled }: Props) {
  const [loading, setLoading] = useState(false)

  const handleClick = () => {
    setLoading(true)
    const hero = generateHero()
    onPulled(hero)
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        disabled={loading}
        onClick={handleClick}
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded shadow disabled:opacity-50"
      >
        {loading ? "Pulling..." : "Pull Hero (0.00066 ETH)"}
      </button>
      <p className="text-xs text-gray-500">
        Minting checkout (Crossmint) is being enabled.
      </p>
    </div>
  )
}
