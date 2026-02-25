/**
 * Helper functions for generating random heroes.
 *
 * A hero is composed of a name, gender, power, rarity and
 * image URL. The generation logic uses weighted probabilities
 * for rarity to ensure the distribution specified in the game
 * description. DiceBear is used to generate deterministic
 * avatars based on the hero’s name.
 */

export type Hero = {
  name: string
  gender: 'Male' | 'Female' | 'Unknown'
  power: string
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  imageUrl: string
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
  'Healing Touch'
]

const genders: Hero['gender'][] = ['Male', 'Female', 'Unknown']

/**
 * Generates a weighted random rarity based on pre‑defined
 * probabilities. The distribution is as follows:
 *  - Common: 60%
 *  - Rare: 25%
 *  - Epic: 12%
 *  - Legendary: 3%
 */
export function generateRarity(): Hero['rarity'] {
  const roll = Math.random() * 100
  if (roll < 60) return 'Common'
  if (roll < 85) return 'Rare'
  if (roll < 97) return 'Epic'
  return 'Legendary'
}

/**
 * Generates a random hero.
 */
export function generateHero(): Hero {
  const name = names[Math.floor(Math.random() * names.length)]
  const gender = genders[Math.floor(Math.random() * genders.length)]
  const power = powers[Math.floor(Math.random() * powers.length)]
  const rarity = generateRarity()
  const imageUrl = `/heroes/${name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}.png`
  return { name, gender, power, rarity, imageUrl }
}