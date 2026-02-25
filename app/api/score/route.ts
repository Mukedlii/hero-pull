import { NextRequest, NextResponse } from 'next/server'

function getStore() {
  const g = globalThis as any
  if (!g.__HERO_PULL_STORE) {
    g.__HERO_PULL_STORE = { scores: new Map<string, number>(), seen: new Set<string>() }
  }
  return g.__HERO_PULL_STORE as { scores: Map<string, number>; seen: Set<string> }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fid = Number(searchParams.get('fid'))
  if (!Number.isFinite(fid) || fid <= 0) {
    return NextResponse.json({ error: 'missing/invalid fid' }, { status: 400 })
  }

  const store = getStore()
  const score = store.scores.get(`fid:${fid}`) ?? 0
  return NextResponse.json({ fid, score })
}
