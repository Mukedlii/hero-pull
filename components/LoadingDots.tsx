"use client"

export default function LoadingDots({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10" data-testid="loading-indicator">
      <div className="flex gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <p className="text-gray-400 text-xs mt-2 animate-pulse">{text}</p>
    </div>
  )
}
