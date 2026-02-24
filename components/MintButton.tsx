"use client"

import { useState } from "react"
import { generateHero, type Hero } from "@/lib/heroes"
import { CrossmintHostedCheckout } from "@crossmint/client-sdk-react-ui"

interface Props {
  onPulled: (hero: Hero) => void
}

export default function MintButton({ onPulled }: Props) {
  const [showCheckout, setShowCheckout] = useState(false)

  const handlePull = () => {
    const newHero = generateHero()
    onPulled(newHero)
    setShowCheckout(true)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handlePull}
        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold py-4 px-10 rounded-2xl shadow-lg text-lg transition-all"
      >
        Mint Hero (0.00066 ETH)
      </button>

      {showCheckout && (
        <CrossmintHostedCheckout
          lineItems={{
            collectionLocator: "crossmint:529862be-ba1e-4792-a533-2dc9e68f97c6",
            callData: {
              totalPrice: "0.00066",
              quantity: 1,
            },
          }}
          payment={{
            crypto: { enabled: true },
            fiat: { enabled: true },
          }}
        />
      )}
    </div>
  )
}
