export type EquippedWeapon = {
  name: string
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  imageEmoji: string
  bonusATK: number
  bonusDEF: number
  bonusSPD: number
}

export type Hero = {
  name: string
  gender: 'Male' | 'Female' | 'Unknown'
  power: string
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  imageUrl: string
  attack: number
  defense: number
  speed: number
  xp: number
  level: number
  equippedWeapon?: EquippedWeapon
}

const names = [
  'Shadow Viper',
  'Iron Fist',
  'Stone Hawk',
  'Dark Wolf',
  'Steel Fox',
  'Night Crow',
  'Ash Knight',
  'Frost Blade',
  'Ember Guard',
  'Mud Runner',
  'Grim Archer',
  'Hollow Monk',
  'Blunt Edge',
  'Rusted Axe',
  'Pale Rider',
  'Neon Falcon',
  'Azure Spectre',
  'Titanium Ranger',
  'Volt Striker',
  'Jade Phantom',
  'Crimson Wave',
  'Silver Arrow',
  'Thunder Monk',
  'Plasma Fist',
  'Sonic Blade',
  'Storm Chaser',
  'Venom Hawk',
  'Crystal Guard',
  'Magma Knight',
  'Blaze Runner',
  'Crimson Phantom',
  'Obsidian Wraith',
  'Emerald Knight',
  'Solar Flare',
  'Void Walker',
  'Nova Striker',
  'Quantum Blade',
  'Cyber Phantom',
  'Dark Matter',
  'Astral Wolf',
  'Prism Knight',
  'Neutron Fox',
  'Omega Guard',
  'Apex Hunter',
  'Nexus Monk',
  'Golden Phoenix',
  'Silver Sentinel',
  'Eternal Dragon',
  'Cosmic Emperor',
  'Divine Titan',
  'Celestial Wolf',
  'Infinity Blade',
  'Mythic Falcon',
  'Sacred Phoenix',
  'Arcane God',
]

const powers = [
  'Time Freeze',
  'Mind Control',
  'Super Speed',
  'Telekinesis',
  'Invisibility',
  'Reality Shift',
  'Lightning Strike',
  'Shadow Clone',
  'Elemental Burst',
  'Healing Touch',
  'Gravity Pull',
  'Fire Storm',
  'Ice Prison',
  'Thunder Smash',
  'Dark Void',
  'Light Beam',
  'Psychic Wave',
  'Force Shield',
  'Energy Drain',
  'Dimension Slash',
  'Plasma Cannon',
  'Sonic Boom',
  'Meteor Strike',
  'Earthquake Fist',
  'Wind Slash',
]

const genders: Hero['gender'][] = ['Male', 'Female', 'Unknown']

export function generateRarity(): Hero['rarity'] {
  const roll = Math.random() * 100
  if (roll < 60) return 'Common'
  if (roll < 85) return 'Rare'
  if (roll < 97) return 'Epic'
  return 'Legendary'
}

function generateStatForRarity(rarity: Hero['rarity']): number {
  const ranges: Record<Hero['rarity'], [number, number]> = {
    Common: [10, 40],
    Rare: [30, 60],
    Epic: [50, 80],
    Legendary: [70, 100],
  }
  const [min, max] = ranges[rarity]
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateHero(): Hero {
  const name = names[Math.floor(Math.random() * names.length)]
  const gender = genders[Math.floor(Math.random() * genders.length)]
  const power = powers[Math.floor(Math.random() * powers.length)]
  const rarity = generateRarity()
  const filename = name.toLowerCase().replace(/ /g, '_') + '.png'
  const imageUrl = `/heroes/${filename}`
  return {
    name,
    gender,
    power,
    rarity,
    imageUrl,
    attack: generateStatForRarity(rarity),
    defense: generateStatForRarity(rarity),
    speed: generateStatForRarity(rarity),
    xp: 0,
    level: 1,
  }
}
