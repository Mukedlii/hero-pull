"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getWalletAddress } from "@/lib/db"
import type { Hero } from "@/lib/heroes"
import { WalletHeroes } from "@/components/WalletHeroes"
import { applyMove, startState, type PvPHero, type PvPMove, type PvPState } from "@/lib/pvp"

const TURN_MS = 7000

type MatchRow = {
  id: string
  status: "lobby" | "active" | "finished"
  p1_wallet: string
  p2_wallet: string | null
  p1_hero: PvPHero | null
  p2_hero: PvPHero | null
  state: PvPState | null
  updated_at: string
}

function heroToPvP(h: Hero & { tokenId?: string }): PvPHero {
  return {
    tokenId: String(h.tokenId ?? h.dbId ?? ""),
    name: h.name,
    rarity: h.rarity,
    level: Number(h.level || 1),
    attack: Number(h.attack || 0),
    defense: Number(h.defense || 0),
    speed: Number(h.speed || 0),
    imageUrl: h.imageUrl,
  }
}

export default function PvPPage() {
  const sp = useSearchParams()
  const matchId = sp.get("m")

  const [wallet, setWallet] = useState<string | null>(null)
  const [match, setMatch] = useState<MatchRow | null>(null)
  const [err, setErr] = useState<string>("")
  const [busy, setBusy] = useState(false)

  const channelRef = useRef<any>(null)

  useEffect(() => {
    ;(async () => {
      setErr("")
      const w = await getWalletAddress()
      if (!w) {
        setErr("Connect wallet")
        return
      }
      setWallet(w)
    })()
  }, [])

  const role = useMemo(() => {
    if (!wallet || !match) return null
    if (match.p1_wallet?.toLowerCase() === wallet.toLowerCase()) return "p1"
    if (match.p2_wallet?.toLowerCase() === wallet.toLowerCase()) return "p2"
    return null
  }, [wallet, match])

  const isMyTurn = useMemo(() => {
    if (!match?.state || !role) return false
    return match.status === "active" && match.state.turn === role && !match.state.finished
  }, [match, role])

  const secondsLeft = useMemo(() => {
    if (!match?.state) return null
    return Math.max(0, Math.ceil((match.state.turnEndsAt - Date.now()) / 1000))
  }, [match?.state?.turnEndsAt])

  const loadMatch = async (id: string) => {
    const { data, error } = await supabase().from("pvp_matches").select("*").eq("id", id).single()
    if (error) throw error
    setMatch(data as any)
  }

  useEffect(() => {
    if (!matchId) return
    if (channelRef.current) {
      try {
        supabase().removeChannel(channelRef.current)
      } catch {}
      channelRef.current = null
    }

    ;(async () => {
      try {
        await loadMatch(matchId)

        const ch = supabase()
          .channel(`pvp:${matchId}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "pvp_matches", filter: `id=eq.${matchId}` },
            (payload) => {
              const row = (payload as any)?.new
              if (row) setMatch(row)
            }
          )
          .subscribe()
        channelRef.current = ch
      } catch (e: any) {
        setErr(e?.message || String(e))
      }
    })()

    return () => {
      if (channelRef.current) {
        try {
          supabase().removeChannel(channelRef.current)
        } catch {}
        channelRef.current = null
      }
    }
  }, [matchId])

  useEffect(() => {
    // turn timer tick + auto attack when timer expires on your turn (best-effort)
    if (!match?.state || !isMyTurn) return

    const t = setInterval(() => {
      if (!match?.state || !isMyTurn) return
      if (Date.now() >= match.state.turnEndsAt) {
        doMove("attack").catch(() => {})
      }
    }, 300)

    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.state?.turnEndsAt, isMyTurn])

  const createMatch = async () => {
    if (!wallet) return
    setBusy(true)
    setErr("")
    try {
      const id = crypto.randomUUID()
      const { error } = await supabase().from("pvp_matches").insert({
        id,
        status: "lobby",
        p1_wallet: wallet,
        p2_wallet: null,
        p1_hero: null,
        p2_hero: null,
        state: null,
      })
      if (error) throw error
      window.location.href = `/pvp?m=${id}`
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const joinMatch = async () => {
    if (!wallet || !matchId) return
    setBusy(true)
    setErr("")
    try {
      const { data, error } = await supabase().from("pvp_matches").select("*").eq("id", matchId).single()
      if (error) throw error
      const m = data as any as MatchRow
      if (m.p2_wallet && m.p2_wallet.toLowerCase() !== wallet.toLowerCase()) throw new Error("Match full")
      if (m.p1_wallet.toLowerCase() === wallet.toLowerCase()) return

      const { error: e2 } = await supabase()
        .from("pvp_matches")
        .update({ p2_wallet: wallet })
        .eq("id", matchId)
      if (e2) throw e2
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const pickHero = async (hero: Hero & { tokenId?: string }) => {
    if (!wallet || !matchId || !match) return
    if (!role) return
    setBusy(true)
    setErr("")
    try {
      const pv = heroToPvP(hero)
      const patch = role === "p1" ? { p1_hero: pv } : { p2_hero: pv }
      const { error } = await supabase().from("pvp_matches").update(patch).eq("id", matchId)
      if (error) throw error
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const start = async () => {
    if (!matchId || !match) return
    if (!match.p1_hero || !match.p2_hero) {
      setErr("Both players must choose hero")
      return
    }
    setBusy(true)
    setErr("")
    try {
      const st = startState(match.p1_hero, match.p2_hero, Date.now(), TURN_MS)
      const { error } = await supabase()
        .from("pvp_matches")
        .update({ status: "active", state: st })
        .eq("id", matchId)
      if (error) throw error
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const doMove = async (move: PvPMove) => {
    if (!matchId || !match?.state || !match.p1_hero || !match.p2_hero || !role) return
    if (!isMyTurn) return

    setBusy(true)
    setErr("")
    try {
      const next = applyMove(match.state, role as any, move, { p1: match.p1_hero, p2: match.p2_hero }, Date.now(), TURN_MS)
      const status = next.finished ? "finished" : "active"
      const { error } = await supabase().from("pvp_matches").update({ state: next, status }).eq("id", matchId)
      if (error) throw error
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  if (!matchId) {
    return (
      <div className="px-4 pb-24">
        <h1 className="text-2xl font-extrabold text-center mt-6">PvP</h1>
        <p className="text-center text-gray-400 mt-2 text-sm">Live turn-based (7s per turn)</p>

        {err && <div className="mt-3 text-center text-xs text-red-400">{err}</div>}

        <div className="mt-6 flex flex-col gap-3">
          <button
            disabled={!wallet || busy}
            onClick={() => createMatch().catch(() => {})}
            className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl"
          >
            Create match
          </button>
          <div className="text-center text-xs text-gray-500">Open the link you get and share it.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">PvP</h1>
      <p className="text-center text-gray-400 mt-2 text-xs break-all">Match: {matchId}</p>

      {wallet && <div className="mt-2 text-center text-xs text-gray-500">Wallet: {wallet.slice(0, 6)}…{wallet.slice(-4)}</div>}
      {err && <div className="mt-3 text-center text-xs text-red-400">{err}</div>}

      {!match ? (
        <div className="mt-8 text-center text-gray-400 text-sm">Loading…</div>
      ) : (
        <>
          {!role && (
            <div className="mt-6">
              <button
                disabled={busy || !!match.p2_wallet}
                onClick={() => joinMatch().catch(() => {})}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-extrabold py-3 rounded-xl"
              >
                Join match
              </button>
              <div className="mt-2 text-center text-xs text-gray-500">If full, open another link.</div>
            </div>
          )}

          {role && (
            <div className="mt-6 border border-gray-800 bg-gray-900 rounded-2xl p-4">
              <div className="text-sm font-bold">You are {role.toUpperCase()}</div>
              <div className="mt-2 text-xs text-gray-400">Turn limit: 7s (timeout = auto attack)</div>
              <div className="mt-2 text-xs text-gray-500">Share link: /pvp?m={matchId}</div>
            </div>
          )}

          {role && match.status === "lobby" && (
            <>
              <div className="mt-6 text-sm font-bold">Choose your hero</div>
              <WalletHeroes onSelect={pickHero} />

              <div className="mt-4 text-xs text-gray-400">
                P1 hero: {match.p1_hero ? `#${match.p1_hero.tokenId} ${match.p1_hero.name}` : "(none)"}
                <br />
                P2 hero: {match.p2_hero ? `#${match.p2_hero.tokenId} ${match.p2_hero.name}` : "(none)"}
              </div>

              <button
                disabled={busy || !match.p1_hero || !match.p2_hero}
                onClick={() => start().catch(() => {})}
                className="mt-4 w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl"
              >
                Start
              </button>
            </>
          )}

          {match.status !== "lobby" && match.state && match.p1_hero && match.p2_hero && (
            <div className="mt-6 border border-gray-800 bg-gray-900 rounded-2xl p-4">
              <div className="flex justify-between text-xs text-gray-400">
                <div>
                  <div className="font-bold text-white">P1</div>
                  <div className="text-[10px]">{match.p1_hero.name}</div>
                </div>
                <div>
                  <div className="font-bold text-white text-right">P2</div>
                  <div className="text-[10px] text-right">{match.p2_hero.name}</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="border border-gray-800 rounded-xl p-3">
                  <div className="text-xs text-gray-500">HP</div>
                  <div className="text-sm font-extrabold">{match.state.p1.hp}/{match.state.p1.maxHp}</div>
                  <div className="text-[10px] text-gray-500">Potions: {match.state.p1.potions}</div>
                </div>
                <div className="border border-gray-800 rounded-xl p-3 text-right">
                  <div className="text-xs text-gray-500">HP</div>
                  <div className="text-sm font-extrabold">{match.state.p2.hp}/{match.state.p2.maxHp}</div>
                  <div className="text-[10px] text-gray-500">Potions: {match.state.p2.potions}</div>
                </div>
              </div>

              <div className="mt-4 text-center text-xs">
                {match.state.finished ? (
                  <span className="text-yellow-300 font-bold">Winner: {match.state.winner?.toUpperCase()}</span>
                ) : (
                  <span>
                    Turn: <b>{match.state.turn.toUpperCase()}</b> • {secondsLeft}s
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  disabled={!isMyTurn || busy || match.state.finished}
                  onClick={() => doMove("attack").catch(() => {})}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs py-2 rounded-xl"
                >
                  Attack
                </button>
                <button
                  disabled={!isMyTurn || busy || match.state.finished}
                  onClick={() => doMove("defend").catch(() => {})}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs py-2 rounded-xl"
                >
                  Defend
                </button>
                <button
                  disabled={!isMyTurn || busy || match.state.finished}
                  onClick={() => doMove("potion").catch(() => {})}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs py-2 rounded-xl"
                >
                  Potion
                </button>
              </div>

              <div className="mt-4 max-h-44 overflow-auto border border-gray-800 rounded-xl p-2 bg-black/20">
                {match.state.log.slice(-20).map((l, i) => (
                  <div key={i} className="text-[10px] text-gray-300">{l}</div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
