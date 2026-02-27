"use client"

import { useEffect } from "react"

/**
 * /weapons is deprecated.
 * Inventory + equipping now lives under Heroes → Weapons and buying happens in /shop.
 */
export default function WeaponsPage() {
  useEffect(() => {
    if (typeof window !== "undefined") window.location.href = "/shop"
  }, [])

  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">Items</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">This page moved to the Shop.</p>
      <div className="flex justify-center mt-6">
        <a href="/shop" className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-xl">
          Go to Shop
        </a>
      </div>
    </div>
  )
}
