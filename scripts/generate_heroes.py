#!/usr/bin/env python3
"""Generate layered Hero NFTs using the public/layers/ assets.

This script composites hero images from the layer system:
  - backgrounds/ (rarity-based: bg_common, bg_rare, bg_epic, bg_legendary)
  - body/ (body_male_1, body_male_2, body_female_1, body_female_2)
  - eyes/ (eyes_fierce, eyes_wise, eyes_mystic, eyes_shadow, eyes_divine)
  - mouth/ (mouth_stern, mouth_smirk, mouth_fierce, mouth_calm, mouth_sinister)
  - hair/ (hair_long_black, hair_long_silver, hair_long_red, hair_long_blue,
           hair_short_brown, hair_short_blonde, hair_short_purple,
           hair_mohawk_green, hair_bald_runes, hair_braided_dark)
  - accessories/ (acc_pauldrons, acc_amulet, acc_hood, acc_scars, acc_crown,
                   acc_runes, acc_eyepatch)

Usage:
  pip install pillow
  python scripts/generate_heroes.py --count 100 --out ./generated

Output:
  generated/images/hero_00001.png
  generated/metadata/hero_00001.json
  generated/index.csv
"""

import argparse
import csv
import hashlib
import json
import os
import random
from dataclasses import dataclass
from pathlib import Path

from PIL import Image

W = H = 512

LAYERS_DIR = Path(__file__).resolve().parent.parent / "public" / "layers"


@dataclass(frozen=True)
class Tier:
    name: str
    p: float
    color: str
    power_bonus_pct: float


TIERS = [
    Tier("Common", 0.60, "#9ca3af", 0.00),
    Tier("Rare", 0.25, "#60a5fa", 0.05),
    Tier("Epic", 0.12, "#c084fc", 0.10),
    Tier("Legendary", 0.03, "#ffd700", 0.20),
]

CHARS = [
    "char_warrior_m", "char_mage_m", "char_warrior_f", "char_mage_f",
    "char_rogue_m", "char_ranger_f", "char_paladin_m", "char_necro_f",
    "char_berserker_m", "char_cleric_f", "char_darkknight_m", "char_monk_f",
]
OVERLAYS = [
    "ovr_pauldrons", "ovr_amulet", "ovr_hood", "ovr_scars",
    "ovr_crown", "ovr_runes", "ovr_eyepatch",
]

BG_MAP = {
    "Common": "bg_common",
    "Rare": "bg_rare",
    "Epic": "bg_epic",
    "Legendary": "bg_legendary",
}

NAME_PREFIXES = {
    "Common": ["Rookie", "Novice", "Young", "Wandering", "Simple", "Local", "Town", "Green", "Fresh"],
    "Rare": ["Skilled", "Adept", "Swift", "Brave", "Fierce", "Noble", "Silver", "Iron", "Storm"],
    "Epic": ["Master", "Elite", "Grand", "Shadow", "Crimson", "Phantom", "Mystic", "Radiant", "Thunder"],
    "Legendary": ["Divine", "Godly", "Cosmic", "Astral", "Supreme", "Immortal", "Abyssal", "Celestial", "Mythic"],
}

NAME_SUFFIXES = [
    "Fighter", "Warrior", "Knight", "Ranger", "Mage", "Paladin", "Rogue",
    "Defender", "Champion", "Sentinel", "Guardian", "Striker", "Blade",
]


def roll_tier(rng: random.Random) -> Tier:
    r = rng.random()
    acc = 0.0
    for t in TIERS:
        acc += t.p
        if r < acc:
            return t
    return TIERS[-1]


def generate_name(tier: Tier, rng: random.Random) -> str:
    prefix = rng.choice(NAME_PREFIXES[tier.name])
    suffix = rng.choice(NAME_SUFFIXES)
    return f"{prefix} {suffix}"


def sha_seed(s: str) -> int:
    h = hashlib.sha256(s.encode("utf-8")).digest()
    return int.from_bytes(h[:8], "big", signed=False)


def load_layer(category: str, name: str) -> Image.Image:
    p = LAYERS_DIR / category / f"{name}.png"
    if not p.exists():
        raise FileNotFoundError(f"Layer not found: {p}")
    return Image.open(p).convert("RGBA").resize((W, H), Image.LANCZOS)


def composite_hero(tier: Tier, char: str, overlay: str | None) -> Image.Image:
    bg_name = BG_MAP[tier.name]
    img = load_layer("backgrounds", bg_name)

    char_layer = load_layer("chars", char)
    img.alpha_composite(char_layer)

    if overlay:
        ovr_layer = load_layer("overlays", overlay)
        img.alpha_composite(ovr_layer)

    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, default=100)
    ap.add_argument("--out", type=str, default="generated")
    ap.add_argument("--collection", type=str, default="Hero Pull Heroes")
    ap.add_argument("--description", type=str, default="Hero Pull — generated layered heroes with tier rarity.")
    ap.add_argument("--image-base", type=str, default="ipfs://REPLACE_ME/")
    ap.add_argument("--start-id", type=int, default=1)
    ap.add_argument("--seed", type=str, default="hero-pull")
    args = ap.parse_args()

    out = Path(args.out)
    out_images = out / "images"
    out_meta = out / "metadata"
    out_images.mkdir(parents=True, exist_ok=True)
    out_meta.mkdir(parents=True, exist_ok=True)

    csv_path = out / "index.csv"
    csv_f = csv_path.open("w", newline="", encoding="utf-8")
    writer = csv.writer(csv_f)
    writer.writerow([
        "token_id", "file", "tier", "power", "name",
        "char", "overlay",
    ])

    try:
        for n in range(args.count):
            token_id = args.start_id + n
            token_str = str(token_id).zfill(5)
            rng = random.Random(sha_seed(f"{args.seed}:{token_id}"))

            tier = roll_tier(rng)
            char = rng.choice(CHARS)
            overlay = rng.choice(OVERLAYS) if rng.random() < 0.5 else None

            img = composite_hero(tier, char, overlay)

            base_power = rng.randint(80, 120)
            power = int(round(base_power * (1.0 + tier.power_bonus_pct)))

            file_name = f"hero_{token_str}.png"
            meta_name = f"hero_{token_str}.json"

            img.save(out_images / file_name, "PNG", optimize=True)

            name = generate_name(tier, rng)

            meta = {
                "name": name,
                "description": args.description,
                "image": f"{args.image_base}{file_name}",
                "attributes": [
                    {"trait_type": "Tier", "value": tier.name},
                    {"trait_type": "Tier Color", "value": tier.color},
                    {"trait_type": "Power", "value": power},
                    {"trait_type": "Character", "value": char},
                    {"trait_type": "Overlay", "value": overlay or "None"},
                ],
                "layers": {
                    "char": char,
                    "overlay": overlay,
                },
            }
            (out_meta / meta_name).write_text(json.dumps(meta, indent=2), encoding="utf-8")

            writer.writerow([
                token_id, file_name, tier.name, power, name,
                char, overlay or "",
            ])

        print(f"Done. Generated {args.count} heroes => {out_images} + {out_meta} + {csv_path}")

    finally:
        csv_f.close()


if __name__ == "__main__":
    main()
