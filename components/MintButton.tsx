"use client"

import { useState } from "react"
import { generateHero, type Hero } from "@/lib/heroes"

interface Props {
  onPulled: (hero: Hero) => void
}

export default function MintButton({ onPulled }: Props) {
  const [loading, setLoading] = useState(false)

  const handleMint = async () => {
    setLoading(true)

    const hero = generateHero()
    onPulled(hero)

    const collectionId = "529862be-ba1e-4792-a533-2dc9e68f97c6"
    const clientId = process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_KEY

    const mintUrl = `https://crossmint.com/checkout?clientId=${encodeURIComponent(
      clientId || ""
    )}&collectionId=${encodeURIComponent(collectionId)}&quantity=1&currency=eth&locale=en-US`

    window.open(mintUrl, "_blank")
    setLoading(false)
  }

  return (
    <button
      disabled={loading}
      onClick={handleMint}
      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold py-4 px-10 rounded-2xl shadow-lg text-lg transition-all disabled:opacity-60"
    >
      {loading ? "Opening..." : "Mint Hero (0.00066 ETH)"}
    </button>
  )
}
