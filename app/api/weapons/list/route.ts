import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fid = Number(searchParams.get('fid'))
  if (!Number.isFinite(fid) || fid <= 0) return NextResponse.json({ error: 'invalid fid' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('player_items')
    .select('id, fid, item, created_at')
    .eq('fid', fid)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] }, { headers: { 'cache-control': 'no-store, max-age=0' } })
}
