export type WeaponRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary'
export type WeaponType = 'Sword' | 'Shield' | 'Boots' | 'Helmet' | 'Gauntlet'

export type Weapon = {
  id: string
  name: string
  type: WeaponType
  rarity: WeaponRarity
  bonusATK: number
  bonusDEF: number
  bonusSPD: number
  imageEmoji: string
}

const weaponNames: Record<WeaponType, Record<WeaponRarity, string>> = {
  Sword: {
    Common: 'Iron Blade',
    Rare: 'Steel Edge',
    Epic: 'Shadow Slicer',
    Legendary: 'Divine Sword',
  },
  Shield: {
    Common: 'Wooden Guard',
    Rare: 'Iron Wall',
    Epic: 'Void Barrier',
    Legendary: 'Celestial Shield',
  },
  Boots: {
    Common: 'Leather Boots',
    Rare: 'Swift Runners',
    Epic: 'Shadow Steps',
    Legendary: 'Lightning Boots',
  },
  Helmet: {
    Common: 'Copper Helm',
    Rare: 'Steel Crown',
    Epic: 'Dark Visor',
    Legendary: 'God Helmet',
  },
  Gauntlet: {
    Common: 'Cloth Wrap',
    Rare: 'Iron Grip',
    Epic: 'Power Fist',
    Legendary: 'Infinity Gauntlet',
  },
}

const weaponEmoji: Record<WeaponType, string> = {
  Sword: '⚔️',
  Shield: '🛡️',
  Boots: '👢',
  Helmet: '⛑️',
  Gauntlet: '🥊',
}

export function generateWeaponRarity(): WeaponRarity {
  const roll = Math.random() * 100
  if (roll < 55) return 'Common'
  if (roll < 83) return 'Rare'
  if (roll < 97) return 'Epic'
  return 'Legendary'
}

export function randomWeaponType(): WeaponType {
  const types: WeaponType[] = ['Sword', 'Shield', 'Boots', 'Helmet', 'Gauntlet']
  return types[Math.floor(Math.random() * types.length)]
}

export function generateWeaponBonuses(rarity: WeaponRarity): { atk: number; def: number; spd: number } {
  let atk = 0
  let def = 0
  let spd = 0

  if (rarity === 'Common') {
    const stats: Array<'atk' | 'def' | 'spd'> = ['atk', 'def', 'spd']
    const chosen = stats[Math.floor(Math.random() * stats.length)]
    if (chosen === 'atk') atk = 5
    if (chosen === 'def') def = 5
    if (chosen === 'spd') spd = 5
  } else if (rarity === 'Rare') {
    const stats: Array<'atk' | 'def' | 'spd'> = ['atk', 'def', 'spd']
    const first = stats[Math.floor(Math.random() * stats.length)]
    const remaining = stats.filter((s) => s !== first)
    const second = remaining[Math.floor(Math.random() * remaining.length)]
    if (first === 'atk') atk = 10
    if (first === 'def') def = 10
    if (first === 'spd') spd = 10
    if (second === 'atk') atk += 5
    if (second === 'def') def += 5
    if (second === 'spd') spd += 5
  } else if (rarity === 'Epic') {
    atk = 15
    def = 10
    spd = 5
  } else if (rarity === 'Legendary') {
    atk = 25
    def = 25
    spd = 25
  }

  return { atk, def, spd }
}

export function generateWeapon(): Weapon {
  const rarity = generateWeaponRarity()
  const type = randomWeaponType()
  const name = weaponNames[type][rarity]
  const { atk, def, spd } = generateWeaponBonuses(rarity)
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  return {
    id,
    name,
    type,
    rarity,
    bonusATK: atk,
    bonusDEF: def,
    bonusSPD: spd,
    imageEmoji: weaponEmoji[type],
  }
}

export function nextWeaponRarity(r: WeaponRarity): WeaponRarity {
  if (r === 'Common') return 'Rare'
  if (r === 'Rare') return 'Epic'
  if (r === 'Epic') return 'Legendary'
  return 'Legendary'
}
