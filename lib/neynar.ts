const NEYNAR_API_BASE = 'https://api.neynar.com'

export function getNeynarApiKey() {
  return process.env.NEYNAR_API_KEY || process.env.NEXT_PUBLIC_NEYNAR_API_KEY
}

async function neynarFetch(path: string) {
  const apiKey = getNeynarApiKey()
  if (!apiKey) throw new Error('Missing NEYNAR_API_KEY')

  const res = await fetch(`${NEYNAR_API_BASE}${path}`, {
    headers: {
      accept: 'application/json',
      api_key: apiKey,
    } as any,
    // avoid Next caching for dynamic checks
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Neynar API error ${res.status}: ${text.slice(0, 200)}`)
  }

  return (await res.json()) as any
}

// Best-effort: find whether user has a recent cast that embeds our app URL.
export async function hasRecentShare(opts: { fid: number; appUrl: string; limit?: number }) {
  const { fid, appUrl, limit = 10 } = opts

  // Endpoint name may vary by Neynar version; adjust if needed.
  const data = await neynarFetch(`/v2/farcaster/feed/user/casts?fid=${fid}&limit=${limit}`)

  const casts: any[] = data?.casts || data?.result?.casts || []
  const urlLower = appUrl.toLowerCase()

  for (const c of casts) {
    const embeds = c?.embeds || c?.cast?.embeds || []
    const text = (c?.text || c?.cast?.text || '').toLowerCase()

    if (text.includes(urlLower)) return true

    for (const e of embeds) {
      const u = (e?.url || e?.cast?.url || '').toLowerCase()
      if (u.includes(urlLower)) return true
    }
  }

  return false
}
