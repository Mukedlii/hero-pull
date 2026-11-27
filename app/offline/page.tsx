export default function OfflinePage() {
  return (
    <main className="flex min-h-[75vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-400/30 bg-violet-500/10 text-4xl">✦</div>
      <p className="text-xs font-black uppercase tracking-[0.35em] text-violet-300">Hero Pull</p>
      <h1 className="mt-3 text-3xl font-black text-white">You are offline</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">The game needs an internet connection to load. Reconnect and try again. Your current game data has not been changed by this offline page.</p>
      <a href="/" className="mt-7 rounded-xl bg-violet-500 px-6 py-3 text-sm font-bold text-white hover:bg-violet-400">Try again</a>
    </main>
  )
}
