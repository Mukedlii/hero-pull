"use client"

import { useEffect, useState } from "react"

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => console.error("Service worker registration failed", error))
    }
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone) return
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIos(isIos)
    if (localStorage.getItem("hero-pull-install-dismissed") === "1") return
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as InstallPromptEvent)
      setShow(true)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    if (isIos) setShow(true)
    return () => window.removeEventListener("beforeinstallprompt", onPrompt)
  }, [])

  const install = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === "accepted") setShow(false)
    setInstallEvent(null)
  }

  const dismiss = () => {
    localStorage.setItem("hero-pull-install-dismissed", "1")
    setShow(false)
  }

  if (!show) return null
  return (
    <aside className="fixed bottom-20 left-3 right-3 z-[60] mx-auto max-w-md rounded-2xl border border-violet-400/30 bg-[#171326] p-4 shadow-2xl shadow-black/50 md:bottom-5 md:left-auto md:right-5">
      <div className="flex items-start gap-3">
        <img src="/icon.png" alt="" className="h-12 w-12 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">Install Hero Pull</p>
          {ios ? (
            <p className="mt-1 text-xs leading-relaxed text-violet-100/80">iPhone-on: nyomd meg a Megosztás gombot, majd válaszd a „Főképernyőhöz adás” lehetőséget.</p>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-violet-100/80">Tedd ki a telefonod vagy számítógéped kezdőképernyőjére, és indítsd külön alkalmazásként.</p>
          )}
          <div className="mt-3 flex gap-2">
            {!ios && installEvent && <button onClick={install} className="rounded-lg bg-violet-500 px-3 py-2 text-xs font-bold text-white hover:bg-violet-400">Install app</button>}
            <button onClick={dismiss} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:bg-white/5">Later</button>
          </div>
        </div>
        <button onClick={dismiss} aria-label="Dismiss install prompt" className="px-1 text-white/50">✕</button>
      </div>
    </aside>
  )
}
