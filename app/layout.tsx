import "./globals.css"
import type { Metadata } from "next"
import Link from "next/link"

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

          <nav className="sticky bottom-0 w-full border-t border-gray-800 bg-black/90 backdrop-blur px-4 py-3">
            <div className="flex items-center justify-between text-sm font-semibold">
              <Link className="text-gray-200 hover:text-white" href="/">
                🏠 Home
              </Link>
              <Link className="text-gray-200 hover:text-white" href="/battle">
                ⚔️ Battle
              </Link>
              <Link className="text-gray-200 hover:text-white" href="/merge">
                ⚗️ Merge
              </Link>
              <Link className="text-gray-200 hover:text-white" href="/stats">
                📊 Stats
              </Link>
            </div>
          </nav>
        </div>
      </body>
    </html>
  )
}
