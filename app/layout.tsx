import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hero Pull — Build Your Legend",
  description: "Collect powerful heroes, master your gear, and conquer the arena.",
  applicationName: "Hero Pull",
  openGraph: {
    title: "Hero Pull — Build Your Legend",
    description: "Collect powerful heroes, master your gear, and conquer the arena.",
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hero Pull — Build Your Legend",
    description: "Collect powerful heroes, master your gear, and conquer the arena.",
    images: ["/og.png"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#070711] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col">
          <main className="flex-1 pb-20">{children}</main>
          <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#090914]/95 px-2 py-2 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-2xl justify-around">
              <a href="/" className="flex flex-col items-center gap-1 px-2 text-sky-300 hover:text-sky-100" data-testid="nav-home">
                <span className="text-xl">⌂</span><span className="text-[10px]">Home</span>
              </a>
              <a href="/arena" className="flex flex-col items-center gap-1 px-2 text-rose-300 hover:text-rose-100" data-testid="nav-arena">
                <span className="text-xl">⚔</span><span className="text-[10px]">Arena</span>
              </a>
              <a href="/collection" className="flex flex-col items-center gap-1 px-2 text-violet-300 hover:text-violet-100" data-testid="nav-heroes">
                <span className="text-xl">♙</span><span className="text-[10px]">Heroes</span>
              </a>
              <a href="/shop" className="flex flex-col items-center gap-1 px-2 text-indigo-300 hover:text-indigo-100" data-testid="nav-shop">
                <span className="text-xl">✧</span><span className="text-[10px]">Shop</span>
              </a>
              <a href="/stats" className="flex flex-col items-center gap-1 px-2 text-emerald-300 hover:text-emerald-100" data-testid="nav-stats">
                <span className="text-xl">▥</span><span className="text-[10px]">Stats</span>
              </a>
            </div>
          </nav>
        </div>
      </body>
    </html>
  )
}
