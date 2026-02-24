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
  'Neon Falcon',
  'Crimson Phantom',
  'Silver Sentinel',
  'Obsidian Wraith',
  'Golden Phoenix',
  'Azure Spectre',
  'Emerald Knight',
  'Titanium Ranger',
  'Solar Flare'
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
  // DiceBear Adventurer avatar API uses the seed to generate a unique image
  const seed = encodeURIComponent(name)
  const imageUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`
  return { name, gender, power, rarity, imageUrl }
}