import sharp from 'sharp'

const input = 'public/icon.jpg'
const out = 'public/icon.png'

await sharp(input)
  .resize(512, 512, { fit: 'cover' })
  .png({ compressionLevel: 9 })
  .toFile(out)

console.log('wrote', out)
