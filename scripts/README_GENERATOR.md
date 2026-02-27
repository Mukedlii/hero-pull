# Hero NFT Generator (Layer Kit)

This repo includes a generator script that composes PNG layers into final NFT images + metadata.

## Requirements
- Python 3.10+
- `pip install pillow`

## Input
You need the **ZIP root folder** that contains:
- `assets/` (layers)
- `config/rarity.json`

This is the ZIP you sent (extract it somewhere).

## Generate 5000
```bash
python scripts/generate_heroes.py \
  --src "C:/path/to/extracted-zip" \
  --count 5000 \
  --out "./generated" \
  --image-base "ipfs://REPLACE_ME/"
```

## Output
- `generated/images/hero_00001.png`
- `generated/metadata/hero_00001.json`
- `generated/index.csv`

## Tier System
- Common 60% (no bonus)
- Rare 25% (+5% power)
- Epic 10% (+10% power)
- Legendary 5% (+20% power)

## Notes
- Generation is **deterministic** per token id (uses `--seed` + token id)
- Change tier odds/bonuses in `scripts/generate_heroes.py` (`TIERS`)
