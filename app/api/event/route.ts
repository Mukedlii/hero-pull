import { NextRequest, NextResponse } from 'next/server'
import { hasRecentShare } from '@/lib/neynar'

type Action = 'share' | 'battle' | 'merge'

// Ephemeral in-memory store (good enough for testing; replace with KV/Supabase later)
function getStore() {
  const g = globalThis as any
  if (!g.__HERO_PULL_STORE) {
    g.__HERO_PULL_STORE = { scores: new Map<string, number>(), seen: new Set<string>() }
  }
  return g.__HERO_PULL_STORE as { scores: Map<string, number>; seen: Set<string> }
}

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

  const store = getStore()
  const key = `fid:${fid}`
  const now = Date.now()

  // idempotency: same castHash counted once
  if (castHash) {
    const seenKey = `${action}:${castHash}`
    if (store.seen.has(seenKey)) {
      return NextResponse.json({ ok: true, deduped: true, score: store.scores.get(key) ?? 0 })
    }
    store.seen.add(seenKey)
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

  const current = store.scores.get(key) ?? 0
  const next = Math.max(0, current + delta)
  store.scores.set(key, next)

  return NextResponse.json({ ok: true, fid, action, delta, verified, score: next })
}
