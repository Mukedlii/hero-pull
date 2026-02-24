import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Hero Pull',
  description: 'Gacha-style superhero NFT mini app on Base',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen flex justify-center items-start">
        {children}
      </body>
    </html>
  )
}