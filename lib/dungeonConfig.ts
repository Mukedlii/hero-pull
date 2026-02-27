import type { ItemRarity } from "@/lib/items"

export type DungeonRoomType = "battle" | "treasure" | "shop" | "trap" | "blessing" | "boss"

type Range = [number, number]

export type EnemyRanges = {
  hp: Range
  atk: Range
  def: Range
  spd: Range
}

export type BossConfig = EnemyRanges & { name: string; emoji: string }

export type DungeonLevelConfig = {
  level: number
  /** Display name with emoji */
  name: string
  /** Difficulty label (spec uses the same text as name) */
  difficulty: string
  enemy: EnemyRanges
  boss: BossConfig
  /** Chance of item drop after a non-boss battle (0..1) */
  itemDropRate: number
  /** Gold gained after a non-boss battle (min,max) */
  battleGold: Range
  /** Gold gained from treasure room (min,max) */
  treasureGold: Range
  /** Reward item rarity when clearing boss */
  unlockRewardRarity: ItemRarity
}

export const DUNGEON_LEVELS: DungeonLevelConfig[] = [
  {
    level: 1,
    name: "The Crypt 🪦",
    difficulty: "The Crypt 🪦",
    // Tuned for hero base stats ~10..55 (+ gear). Early game must be beatable even without premium items.
    enemy: { hp: [70, 110], atk: [12, 18], def: [10, 16], spd: [10, 16] },
    boss: { name: "Crypt Warden", emoji: "🪦", hp: [160, 220], atk: [18, 26], def: [16, 22], spd: [12, 18] },
    itemDropRate: 0.16,
    battleGold: [10, 18],
    treasureGold: [14, 26],
    unlockRewardRarity: "Common",
  },
  {
    level: 2,
    name: "Dark Forest 🌲",
    difficulty: "Dark Forest 🌲",
    enemy: { hp: [90, 140], atk: [14, 22], def: [12, 18], spd: [12, 18] },
    boss: { name: "Forest Stalker", emoji: "🌲", hp: [220, 300], atk: [22, 30], def: [18, 26], spd: [14, 22] },
    itemDropRate: 0.18,
    battleGold: [12, 22],
    treasureGold: [18, 32],
    unlockRewardRarity: "Common",
  },
  {
    level: 3,
    name: "Goblin Caves 👺",
    difficulty: "Goblin Caves 👺",
    enemy: { hp: [120, 180], atk: [18, 26], def: [14, 22], spd: [14, 22] },
    boss: { name: "Goblin King", emoji: "👺", hp: [300, 420], atk: [28, 38], def: [22, 32], spd: [18, 26] },
    itemDropRate: 0.22,
    battleGold: [16, 28],
    treasureGold: [22, 40],
    unlockRewardRarity: "Rare",
  },
  {
    level: 4,
    name: "Orc Fortress 👹",
    difficulty: "Orc Fortress 👹",
    enemy: { hp: [150, 220], atk: [24, 34], def: [18, 28], spd: [16, 26] },
    boss: { name: "Orc Warlord", emoji: "👹", hp: [420, 560], atk: [38, 52], def: [30, 42], spd: [22, 32] },
    itemDropRate: 0.25,
    battleGold: [20, 34],
    treasureGold: [26, 50],
    unlockRewardRarity: "Rare",
  },
  {
    level: 5,
    name: "Haunted Tower 🗼",
    difficulty: "Haunted Tower 🗼",
    enemy: { hp: [190, 280], atk: [32, 44], def: [24, 36], spd: [22, 34] },
    boss: { name: "Tower Specter", emoji: "🗼", hp: [560, 740], atk: [52, 68], def: [40, 56], spd: [28, 40] },
    itemDropRate: 0.29,
    battleGold: [24, 40],
    treasureGold: [34, 64],
    unlockRewardRarity: "Epic",
  },
  {
    level: 6,
    name: "Shadow Realm 🌑",
    difficulty: "Shadow Realm 🌑",
    enemy: { hp: [240, 350], atk: [44, 60], def: [34, 50], spd: [30, 44] },
    boss: { name: "Shadow Lord", emoji: "🌑", hp: [760, 980], atk: [70, 90], def: [56, 74], spd: [40, 58] },
    itemDropRate: 0.32,
    battleGold: [28, 46],
    treasureGold: [40, 78],
    unlockRewardRarity: "Epic",
  },
  {
    level: 7,
    name: "Dragon's Lair 🐉",
    difficulty: "Dragon's Lair 🐉",
    enemy: { hp: [300, 440], atk: [58, 78], def: [46, 68], spd: [40, 60] },
    boss: { name: "Ancient Drake", emoji: "🐉", hp: [980, 1260], atk: [92, 118], def: [74, 98], spd: [58, 82] },
    itemDropRate: 0.36,
    battleGold: [32, 52],
    treasureGold: [52, 95],
    unlockRewardRarity: "Legendary",
  },
  {
    level: 8,
    name: "Void Dungeon ⚫",
    difficulty: "Void Dungeon ⚫",
    enemy: { hp: [360, 520], atk: [76, 100], def: [60, 86], spd: [56, 78] },
    boss: { name: "Void Herald", emoji: "⚫", hp: [1260, 1540], atk: [120, 150], def: [98, 124], spd: [74, 102] },
    itemDropRate: 0.4,
    battleGold: [36, 58],
    treasureGold: [60, 110],
    unlockRewardRarity: "Legendary",
  },
  {
    level: 9,
    name: "Hell Gate 🔥",
    difficulty: "Hell Gate 🔥",
    enemy: { hp: [440, 640], atk: [98, 128], def: [78, 108], spd: [74, 102] },
    boss: { name: "Hellkeeper", emoji: "🔥", hp: [1540, 1920], atk: [150, 188], def: [124, 154], spd: [96, 126] },
    itemDropRate: 0.44,
    battleGold: [40, 66],
    treasureGold: [70, 130],
    unlockRewardRarity: "Legendary",
  },
  {
    level: 10,
    name: "Final Abyss ⚡",
    difficulty: "Final Abyss ⚡",
    enemy: { hp: [560, 820], atk: [128, 170], def: [104, 144], spd: [96, 132] },
    boss: { name: "Final Abyss", emoji: "⚡", hp: [2000, 2600], atk: [200, 260], def: [160, 220], spd: [130, 180] },
    itemDropRate: 0.5,
    battleGold: [45, 75],
    treasureGold: [85, 160],
    unlockRewardRarity: "Set",
  },
]

