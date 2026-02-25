"use client"

import { useEffect, useState } from "react"
import HeroPull from "../components/HeroPull"

export default function Page() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(t)
  }, [])

  if (loading) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{
          backgroundImage: "url(/splash.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    )
  }

  return (
    <main className="w-full max-w-md mx-auto">
      <h1 className="text-3xl font-extrabold text-center mt-6">Hero Pull</h1>
      <p className="text-center text-gray-400 mt-2">Test your luck and mint a unique superhero!</p>
      <HeroPull />
    </main>
  )
}
