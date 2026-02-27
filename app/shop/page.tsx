"use client"

import { useEffect, useMemo, useState } from "react"
import frameSdk from "@farcaster/frame-sdk"
import type { Item } from "@/lib/items"
import { addItemToInventory, loadInventory } from "@/lib/inventory"
import { loadGold, saveGold } from "@/lib/gold"
import { SHOP_ITEMS_GOLD, instantiateShopItem } from "@/lib/shopItems"
import { generateItem, type ItemRarity, type ItemSlot } from "@/lib/items"

type Tab = "gold" | "premium"

const PREMIUM_TREASURY = "0xa782922Ff9c54F4264FD049189eC66940f528Eb0" as const

const PREMIUM_PRICE_WEI = {
  epic: 400000000000000n, // 0.0004
  legendary: 800000000000000n, // 0.0008
  dragonPiece: 1200000000000000n, // 0.0012
  dragonSet: 3600000000000000n, // 0.0036
} as const

type PremiumSku = keyof typeof PREMIUM_PRICE_WEI

type RequestArgs = { method: string; params?: any[] }

const BASE_CHAIN_ID_HEX = "0x2105" // 8453

function getProvider() {
  return frameSdk?.wallet?.ethProvider ?? (window as any).ethereum
}

async function providerRequest(args: RequestArgs) {
  const provider = getProvider()
  if (!provider) throw new Error("No wallet provider available")
  return provider.request(args)
}

async function ensureBaseChain() {
  // Only works for injected wallets; Warpcast embedded provider typically doesn't support switching.
  if (frameSdk?.wallet?.ethProvider) return

  try {
    await providerRequest({ method: "wallet_switchEthereumChain", params: [{ chainId: BASE_CHAIN_ID_HEX }] })
  } catch (e: any) {
    if (e?.code === 4902) {
      await providerRequest({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: BASE_CHAIN_ID_HEX,
            chainName: "Base",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://mainnet.base.org"],
            blockExplorerUrls: ["https://basescan.org"],
          },
        ],
      })
    } else {
      throw e
    }
  }
}

function rarityBorder(r: ItemRarity): string {
  if (r === "Common") return "border-gray-600"
  if (r === "Rare") return "border-blue-500 shadow-[0_0_12px_#60a5fa]"
  if (r === "Epic") return "border-purple-500 shadow-[0_0_15px_#c084fc]"
  if (r === "Legendary") return "border-yellow-400 shadow-[0_0_20px_#ffd700]"
  return "border-[#f97316] shadow-[0_0_22px_#f97316]"
}

function pickByRarity(target: ItemRarity): Item {
  let it = generateItem()
  for (let i = 0; i < 350 && it.rarity !== target; i++) it = generateItem()
  if (it.rarity !== target) it = { ...it, rarity: target }
  return it
}

function pickDragonSetPiece(): Item {
  let it = generateItem()
  for (let i = 0; i < 400 && !(it.rarity === "Set" && it.set === "Dragon"); i++) it = generateItem()
  if (it.rarity === "Set" && it.set === "Dragon") return it

  // fallback
  const slot: ItemSlot = (["weapon", "shield", "boots", "helmet"] as ItemSlot[])[Math.floor(Math.random() * 4)]
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: slot === "weapon" ? "Dragon Blade" : slot === "shield" ? "Dragon Shield" : slot === "boots" ? "Dragon Boots" : "Dragon Helm",
    slot,
    rarity: "Set",
    bonusPWR: slot === "weapon" ? 120 : slot === "shield" ? 20 : slot === "boots" ? 20 : 60,
    bonusDEF: slot === "weapon" ? 20 : slot === "shield" ? 120 : slot === "boots" ? 20 : 60,
    bonusLCK: slot === "weapon" ? 20 : slot === "shield" ? 20 : slot === "boots" ? 120 : 60,
    imageEmoji: "🐉",
    set: "Dragon",
  }
}

function pickRandomLegendary(): Item {
  return pickByRarity("Legendary")
}

function pickRandomEpic(): Item {
  return pickByRarity("Epic")
}

