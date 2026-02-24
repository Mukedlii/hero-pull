import "./globals.css"
import type { ReactNode } from "react"

export const metadata = {
  title: "Hero Pull",
  description: "Gacha-style superhero NFT mini app on Base",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://hero-pull.vercel.app/og.png" />
        <meta property="fc:frame:button:1" content="Pull a Hero!" />
        <meta property="fc:frame:post_url" content="https://hero-pull.vercel.app/api/frame" />
      </head>
      <body className="bg-black text-white min-h-screen flex justify-center items-start">
        {children}
      </body>
    </html>
  )
}