export function getLevelConfig(level: number): DungeonLevelConfig {
  const lvl = clampLevel(level)
  return DUNGEON_LEVELS[lvl - 1] ?? DUNGEON_LEVELS[0]!
}

export function clampLevel(level: number) {
  return Math.max(1, Math.min(10, Math.floor(level)))
}

export function clampFloor(floor: number) {
  return Math.max(1, Math.min(10, Math.floor(floor)))
}

export function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Room weights per spec:
// floors 1-3: battle/treasure/shop/trap/blessing = 35/30/15/10/10
// floors 4-6: 50/20/15/10/5
// floors 7-9: 65/15/10/8/2
// floor 10: boss only
export function roomWeightsForFloor(floor: number): Array<{ type: DungeonRoomType; w: number }> {
  if (floor >= 10) return [{ type: "boss", w: 1 }]
  if (floor <= 3) return [
    { type: "battle", w: 35 },
    { type: "treasure", w: 30 },
    { type: "shop", w: 15 },
    { type: "trap", w: 10 },
    { type: "blessing", w: 10 },
  ]
  if (floor <= 6) return [
    { type: "battle", w: 50 },
    { type: "treasure", w: 20 },
    { type: "shop", w: 15 },
    { type: "trap", w: 10 },
    { type: "blessing", w: 5 },
  ]
  return [
    { type: "battle", w: 65 },
    { type: "treasure", w: 15 },
    { type: "shop", w: 10 },
    { type: "trap", w: 8 },
    { type: "blessing", w: 2 },
  ]
}
