const https = require('https')
const fs = require('fs')
const path = require('path')

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

const dir = path.join(__dirname, '../public/heroes')
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

function download(name) {
  return new Promise((resolve) => {
    const seed = encodeURIComponent(name)
    const url = `https://api.dicebear.com/7.x/adventurer/png?seed=${seed}&size=200`
    const filename = name.toLowerCase().replace(/ /g, '_') + '.png'
    const filepath = path.join(dir, filename)
    const file = fs.createWriteStream(filepath)

    https
      .get(url, (res) => {
        res.pipe(file)
        file.on('finish', () => {
          file.close()
          console.log('Downloaded: ' + name)
          resolve()
        })
      })
      .on('error', (err) => {
        console.error('Failed: ' + name, err.message)
        resolve()
      })
  })
}

async function main() {
  for (const name of names) {
    await download(name)
    await new Promise((r) => setTimeout(r, 200))
  }
  console.log('All done!')
}

main()
