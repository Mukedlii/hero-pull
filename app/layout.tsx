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
        {children}
      </body>
    </html>
  )
}
