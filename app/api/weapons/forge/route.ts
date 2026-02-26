import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { generateWeapon } from '@/lib/weapons'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const fid = Number(body?.fid)
  if (!Number.isFinite(fid) || fid <= 0) return NextResponse.json({ error: 'invalid fid' }, { status: 400 })

  // NOTE: prototype forge is free (no onchain). We only persist to Supabase.
  const weapon = generateWeapon()

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('player_weapons')
    .insert({ fid, weapon })
    .select('id, fid, weapon, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data }, { headers: { 'cache-control': 'no-store, max-age=0' } })
}
