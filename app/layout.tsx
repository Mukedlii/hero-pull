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

          <nav className="w-full max-w-md mx-auto flex justify-around py-2 bg-gray-900/95 backdrop-blur border-t border-gray-700 sticky bottom-0 z-50">
            <a href="/" className="flex flex-col items-center text-blue-400 hover:text-blue-300 group" data-testid="nav-home">
              <img src="/icons/nav_home.png" alt="Home" className="w-7 h-7 object-contain group-hover:scale-110 transition-transform" />
              <span className="text-[10px] mt-0.5">Home</span>
            </a>
            <a href="/arena" className="flex flex-col items-center text-red-400 hover:text-red-300 group" data-testid="nav-arena">
              <img src="/icons/nav_arena.png" alt="Arena" className="w-7 h-7 object-contain group-hover:scale-110 transition-transform" />
              <span className="text-[10px] mt-0.5">Arena</span>
            </a>
            <a href="/collection" className="flex flex-col items-center text-purple-400 hover:text-purple-300 group" data-testid="nav-heroes">
              <img src="/icons/nav_heroes.png" alt="Heroes" className="w-7 h-7 object-contain group-hover:scale-110 transition-transform" />
              <span className="text-[10px] mt-0.5">Heroes</span>
            </a>
            <a href="/merge" className="flex flex-col items-center text-yellow-400 hover:text-yellow-300 group" data-testid="nav-merge">
              <img src="/icons/nav_merge.png" alt="Merge" className="w-7 h-7 object-contain group-hover:scale-110 transition-transform" />
              <span className="text-[10px] mt-0.5">Merge</span>
            </a>
            <a href="/shop" className="flex flex-col items-center text-indigo-400 hover:text-indigo-300 group" data-testid="nav-shop">
              <img src="/icons/nav_shop.png" alt="Shop" className="w-7 h-7 object-contain group-hover:scale-110 transition-transform" />
              <span className="text-[10px] mt-0.5">Shop</span>
            </a>
            <a href="/stats" className="flex flex-col items-center text-green-400 hover:text-green-300 group" data-testid="nav-stats">
              <img src="/icons/nav_stats.png" alt="Stats" className="w-7 h-7 object-contain group-hover:scale-110 transition-transform" />
              <span className="text-[10px] mt-0.5">Stats</span>
            </a>
          </nav>
        </div>
      </body>
    </html>
  )
}
