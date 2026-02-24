"use client"

import { type ReactNode } from "react"
import { CrossmintProvider } from "@crossmint/client-sdk-react-ui"

export function Providers({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_CROSSMINT_API_KEY

  // If apiKey is missing, still render the app (mint button can show a fallback).
  if (!apiKey) return <>{children}</>

  return <CrossmintProvider apiKey={apiKey}>{children}</CrossmintProvider>
}
