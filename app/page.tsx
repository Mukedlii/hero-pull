"use client"

import { useEffect, useState } from "react"
import HeroPull from "../components/HeroPull"

export default function Page() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(t)
  }, [])

  if (loading) {
    return (
      <div className="relative flex min-h-[72vh] w-full flex-col items-center justify-center overflow-hidden bg-[#080713] px-6 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(124,58,237,0.35),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgba(217,70,239,0.12),transparent_45%)]" />
        <div className="relative">
          <div className="mx-auto mb-7 flex h-36 w-36 items-center justify-center rounded-full border border-violet-300/25 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 shadow-[0_0_90px_rgba(139,92,246,0.25)]">
            <span className="text-7xl text-violet-100 drop-shadow-[0_0_22px_rgba(196,181,253,0.8)]">✦</span>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.45em] text-violet-300">Enter the realm</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-fuchsia-200 to-amber-100">HERO PULL</h1>
          <div className="mt-7 flex justify-center gap-2">
            <span className="h-2 w-2 animate-bounce rounded-full bg-violet-300" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-fuchsia-300 [animation-delay:120ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-amber-200 [animation-delay:240ms]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl">
      <HeroPull />
    </main>
  )
}
