"use client"

import { useState } from "react"
import { generateHero, type Hero } from "@/lib/heroes"

const PAYMENT_AMOUNT_ETH = "0.00066"
const PAYMENT_CHAIN = "Base"
const PAYMENT_ADDRESS = "0xa782922Ff9c54F4264FD049189eC66940f528Eb0"

interface Props {
  onPulled: (hero: Hero) => void
}

export default function MintButton({ onPulled }: Props) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [lastHero, setLastHero] = useState<Hero | null>(null)
  const [copied, setCopied] = useState(false)

  const handleClick = () => {
    setLoading(true)
    const hero = generateHero()
    setLastHero(hero)
    onPulled(hero)
    setShowModal(true)
    setLoading(false)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_ADDRESS)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // no-op
    }
  }

  const handleShare = () => {
    if (!lastHero) return
    const text = `I pulled a ${lastHero.rarity} hero in Hero Pull!\n\n⚔️ ${lastHero.name}\n⚡️ Power: ${lastHero.power}\n\nPlay here 👇`
    const frameUrl = "https://hero-pull.vercel.app"
    window.open(
      `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(frameUrl)}`,
      "_blank"
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        disabled={loading}
        onClick={handleClick}
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded shadow disabled:opacity-50"
      >
        {loading ? "Pulling..." : "Pull Hero (0.000777 ETH)"}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold">Payment</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-300 mt-3">
              Send <span className="font-semibold">{PAYMENT_AMOUNT_ETH} ETH</span> on{" "}
              <span className="font-semibold">{PAYMENT_CHAIN}</span> to:
            </p>

            <div className="mt-2 rounded-xl bg-black/40 border border-gray-700 p-3">
              <div className="break-all font-mono text-sm text-gray-200">{PAYMENT_ADDRESS}</div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold py-2 px-3 rounded-lg"
                >
                  {copied ? "Copied" : "Copy address"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold py-2 px-3 rounded-lg"
                >
                  I sent it – Share my hero!
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Then share your hero!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
