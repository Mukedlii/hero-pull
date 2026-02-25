import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 25)))

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('player_scores')
    .select('fid, score, updated_at')
    .order('score', { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(
    { items: data ?? [] },
    { headers: { 'cache-control': 'no-store, max-age=0' } }
  )
}
