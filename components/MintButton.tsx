"use client"

import { useState } from 'react'
import { generateHero, Hero } from '@/lib/heroes'
// Crossmint pay button provides a hosted checkout for NFT minting. The
// component is imported here but usage is optional; if the package
// fails to install in a restricted environment it will simply not
// render.
import { CrossmintPayButton } from '@crossmint/client-sdk-react-ui'

interface Props {
  onPulled: (hero: Hero) => void
}

/**
 * MintButton simulates a paid pull. In a production app you would
 * integrate a payment flow using Wagmi/viem or Crossmint to collect
 * `0.000777 ETH` and mint the NFT. For simplicity this demo
 * immediately generates a new hero when clicked.
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
        {loading ? 'Pulling...' : 'Pull Hero (0.000777 ETH)'}
      </button>
      {/*
        Optional Crossmint checkout button. Provide your Crossmint
        project/client ID via the NEXT_PUBLIC_CROSSMINT_PROJECT_ID
        environment variable. The button opens a hosted checkout in a
        new tab. The integration does not trigger onPulled – you may
        choose to call onPulled manually once the transaction is
        confirmed using webhooks or other means.
      */}
      {typeof CrossmintPayButton !== 'undefined' && (
        <CrossmintPayButton
          clientId={process.env.NEXT_PUBLIC_CROSSMINT_PROJECT_ID || ''}
          mintConfig={{ type: 'erc-721', price: '0.000777', quantity: '1' }}
          environment="staging"
          checkoutMethod="redirect"
        />
      )}
    </div>
  )
}