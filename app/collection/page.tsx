"use client"

import { HeroesMasterDetail } from "@/components/HeroesMasterDetail"

export default function CollectionPage() {
  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">Heroes</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">Manage your heroes and equipment</p>

      <HeroesMasterDetail />

      <div className="flex justify-center mt-8">
        <a href="/" className="bg-purple-700 hover:bg-purple-600 text-white py-2 px-4 rounded-lg">
          Go Pull a Hero
        </a>
      </div>
    </div>
  )
}
