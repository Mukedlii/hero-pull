"use client"

import { useEffect, useMemo, useState } from "react"
import { Weapon, WeaponRarity, generateWeapon, nextWeaponRarity } from "@/lib/weapons"
import { getWalletAddress, loadWeapons, saveWeapon } from "@/lib/db"
import { encodeFunctionData } from "viem"
import {
  BASE_CHAIN_ID_HEX,
  WEAPON_ABI,
  WEAPON_CONTRACT_ADDRESS,
  WEAPON_MINT_PRICE_WEI_HEX,
} from "@/lib/weaponContract"

// (owner withdraw UI removed)

const WEAPONS_KEY = "hero-pull-weapons"

const rarityBorder: Record<WeaponRarity, string> = {
  Common: "border-gray-600",
  Rare: "border-blue-500 shadow-[0_0_12px_#60a5fa]",
  Epic: "border-purple-500 shadow-[0_0_15px_#c084fc]",
  Legendary: "border-yellow-400 shadow-[0_0_20px_#ffd700]",
}

export default function WeaponsPage() {
  const [weapons, setWeapons] = useState<Weapon[]>([])
  const [lastForged, setLastForged] = useState<Weapon | null>(null)
  const [fid, setFid] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [minting, setMinting] = useState(false)
  const [wallet, setWallet] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      // Prefer onchain inventory when wallet connected
      try {
        const wallet = await getWalletAddress()
        if (wallet) {
          setWallet(wallet)
          const res = await fetch(`/api/weapons/onchain?address=${wallet}`, { cache: "no-store" })
          const json = await res.json()
          const items = Array.isArray(json?.items) ? json.items : []
          const list: Weapon[] = []
          for (const it of items) {
            const qty = Number(it?.balance || 0)
            const w = it?.weapon as Weapon
            if (w && qty > 0) {
              for (let i = 0; i < qty; i++) list.push({ ...w, id: `${w.id}-${i}` })
            }
          }
          setWeapons(list)
          return
        }
      } catch {
        // ignore
      }

      // Prefer Supabase inventory if wallet connected
      try {
        const wallet = await getWalletAddress()
        if (wallet) {
          const list = await loadWeapons(wallet)
          setWeapons(list)
          return
        }
      } catch {
        // ignore
      }

      // Fallback 1: server inventory (fid)
      try {
        const mod: any = await import("@farcaster/frame-sdk")
        const ctx: any = await mod?.sdk?.context
        const f = ctx?.user?.fid
        if (f) setFid(f)

        if (f) {
          const res = await fetch(`/api/weapons/list?fid=${f}`, { cache: "no-store" })
          const json = await res.json()
          const items = Array.isArray(json?.items) ? json.items : []
          setWeapons(items.map((it: any) => it.weapon as Weapon))
          return
        }
      } catch {
        // ignore
      }

      // Fallback 2: localStorage
      try {
        const raw = localStorage.getItem(WEAPONS_KEY)
        setWeapons(raw ? (JSON.parse(raw) as Weapon[]) : [])
      } catch {
        setWeapons([])
      }
    })()
  }, [])

  const saveLocal = (list: Weapon[]) => {
    setWeapons(list)
    localStorage.setItem(WEAPONS_KEY, JSON.stringify(list))
  }

  const refreshServer = async (f: number) => {
    const res = await fetch(`/api/weapons/list?fid=${f}`, { cache: "no-store" })
    const json = await res.json()
    const items = Array.isArray(json?.items) ? json.items : []
    setWeapons(items.map((it: any) => it.weapon as Weapon))
  }

  const handleForge = async () => {
    setLoading(true)
    try {
      // Prefer Supabase (wallet)
      try {
        const wallet = await getWalletAddress()
        if (wallet) {
          const w = generateWeapon()
          const row: any = await saveWeapon(w, wallet)
          const list = await loadWeapons(wallet)
          setWeapons(list)
          setLastForged({
            ...w,
            id: row?.id ?? w.id,
          })
          return
        }
      } catch {
        // ignore
      }

      // Fallback: server (fid)
      if (fid) {
        const res = await fetch('/api/weapons/forge', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ fid }),
        })
        const json = await res.json()
        const w = json?.item?.weapon as Weapon
        if (w) setLastForged(w)
        await refreshServer(fid)
        return
      }

      // Fallback: localStorage
      const w = generateWeapon()
      const next = [w, ...weapons]
      saveLocal(next)
      setLastForged(w)
    } finally {
      setLoading(false)
    }
  }

  const counts = useMemo(() => {
    const c: Record<WeaponRarity, number> = { Common: 0, Rare: 0, Epic: 0, Legendary: 0 }
    for (const w of weapons) c[w.rarity]++
    return c
  }, [weapons])

  const canMergeRarity = (r: WeaponRarity) => {
    if (!weapons.length) return false
    return r === "Legendary" ? false : counts[r] >= 3
  }

  const mergeRarity = async (r: WeaponRarity) => {
    if (!canMergeRarity(r)) return
    setLoading(true)
    try {
      // Supabase merge (wallet): best-effort local merge, then re-save list
      try {
        const wallet = await getWalletAddress()
        if (wallet) {
          const list = await loadWeapons(wallet)
          const target = nextWeaponRarity(r)
          const nextList: Weapon[] = []
          let removed = 0
          for (const w of list) {
            if (w.rarity === r && removed < 3) {
              removed++
              continue
            }
            nextList.push(w)
          }
          let nw = generateWeapon()
          for (let i = 0; i < 50 && nw.rarity !== target; i++) nw = generateWeapon()
          if (nw.rarity !== target) nw = { ...nw, rarity: target }
          const row: any = await saveWeapon(nw, wallet)
          const refreshed = await loadWeapons(wallet)
          setWeapons(refreshed)
          setLastForged({
            ...nw,
            id: row?.id ?? nw.id,
          })
          return
        }
      } catch {
        // ignore
      }

      // Fallback: server (fid)
      if (fid) {
        const res = await fetch('/api/weapons/merge', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ fid, rarity: r }),
        })
        const json = await res.json()
        const w = json?.item?.weapon as Weapon
        if (w) setLastForged(w)
        await refreshServer(fid)
        return
      }

      // fallback local merge
      const target = nextWeaponRarity(r)
      const nextList: Weapon[] = []
      let removed = 0
      for (const w of weapons) {
        if (w.rarity === r && removed < 3) {
          removed++
          continue
        }
        nextList.push(w)
      }
      let nw = generateWeapon()
      for (let i = 0; i < 50 && nw.rarity !== target; i++) nw = generateWeapon()
      if (nw.rarity !== target) nw = { ...nw, rarity: target }
      const next = [nw, ...nextList]
      saveLocal(next)
      setLastForged(nw)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">⚔️ Weapons</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">Forge & merge weapons</p>

      {!WEAPON_CONTRACT_ADDRESS && (
        <p className="text-center text-xs text-red-400 mt-2">
          Missing NEXT_PUBLIC_WEAPON_CONTRACT_ADDRESS
        </p>
      )

      <div className="mt-6 flex flex-col items-center gap-3">
        {WEAPON_CONTRACT_ADDRESS && (
          <button
            onClick={async () => {
              if (!WEAPON_CONTRACT_ADDRESS) return
              setMinting(true)
              try {
                const mod: any = await import("@farcaster/frame-sdk")
                const provider =
                  mod?.default?.wallet?.ethProvider ?? mod?.sdk?.wallet?.ethProvider ?? (window as any).ethereum
                if (!provider) throw new Error("No wallet provider")

                const tokenId = BigInt(Math.floor(Math.random() * 5) + 1)
                const data = encodeFunctionData({
                  abi: WEAPON_ABI,
                  functionName: "mint",
                  args: [tokenId, 1n],
                })

                try {
                  await provider.request({ method: "eth_requestAccounts" })
                } catch {}

                const accounts = await provider.request({ method: "eth_accounts" })
                const from = accounts?.[0]
                if (!from) throw new Error("Wallet not connected")

                const txHash = (await provider.request({
                  method: "eth_sendTransaction",
                  params: [
                    {
                      chainId: BASE_CHAIN_ID_HEX,
                      from,
                      to: WEAPON_CONTRACT_ADDRESS,
                      data,
                      value: WEAPON_MINT_PRICE_WEI_HEX,
                    },
                  ],
                })) as string

                // refresh onchain inventory (poll a bit; tx may not be mined yet)
                try {
                  for (let attempt = 0; attempt < 8; attempt++) {
                    const res = await fetch(`/api/weapons/onchain?address=${from}`, { cache: "no-store" })
                    const json = await res.json()
                    const items = Array.isArray(json?.items) ? json.items : []
                    const list: Weapon[] = []
                    let total = 0
                    for (const it of items) {
                      const qty = Number(it?.balance || 0)
                      total += qty
                      const w = it?.weapon as Weapon
                      if (w && qty > 0) {
                        for (let i = 0; i < qty; i++) list.push({ ...w, id: `${w.id}-${i}` })
                      }
                    }
                    if (total > weapons.length) {
                      setWeapons(list)
                      if (items?.[0]?.weapon) setLastForged(items[0].weapon as Weapon)
                      break
                    }
                    await new Promise((r) => setTimeout(r, 1200))
                  }
                } catch {}

                try {
                  alert(`Mint sent! Tx: ${txHash}`)
                } catch {}
              } finally {
                setMinting(false)
              }
            }}
            disabled={minting}
            className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-extrabold py-3 px-6 rounded-2xl"
          >
            {minting ? "Minting…" : "⛓ Mint Weapon NFT (~$0.15)"}
          </button>
        )}

        {/* forge button removed */}
      </div>

      {lastForged && (
        <div className={`mt-6 border-2 rounded-2xl p-4 bg-gray-900 ${rarityBorder[lastForged.rarity]}`}>
          <div className="text-5xl text-center">{lastForged.imageEmoji}</div>
          <p className="text-center font-extrabold mt-2">{lastForged.name}</p>
          <p className="text-center text-xs text-gray-400 mt-1">
            {lastForged.rarity} {lastForged.type}
          </p>
          <p className="text-center text-xs mt-2">
            +{lastForged.bonusATK} ATK • +{lastForged.bonusDEF} DEF • +{lastForged.bonusSPD} SPD
          </p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3">
        {(["Common", "Rare", "Epic", "Legendary"] as WeaponRarity[]).map((r) => (
          <div key={r} className="border border-gray-800 rounded-2xl p-3 bg-gray-900">
            <p className="font-bold text-sm">{r}</p>
            <p className="text-xs text-gray-400 mt-1">Count: {counts[r]}</p>
            {r !== "Legendary" && (
              <button
                onClick={() => mergeRarity(r)}
                disabled={wallet ? true : !canMergeRarity(r)}
                className="mt-2 w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white text-xs py-2 rounded-xl"
              >
                {wallet ? "Onchain merge soon" : `Merge 3 → ${nextWeaponRarity(r)}`}
              </button>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mt-10">Inventory</h2>
      {weapons.length === 0 ? (
        <p className="text-center text-gray-500 text-sm mt-3">No weapons yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {weapons.map((w) => (
            <div key={w.id} className={`border-2 rounded-xl p-3 bg-gray-900 ${rarityBorder[w.rarity]}`}>
              <div className="text-3xl">{w.imageEmoji}</div>
              <p className="font-bold text-sm mt-1 leading-tight">{w.name}</p>
              <p className="text-xs text-gray-400">
                {w.rarity} {w.type}
              </p>
              <p className="text-xs mt-1">+{w.bonusATK} ATK</p>
              <p className="text-xs">+{w.bonusDEF} DEF</p>
              <p className="text-xs">+{w.bonusSPD} SPD</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
