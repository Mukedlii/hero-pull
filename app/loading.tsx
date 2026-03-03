export default function Loading() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-end pb-24"
      style={{
        backgroundImage: "url(/splash.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex gap-2">
        <span className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <p className="text-gray-400 text-xs mt-3 animate-pulse">Loading...</p>
    </div>
  )
}
