import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { WeaponRarity, generateWeapon, nextWeaponRarity } from '@/lib/weapons'

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
  const rarity = String(body?.rarity || '') as WeaponRarity

  if (!Number.isFinite(fid) || fid <= 0) return NextResponse.json({ error: 'invalid fid' }, { status: 400 })
  if (!['Common', 'Rare', 'Epic'].includes(rarity)) return NextResponse.json({ error: 'invalid rarity' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  // Get latest 3 weapons of that rarity.
  const { data: rows, error } = await supabase
    .from('player_weapons')
    .select('id, weapon')
    .eq('fid', fid)
    .eq('weapon->>rarity', rarity)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows || rows.length < 3) return NextResponse.json({ error: 'not enough weapons' }, { status: 400 })

  const ids = rows.map((r: any) => r.id)

  // delete 3
  const del = await supabase.from('player_weapons').delete().in('id', ids).eq('fid', fid)
  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 })

  // mint 1 upgraded
  const target = nextWeaponRarity(rarity)
  let w = generateWeapon()
  for (let i = 0; i < 50 && w.rarity !== target; i++) w = generateWeapon()
  if (w.rarity !== target) w = { ...w, rarity: target }

  const ins = await supabase
    .from('player_weapons')
    .insert({ fid, weapon: w, merged_from: ids })
    .select('id, fid, weapon, created_at')
    .single()

  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 })

  return NextResponse.json({ item: ins.data }, { headers: { 'cache-control': 'no-store, max-age=0' } })
}
