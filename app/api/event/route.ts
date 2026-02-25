import { NextRequest, NextResponse } from 'next/server'
import { hasRecentShare } from '@/lib/neynar'

type Action = 'share' | 'battle' | 'merge'

// NOTE: This endpoint is kept for prototype events (e.g. share verification).
// Scores are now persisted via /api/score/add (Supabase).

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const fid = Number(body?.fid)
  const action = body?.action as Action
  const castHash = (body?.castHash as string | undefined) || undefined

  if (!Number.isFinite(fid) || fid <= 0) {
    return NextResponse.json({ error: 'missing/invalid fid' }, { status: 400 })
  }
  if (!action) {
    return NextResponse.json({ error: 'missing action' }, { status: 400 })
  }

  const now = Date.now()

  // idempotency: same castHash counted once (in-memory only; good enough for now)
  const g = globalThis as any
  g.__HERO_PULL_SEEN ||= new Set<string>()
  const seen: Set<string> = g.__HERO_PULL_SEEN
  if (castHash) {
    const seenKey = `${action}:${castHash}`
    if (seen.has(seenKey)) {
      return NextResponse.json({ ok: true, deduped: true })
    }
    seen.add(seenKey)
  }

  let delta = 0
  let verified = false

  if (action === 'share') {
    // Anti-spam: max 1 share reward per 6 hours
    const cooldownKey = `shareCooldown:${fid}`
    const last = (globalThis as any)[cooldownKey] as number | undefined
    if (last && now - last < 6 * 60 * 60 * 1000) {
      return NextResponse.json({ ok: true, cooldown: true, score: store.scores.get(key) ?? 0 })
    }

    try {
      verified = await hasRecentShare({ fid, appUrl: 'https://hero-pull.vercel.app' })
    } catch {
      verified = false
    }

    if (verified) {
      delta = 1
      ;(globalThis as any)[cooldownKey] = now
    }
  }

  return NextResponse.json({ ok: true, fid, action, delta, verified })
}