export default function ShopPage() {
  const [tab, setTab] = useState<Tab>("gold")
  const [gold, setGold] = useState(0)
  const [inventoryCount, setInventoryCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string>("")
  const [err, setErr] = useState<string>("")

  useEffect(() => {
    setGold(loadGold())
    ;(async () => {
      const inv = await loadInventory()
      setInventoryCount(inv.items.length)
    })()
  }, [])

  const goldItems = useMemo(() => SHOP_ITEMS_GOLD, [])

  const buyWithGold = async (templateId: string) => {
    setErr("")
    setMsg("")
    const t = goldItems.find((x) => x.templateId === templateId)
    if (!t) return

    const currentGold = loadGold()
    if (currentGold < t.priceGold) {
      setErr("Not enough gold")
      return
    }

    setBusy(true)
    try {
      const item = instantiateShopItem(t)
      await addItemToInventory(item)
      const nextGold = currentGold - t.priceGold
      saveGold(nextGold)
      setGold(nextGold)

      const inv = await loadInventory()
      setInventoryCount(inv.items.length)
      setMsg(`Bought ${item.name} (+${item.bonusPWR} PWR, +${item.bonusDEF} DEF, +${item.bonusLCK} LCK)`) 
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const buyPremium = async (sku: PremiumSku) => {
    setErr("")
    setMsg("")

    if (!getProvider()) {
      setErr("No wallet provider found.")
      return
    }

    setBusy(true)
    try {
      // connect for injected wallets
      try {
        await providerRequest({ method: "eth_requestAccounts" })
      } catch {
        // ignore
      }

      await ensureBaseChain()

      let from: string | undefined
      try {
        const accounts = (await providerRequest({ method: "eth_accounts" })) as string[]
        from = accounts?.[0]
      } catch {
        // ignore
      }

      const valueWeiHex = "0x" + PREMIUM_PRICE_WEI[sku].toString(16)

      const hash = (await providerRequest({
        method: "eth_sendTransaction",
        params: [
          {
            chainId: BASE_CHAIN_ID_HEX,
            from,
            to: PREMIUM_TREASURY,
            value: valueWeiHex,
          },
        ],
      })) as string

      const rewards: Item[] = []

      if (sku === "epic") {
        rewards.push(pickRandomEpic())
      } else if (sku === "legendary") {
        rewards.push(pickRandomLegendary())
      } else if (sku === "dragonPiece") {
        rewards.push(pickDragonSetPiece())
      } else {
        const pieces: ItemSlot[] = ["weapon", "shield", "boots", "helmet"]
        for (const slot of pieces) {
          const it = pickDragonSetPiece()
          rewards.push(it.slot === slot ? it : { ...it, slot, name: slot === "weapon" ? "Dragon Blade" : slot === "shield" ? "Dragon Shield" : slot === "boots" ? "Dragon Boots" : "Dragon Helm" })
        }
      }

      for (const r of rewards) await addItemToInventory(r)

      const inv = await loadInventory()
      setInventoryCount(inv.items.length)

      setMsg(`Purchase complete: +${rewards.length} item(s) • Tx ${hash.slice(0, 10)}…`)
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-4 pb-24">
      <h1 className="text-2xl font-extrabold text-center mt-6">Shop</h1>
      <p className="text-center text-gray-400 mt-2 text-sm">Buy gear with Gold or Premium packs</p>

      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="text-xs text-yellow-300 font-bold">💰 Gold: {gold}</div>
        <div className="text-xs text-gray-500">•</div>
        <div className="text-xs text-gray-400">Inventory: {inventoryCount}</div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          onClick={() => setTab("gold")}
          className={`py-2 rounded-xl text-xs font-bold border ${tab === "gold" ? "bg-indigo-700 border-indigo-500" : "bg-gray-900 border-gray-800"}`}
        >
          Gold
        </button>
        <button
          onClick={() => setTab("premium")}
          className={`py-2 rounded-xl text-xs font-bold border ${tab === "premium" ? "bg-indigo-700 border-indigo-500" : "bg-gray-900 border-gray-800"}`}
        >
          Premium
        </button>
      </div>

      {msg && <div className="mt-4 text-xs text-green-400 text-center">{msg}</div>}
      {err && <div className="mt-4 text-xs text-red-400 text-center break-words">{err}</div>}

      {tab === "gold" && (
        <div className="mt-6">
          <div className="text-sm font-bold">Gold Items</div>
          <div className="text-xs text-gray-500 mt-1">Fixed list (Common/Rare). Items go to your inventory.</div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {goldItems.map((t) => (
              <div key={t.templateId} className={`border-2 rounded-2xl p-3 bg-gray-900 ${rarityBorder(t.rarity)}`}>
                <div className="text-3xl">{t.imageEmoji}</div>
                <div className="font-bold text-sm mt-1 leading-tight">{t.name}</div>
                <div className="text-xs text-gray-400">{t.rarity} • {t.slot.toUpperCase()}</div>
                <div className="text-xs mt-2">+{t.bonusPWR} PWR • +{t.bonusDEF} DEF • +{t.bonusLCK} LCK</div>

                <button
                  disabled={busy || gold < t.priceGold}
                  onClick={() => buyWithGold(t.templateId).catch(() => {})}
                  className="mt-3 w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white text-xs font-bold py-2 rounded-xl"
                >
                  Buy • {t.priceGold} Gold
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "premium" && (
        <div className="mt-6">
          <div className="rounded-2xl p-5 border border-purple-500/30 bg-gradient-to-r from-purple-900/30 to-yellow-900/20">
            <div className="text-lg font-extrabold">⚡ PREMIUM ITEMS</div>
            <div className="text-sm text-gray-300 mt-1">Exclusive items only available here</div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="border border-gray-800 bg-gray-900 rounded-2xl p-4">
              <div className="font-extrabold">Epic Bundle</div>
              <div className="text-xs text-gray-400 mt-1">Random Epic item</div>
              <button
                disabled={busy}
                onClick={() => buyPremium("epic").catch(() => {})}
                className="mt-3 w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl"
              >
                Buy 0.0004 ETH
              </button>
            </div>

            <div className="border border-gray-800 bg-gray-900 rounded-2xl p-4">
              <div className="font-extrabold">Legendary Weapon</div>
              <div className="text-xs text-gray-400 mt-1">Random Legendary item</div>
              <button
                disabled={busy}
                onClick={() => buyPremium("legendary").catch(() => {})}
                className="mt-3 w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl"
              >
                Buy 0.0008 ETH
              </button>
            </div>

            <div className="border-2 border-[#f97316] bg-gray-900 rounded-2xl p-4 shadow-[0_0_22px_#f97316]">
              <div className="font-extrabold flex items-center justify-between">
                <span>Dragon Set Piece</span>
                <span className="text-[10px] font-extrabold text-[#f97316] border border-[#f97316]/60 bg-[#f97316]/10 px-2 py-0.5 rounded-full">🐉 SET ITEM</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">Random Dragon Set piece (25% each slot)</div>
              <button
                disabled={busy}
                onClick={() => buyPremium("dragonPiece").catch(() => {})}
                className="mt-3 w-full bg-[#f97316] hover:bg-[#fb923c] disabled:opacity-50 text-black font-extrabold py-3 rounded-xl"
              >
                Buy 0.0012 ETH
              </button>
            </div>

            <div className="border-2 border-[#f97316] bg-gray-900 rounded-2xl p-4 shadow-[0_0_26px_#f97316]">
              <div className="font-extrabold flex items-center justify-between">
                <span>Full Dragon Set</span>
                <span className="text-[10px] font-extrabold text-yellow-200 border border-yellow-300/40 bg-yellow-500/10 px-2 py-0.5 rounded-full">🔥 BEST VALUE</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">All 4 Dragon pieces at once</div>
              <button
                disabled={busy}
                onClick={() => buyPremium("dragonSet").catch(() => {})}
                className="mt-3 w-full bg-[#f97316] hover:bg-[#fb923c] disabled:opacity-50 text-black font-extrabold py-3 rounded-xl"
              >
                Buy 0.0036 ETH
              </button>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-gray-500 break-words">Treasury: {PREMIUM_TREASURY}</div>
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <a href="/collection" className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-xl text-sm font-bold">
          Equip items on Heroes
        </a>
      </div>
    </div>
  )
}
