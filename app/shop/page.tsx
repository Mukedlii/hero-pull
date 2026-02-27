"use client"

import { useEffect, useMemo, useState } from "react"
import frameSdk from "@farcaster/frame-sdk"
import type { Item } from "@/lib/items"
import { addItemToInventory, loadInventory } from "@/lib/inventory"
import { loadGold, saveGold } from "@/lib/gold"
import { SHOP_ITEMS_GOLD, instantiateShopItem } from "@/lib/shopItems"
import { generateItem, type ItemRarity, type ItemSlot } from "@/lib/items"

type Tab = "gold" | "premium"

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

function pickPremiumReward(): Item {
  // Premium pack rewards: random Epic/Legendary OR Dragon set piece
  const roll = Math.random() * 100
  if (roll < 35) {
    // Dragon set piece
    let it = generateItem()
    for (let i = 0; i < 200 && !(it.rarity === "Set" && it.set === "Dragon"); i++) it = generateItem()
    if (!(it.rarity === "Set" && it.set === "Dragon")) {
      // fallback if RNG failed
      const slot: ItemSlot = (["weapon", "shield", "boots", "helmet"] as ItemSlot[])[Math.floor(Math.random() * 4)]
      it = {
        id: it.id,
        name: slot === "weapon" ? "Dragonfang Blade" : slot === "shield" ? "Dragonhide Aegis" : slot === "boots" ? "Dragonstep Greaves" : "Dragoncrest Helm",
        slot,
        rarity: "Set",
        bonusATK: slot === "weapon" ? 65 : slot === "shield" ? 10 : slot === "boots" ? 10 : 25,
        bonusDEF: slot === "weapon" ? 10 : slot === "shield" ? 65 : slot === "boots" ? 10 : 25,
        bonusSPD: slot === "weapon" ? 10 : slot === "shield" ? 10 : slot === "boots" ? 65 : 25,
        imageEmoji: "🐉",
        set: "Dragon",
      }
    }
    return it
  }

  const target: ItemRarity = roll < 78 ? "Epic" : "Legendary"
  let it = generateItem()
  for (let i = 0; i < 200 && it.rarity !== target; i++) it = generateItem()
  if (it.rarity !== target) it = { ...it, rarity: target }
  return it
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
      setMsg(`Bought ${item.name} (+${item.bonusATK} ATK, +${item.bonusDEF} DEF, +${item.bonusSPD} SPD)`) 
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const buyPremium = async () => {
    setErr("")
    setMsg("")

    const to = process.env.NEXT_PUBLIC_PREMIUM_TREASURY_ADDRESS
    const valueWeiHex = process.env.NEXT_PUBLIC_PREMIUM_PRICE_WEI_HEX

    if (!to || !valueWeiHex) {
      setErr("Premium shop is not configured (missing NEXT_PUBLIC_PREMIUM_TREASURY_ADDRESS / NEXT_PUBLIC_PREMIUM_PRICE_WEI_HEX).")
      return
    }

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

      const hash = (await providerRequest({
        method: "eth_sendTransaction",
        params: [
          {
            chainId: BASE_CHAIN_ID_HEX,
            from,
            to,
            value: valueWeiHex,
          },
        ],
      })) as string

      const reward = pickPremiumReward()
      await addItemToInventory(reward)

      const inv = await loadInventory()
      setInventoryCount(inv.items.length)

      setMsg(`Premium purchase complete. Reward: ${reward.name} (${reward.rarity}) • Tx ${hash.slice(0, 10)}…`)
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
                <div className="text-xs mt-2">+{t.bonusATK} ATK • +{t.bonusDEF} DEF • +{t.bonusSPD} SPD</div>

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
        <div className="mt-6 border border-gray-800 bg-gray-900 rounded-2xl p-5">
          <div className="text-lg font-extrabold">Premium Pack</div>
          <div className="text-sm text-gray-400 mt-1">Pay ETH on Base and receive a reward item.</div>
          <div className="text-xs text-gray-500 mt-3">Rewards: Epic / Legendary gear, or Dragon set pieces.</div>

          <button
            disabled={busy}
            onClick={() => buyPremium().catch(() => {})}
            className="mt-4 w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl"
          >
            {busy ? "Processing…" : "Buy Premium"}
          </button>

          <div className="text-[11px] text-gray-500 mt-3 break-words">
            Treasury: {process.env.NEXT_PUBLIC_PREMIUM_TREASURY_ADDRESS || "(not set)"}
          </div>
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
