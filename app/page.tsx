"use client"

import HeroPull from "../components/HeroPull"

/**
 * The landing page for the Hero Pull mini app. This component is
 * rendered by the Next.js App Router and contains the core game
 * experience. The layout wrapper handles calling the Farcaster
 * SDK’s ready action.
 */
export default function Page() {
  return (
    <main className="w-full max-w-md mx-auto">
      <h1 className="text-3xl font-extrabold text-center mt-6">Hero Pull</h1>
      <p className="text-center text-gray-400 mt-2">
        Test your luck and mint a unique superhero!
      </p>
      <HeroPull />
    </main>
  )
}