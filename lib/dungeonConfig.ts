import type { ItemRarity } from "@/lib/items"

export type DungeonRoomType = "battle" | "treasure" | "shop" | "trap" | "blessing" | "boss" | "rest"

export type Range = [number, number]

export type LevelConfig = {
  level: number
  name: string
  difficulty: string
  enemy: { hp: Range; atk: Range; def: Range; spd: Range }
  boss: { name: string; hp: Range; atk: Range; def: Range; spd: Range }
  battleGold: Range
  treasureGold: Range
  itemDropRate: number
  unlockRewardRarity: Exclude<ItemRarity, "Set">
}

export const DUNGEON_LEVELS: Array<{ level: number; name: string; difficulty: string; unlockRewardRarity: Exclude<ItemRarity, "Set"> }> = [
  { level: 1, name: "The Crypt 🪦", difficulty: "Tutorial/Easy", unlockRewardRarity: "Rare" },
  { level: 2, name: "Dark Forest 🌲", difficulty: "Easy", unlockRewardRarity: "Rare" },
  { level: 3, name: "Goblin Caves 👺", difficulty: "Easy-Medium", unlockRewardRarity: "Epic" },
  { level: 4, name: "Orc Fortress 👹", difficulty: "Medium", unlockRewardRarity: "Epic" },
  { level: 5, name: "Haunted Tower 🗼", difficulty: "Medium", unlockRewardRarity: "Legendary" },
  { level: 6, name: "Shadow Realm 🌑", difficulty: "Medium-Hard", unlockRewardRarity: "Legendary" },
  { level: 7, name: "Dragon's Lair 🐉", difficulty: "Hard", unlockRewardRarity: "Legendary" },
  { level: 8, name: "Void Dungeon ⚫", difficulty: "Hard", unlockRewardRarity: "Legendary" },
  { level: 9, name: "Hell Gate 🔥", difficulty: "Very Hard", unlockRewardRarity: "Legendary" },
  { level: 10, name: "Final Abyss ⚡", difficulty: "Endgame", unlockRewardRarity: "Legendary" },
]

export function randInt(a: number, b: number) {
  return Math.floor(Math.random() * (b - a + 1)) + a
}

export function getLevelConfig(level: number): LevelConfig {
  // NOTE: full 100-floor (10x10) tuning is planned; this is a safe baseline config.
  const lvl = Math.max(1, Math.min(10, Math.floor(level)))

  if (lvl === 1) {
    return {
      level: 1,
      name: DUNGEON_LEVELS[0].name,
      difficulty: DUNGEON_LEVELS[0].difficulty,
      enemy: { hp: [20, 40], atk: [8, 12], def: [2, 5], spd: [10, 30] },
      boss: { name: "Crypt Warden", hp: [120, 120], atk: [18, 18], def: [8, 8], spd: [20, 20] },
      battleGold: [8, 14],
      treasureGold: [15, 30],
      itemDropRate: 0.35,
      unlockRewardRarity: "Rare",
    }
  }

  // Generic scaling for levels 2-10 (kept simple for now)
  const baseHp: Range = [40 + (lvl - 2) * 60, 70 + (lvl - 2) * 80]
  const baseAtk: Range = [13 + (lvl - 2) * 18, 20 + (lvl - 2) * 20]
  const baseDef: Range = [5 + (lvl - 2) * 9, 10 + (lvl - 2) * 12]
  const baseSpd: Range = [15 + (lvl - 2) * 2, 40 + (lvl - 2) * 3]

  const bossHp = 200 + (lvl - 2) * 220
  const bossAtk = 28 + (lvl - 2) * 22
  const bossDef = 14 + (lvl - 2) * 14

  return {
    level: lvl,
    name: DUNGEON_LEVELS[lvl - 1].name,
    difficulty: DUNGEON_LEVELS[lvl - 1].difficulty,
    enemy: { hp: baseHp, atk: baseAtk, def: baseDef, spd: baseSpd },
    boss: { name: lvl === 10 ? "FINAL ABYSS" : `Boss L${lvl}`, hp: [bossHp, bossHp], atk: [bossAtk, bossAtk], def: [bossDef, bossDef], spd: [35, 35] },
    battleGold: [12 + lvl * 2, 20 + lvl * 3],
    treasureGold: [20 + lvl * 4, 40 + lvl * 6],
    itemDropRate: 0.45,
    unlockRewardRarity: lvl <= 2 ? "Rare" : lvl <= 4 ? "Epic" : "Legendary",
  }
}

export function roomTypeForFloor(floor: number): DungeonRoomType {
  if (floor >= 10) return "boss"

  // Simple distribution; refined later
  const r = Math.random() * 100
  if (r < 50) return "battle"
  if (r < 70) return "treasure"
  if (r < 85) return "shop"
  if (r < 95) return "trap"
  return "blessing"
}
