import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hero Pull",
  description: "Gacha-style superhero NFT mini app on Base",
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "https://hero-pull.vercel.app/og.png",
      button: {
        title: "Pull a Hero!",
        action: {
          type: "launch_frame",
          name: "Hero Pull",
          url: "https://hero-pull.vercel.app",
          splashImageUrl: "https://hero-pull.vercel.app/splash.png",
          splashBackgroundColor: "#1a1a2e",
        },
      },
    }),
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen flex justify-center items-start">
        <div className="w-full max-w-md min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>

          <nav className="w-full max-w-md mx-auto flex justify-around py-3 bg-gray-900 border-t border-gray-700 sticky bottom-0 z-50">
            <a href="/" className="flex flex-col items-center text-blue-400 hover:text-blue-300">
              <span className="text-2xl">🏠</span>
              <span className="text-xs mt-1">Home</span>
            </a>
            <a href="/arena" className="flex flex-col items-center text-red-400 hover:text-red-300">
              <span className="text-2xl">⚔️</span>
              <span className="text-xs mt-1">Arena</span>
            </a>
            <a href="/collection" className="flex flex-col items-center text-purple-400 hover:text-purple-300">
              <span className="text-2xl">🦸</span>
              <span className="text-xs mt-1">Heroes</span>
            </a>
            <a href="/merge" className="flex flex-col items-center text-yellow-400 hover:text-yellow-300">
              <span className="text-2xl">⚗️</span>
              <span className="text-xs mt-1">Merge</span>
            </a>
            <a href="/shop" className="flex flex-col items-center text-indigo-400 hover:text-indigo-300">
              <span className="text-2xl">🛒</span>
              <span className="text-xs mt-1">Shop</span>
            </a>
            <a href="/stats" className="flex flex-col items-center text-green-400 hover:text-green-300">
              <span className="text-2xl">📊</span>
              <span className="text-xs mt-1">Stats</span>
            </a>
          </nav>
        </div>
      </body>
    </html>
  )
}
