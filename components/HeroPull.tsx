"use client"

import { useEffect, useState } from 'react'
import { generateHero, Hero } from '@/lib/heroes'
import MintButton from './MintButton'

export default function HeroPull() {
  const [hero, setHero] = useState<Hero | null>(null)
  const [isFreeAvailable, setFreeAvailable] = useState(true)
  const [isRevealing, setIsRevealing] = useState(false)
  const [hasShared, setHasShared] = useState(false)

  useEffect(() => {
    const initSDK = async () => {
      try {
        const { sdk } = await import('@farcaster/frame-sdk')
        await sdk.actions.ready()
      } catch (e) {
        console.log('Not in Farcaster context')
      }
    }
    initSDK()
    const today = new Date().toDateString()
    const last = localStorage.getItem('hero-pull-last-free')
    setFreeAvailable(last !== today)
  }, [])

  const handlePull = async () => {
    setIsRevealing(true)
    await new Promise(r => setTimeout(r, 800))
    const newHero = generateHero()
    setHero(newHero)
    setHasShared(false)
    const today = new Date().toDateString()
    localStorage.setItem('hero-pull-last-free', today)
    setFreeAvailable(false)
    setIsRevealing(false)
  }

  const handleShare = async () => {
    if (!hero) return
    const text = `I pulled a ${hero.rarity} hero in Hero Pull! ⚔️\n\n${hero.name} ⚡️ Power: ${hero.power}\n\nPlay here 👇`
    const frameUrl = 'https://hero-pull.vercel.app'
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(frameUrl)}`

    // Mark as shared immediately after user initiates sharing (best-effort gating)
    setHasShared(true)

    // In Warpcast, prefer SDK openUrl so it opens in-app (otherwise iOS may show Farcaster download page)
    try {
      const { sdk } = await import('@farcaster/frame-sdk')
      await sdk.actions.openUrl(url)
      return
    } catch {
      // fallback
    }

    window.open(url, '_blank')
  }

  const rarityColors: Record<string, string> = {
    Common: 'border-gray-400 glow-common',
    Rare: 'border-blue-500 glow-rare',
    Epic: 'border-purple-500 glow-epic',
    Legendary: 'border-yellow-400 glow-legendary',
  }

  return (
    <div className="flex flex-col items-center gap-6 mt-8 px-4 pb-16">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-yellow-400 bg-clip-text text-transparent">
          Hero Pull
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Pull a random superhero NFT on Base</p>
      </div>

      {isFreeAvailable ? (
        <button
          onClick={handlePull}
          disabled={isRevealing}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 px-10 rounded-2xl shadow-lg text-lg transition-all disabled:opacity-60"
        >
          {isRevealing ? 'Revealing...' : 'Pull Hero (FREE)'}
        </button>
      ) : null}

      {isRevealing && <div className="text-4xl animate-bounce">🎴</div>}

      {hero && !isRevealing && (
        <div className={`relative w-80 p-5 rounded-2xl border-2 text-center bg-gray-900 ${rarityColors[hero.rarity]}`}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-800 px-3 py-1 rounded-full text-xs font-bold border border-gray-600">
            {hero.rarity}
          </div>
          <div className="flex justify-center mt-2 mb-3">
            <img src={hero.imageUrl} alt={hero.name} className="w-36 h-36 rounded-xl" />
          </div>
          <h2 className="text-2xl font-extrabold mb-1">{hero.name}</h2>
          <p className="text-gray-300 text-sm">Power: {hero.power}</p>
          <p className="text-gray-400 text-xs mt-1">{hero.gender}</p>
          {hero.rarity === 'Legendary' && (
            <p className="text-yellow-400 text-xs font-bold mt-2 animate-pulse">
              LEGENDARY! Mint this as NFT!
            </p>
          )}
        </div>
      )}

      {hero && !isRevealing && (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleShare}
            className="bg-purple-700 hover:bg-purple-600 text-white py-2 px-6 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <span>Share on Warpcast</span>
            {hasShared && <span className="text-green-400 text-base">✓</span>}
          </button>

          <MintButton onPulled={(h) => setHero(h)} />
        </div>
      )}

      {hero && !isFreeAvailable && (
        <p className="text-gray-500 text-xs text-center">
          Free pull resets daily. Extra pulls cost 0.00066 ETH
        </p>
      )}
    </div>
  )
}
