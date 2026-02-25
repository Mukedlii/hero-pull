import fs from 'node:fs/promises'
import path from 'node:path'

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

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

async function downloadOne(name) {
  const filename = `${slugify(name)}.png`
  const outDir = path.join(process.cwd(), 'public', 'heroes')
  const outPath = path.join(outDir, filename)

  const url = `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(
    name
  )}&size=200`

  await fs.mkdir(outDir, { recursive: true })

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed ${res.status} downloading ${name}`)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(outPath, buf)
  return { name, filename, bytes: buf.length }
}

async function main() {
  const results = []
  for (const name of names) {
    process.stdout.write(`Downloading: ${name}... `)
    const r = await downloadOne(name)
    results.push(r)
    console.log(`${r.bytes} bytes -> public/heroes/${r.filename}`)
    await new Promise((r) => setTimeout(r, 150))
  }

  console.log(`\nDone. Downloaded ${results.length} images.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
