import "./globals.css"
import type { Metadata, Viewport } from "next"
import InstallPrompt from "../components/InstallPrompt"

export const metadata: Metadata = {
  title: "Hero Pull — Build Your Legend",
  description: "Collect powerful heroes, master your gear, and conquer the arena.",
  applicationName: "Hero Pull",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Hero Pull" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
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

export const viewport: Viewport = { themeColor: "#090914", width: "device-width", initialScale: 1, viewportFit: "cover" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#070711] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col">
          <main className="flex-1 pb-24 md:pb-8 md:pt-20">{children}</main>
          <InstallPrompt />
          <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#090914]/95 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:bottom-auto md:top-0 md:border-b md:border-t-0 md:px-6 md:py-3">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-around md:justify-end md:gap-8">
              <a href="/" className="flex flex-col items-center gap-1 px-2 text-sky-300 hover:text-sky-100 md:flex-row md:gap-2 md:text-sm" data-testid="nav-home">
                <span className="text-xl">⌂</span><span className="text-[10px]">Home</span>
              </a>
              <a href="/arena" className="flex flex-col items-center gap-1 px-2 text-rose-300 hover:text-rose-100 md:flex-row md:gap-2 md:text-sm" data-testid="nav-arena">
                <span className="text-xl">⚔</span><span className="text-[10px]">Arena</span>
              </a>
              <a href="/collection" className="flex flex-col items-center gap-1 px-2 text-violet-300 hover:text-violet-100 md:flex-row md:gap-2 md:text-sm" data-testid="nav-heroes">
                <span className="text-xl">♙</span><span className="text-[10px]">Heroes</span>
              </a>
              <a href="/shop" className="flex flex-col items-center gap-1 px-2 text-indigo-300 hover:text-indigo-100 md:flex-row md:gap-2 md:text-sm" data-testid="nav-shop">
                <span className="text-xl">✧</span><span className="text-[10px]">Shop</span>
              </a>
              <a href="/stats" className="flex flex-col items-center gap-1 px-2 text-emerald-300 hover:text-emerald-100 md:flex-row md:gap-2 md:text-sm" data-testid="nav-stats">
                <span className="text-xl">▥</span><span className="text-[10px]">Stats</span>
              </a>
            </div>
          </nav>
        </div>
      </body>
    </html>
  )
}
