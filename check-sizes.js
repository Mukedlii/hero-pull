const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function checkSizes() {
  const dirs = ['chars', 'overlays', 'backgrounds'];
  
  for (const dir of dirs) {
    console.log(`\n=== ${dir} ===`);
    const dirPath = path.join(__dirname, 'public', 'layers', dir);
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      if (!file.endsWith('.png')) continue;
      const filePath = path.join(dirPath, file);
      const metadata = await sharp(filePath).metadata();
      console.log(`${file}: ${metadata.width}x${metadata.height} (${metadata.channels} channels, ${metadata.format})`);
    }
  }
}

checkSizes().catch(console.error);
