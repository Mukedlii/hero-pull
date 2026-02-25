import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

type Action = 'battle' | 'share' | 'merge' | 'admin'

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const fid = Number(body?.fid)
  const delta = Number(body?.delta)
  const action = String(body?.action || 'battle') as Action
  const ref = body?.ref ? String(body.ref) : null

  if (!Number.isFinite(fid) || fid <= 0) return NextResponse.json({ error: 'invalid fid' }, { status: 400 })
  if (!Number.isFinite(delta)) return NextResponse.json({ error: 'invalid delta' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  // Upsert score with clamp at 0
  const { data: existing } = await supabase
    .from('player_scores')
    .select('score')
    .eq('fid', fid)
    .maybeSingle()

  const current = existing?.score ?? 0
  const next = Math.max(0, Math.floor(current + delta))

  const upsert = await supabase.from('player_scores').upsert({ fid, score: next, updated_at: new Date().toISOString() })
  if (upsert.error) {
    return NextResponse.json({ error: upsert.error.message }, { status: 500 })
  }

  // Best-effort event log
  await supabase.from('score_events').insert({ fid, action, delta: Math.floor(delta), ref }).then(() => {})

  return NextResponse.json({ ok: true, fid, score: next })
}
