"use client"

import { useMemo } from "react"
import { CrossmintHostedCheckout } from "@crossmint/client-sdk-react-ui"

interface Props {
  onPulled: (hero: any) => void
}

/**
 * Crossmint checkout button for extra pulls.
 * Note: The actual "Primary Sales Recipient" / payment receiver must be
 * configured in Crossmint Console for the collection.
 */
export default function MintButton(_props: Props) {
  const collectionId = process.env.NEXT_PUBLIC_CROSSMINT_COLLECTION_ID

  const canRender = Boolean(process.env.NEXT_PUBLIC_CROSSMINT_API_KEY && collectionId)

  const lineItems = useMemo(() => {
    if (!collectionId) return []
    // Best-effort locator format; adjust if Crossmint console expects a different locator.
    return [{ collectionLocator: `crossmint:${collectionId}` }]
  }, [collectionId])

  if (!canRender) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          disabled
          className="bg-gray-700 text-white font-semibold py-3 px-6 rounded shadow opacity-60"
        >
          Mint (0.000777 ETH)
        </button>
        <p className="text-xs text-gray-500">
          Missing Crossmint env vars (API key / collection id).
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <CrossmintHostedCheckout
        lineItems={lineItems as any}
        payment={{
          fiat: { enabled: false },
          crypto: { enabled: true, defaultChain: "base" },
          defaultMethod: "crypto",
        } as any}
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded shadow"
      >
        Mint (0.000777 ETH)
      </CrossmintHostedCheckout>
      <p className="text-xs text-gray-500">
        Payments receiver set in Crossmint Console (Base).
      </p>
    </div>
  )
}
