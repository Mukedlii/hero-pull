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
    enemy: { hp: [130, 190], atk: [90, 140], def: [70, 120], spd: [70, 120] },
    boss: { name: "Crypt Warden", emoji: "🪦", hp: [280, 360], atk: [160, 220], def: [140, 200], spd: [90, 140] },
    itemDropRate: 0.16,
    battleGold: [10, 18],
    treasureGold: [14, 26],
    unlockRewardRarity: "Common",
  },
  {
    level: 2,
    name: "Dark Forest 🌲",
    difficulty: "Dark Forest 🌲",
    enemy: { hp: [170, 240], atk: [120, 190], def: [100, 170], spd: [90, 150] },
    boss: { name: "Forest Stalker", emoji: "🌲", hp: [340, 460], atk: [220, 290], def: [180, 240], spd: [120, 180] },
    itemDropRate: 0.18,
    battleGold: [12, 22],
    treasureGold: [18, 32],
    unlockRewardRarity: "Common",
  },
  {
    level: 3,
    name: "Goblin Caves 👺",
    difficulty: "Goblin Caves 👺",
    enemy: { hp: [210, 300], atk: [170, 240], def: [140, 210], spd: [120, 190] },
    boss: { name: "Goblin King", emoji: "👺", hp: [440, 600], atk: [280, 360], def: [240, 320], spd: [160, 230] },
    itemDropRate: 0.22,
    battleGold: [16, 28],
    treasureGold: [22, 40],
    unlockRewardRarity: "Rare",
  },
  {
    level: 4,
    name: "Orc Fortress 👹",
    difficulty: "Orc Fortress 👹",
    enemy: { hp: [260, 370], atk: [230, 320], def: [190, 280], spd: [150, 240] },
    boss: { name: "Orc Warlord", emoji: "👹", hp: [580, 760], atk: [380, 470], def: [320, 400], spd: [210, 290] },
    itemDropRate: 0.25,
    battleGold: [20, 34],
    treasureGold: [26, 50],
    unlockRewardRarity: "Rare",
  },
  {
    level: 5,
    name: "Haunted Tower 🗼",
    difficulty: "Haunted Tower 🗼",
    enemy: { hp: [320, 460], atk: [310, 420], def: [260, 370], spd: [210, 310] },
    boss: { name: "Tower Specter", emoji: "🗼", hp: [760, 980], atk: [510, 640], def: [410, 540], spd: [270, 370] },
    itemDropRate: 0.29,
    battleGold: [24, 40],
    treasureGold: [34, 64],
    unlockRewardRarity: "Epic",
  },
  {
    level: 6,
    name: "Shadow Realm 🌑",
    difficulty: "Shadow Realm 🌑",
    enemy: { hp: [390, 560], atk: [410, 560], def: [340, 500], spd: [270, 400] },
    boss: { name: "Shadow Lord", emoji: "🌑", hp: [980, 1220], atk: [660, 820], def: [540, 700], spd: [340, 480] },
    itemDropRate: 0.32,
    battleGold: [28, 46],
    treasureGold: [40, 78],
    unlockRewardRarity: "Epic",
  },
  {
    level: 7,
    name: "Dragon's Lair 🐉",
    difficulty: "Dragon's Lair 🐉",
    enemy: { hp: [470, 680], atk: [540, 710], def: [440, 620], spd: [340, 500] },
    boss: { name: "Ancient Drake", emoji: "🐉", hp: [1220, 1540], atk: [860, 1040], def: [700, 880], spd: [440, 600] },
    itemDropRate: 0.36,
    battleGold: [32, 52],
    treasureGold: [52, 95],
    unlockRewardRarity: "Legendary",
  },
  {
    level: 8,
    name: "Void Dungeon ⚫",
    difficulty: "Void Dungeon ⚫",
    enemy: { hp: [560, 820], atk: [690, 880], def: [560, 760], spd: [420, 590] },
    boss: { name: "Void Herald", emoji: "⚫", hp: [1540, 1860], atk: [1040, 1220], def: [860, 1060], spd: [540, 720] },
    itemDropRate: 0.4,
    battleGold: [36, 58],
    treasureGold: [60, 110],
    unlockRewardRarity: "Legendary",
  },
  {
    level: 9,
    name: "Hell Gate 🔥",
    difficulty: "Hell Gate 🔥",
    enemy: { hp: [690, 980], atk: [840, 1040], def: [700, 920], spd: [560, 760] },
    boss: { name: "Hellkeeper", emoji: "🔥", hp: [1860, 2240], atk: [1240, 1440], def: [1040, 1240], spd: [700, 900] },
    itemDropRate: 0.44,
    battleGold: [40, 66],
    treasureGold: [70, 130],
    unlockRewardRarity: "Legendary",
  },
  {
    level: 10,
    name: "Final Abyss ⚡",
    difficulty: "Final Abyss ⚡",
    enemy: { hp: [850, 1180], atk: [1050, 1250], def: [900, 1120], spd: [720, 930] },
    boss: { name: "Final Abyss", emoji: "⚡", hp: [2400, 3000], atk: [1500, 1700], def: [1250, 1500], spd: [950, 1150] },
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
