"use client"

import type { ReactNode } from "react"
import { CrossmintProvider } from "@crossmint/client-sdk-react-ui"

export function Providers({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_KEY
  if (!apiKey) return <>{children}</>

  return <CrossmintProvider apiKey={apiKey}>{children}</CrossmintProvider>
}
