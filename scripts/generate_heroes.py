#!/usr/bin/env python3
"""Generate layered Hero NFTs (PNG + metadata) with Tier system.

Inputs: a folder with the ZIP contents (assets/ + config/rarity.json).

Usage (example):
  pip install pillow
  python scripts/generate_heroes.py --src C:/path/to/zip-root --count 5000 --out ./generated

Output:
  generated/images/hero_00001.png
  generated/metadata/hero_00001.json
  generated/index.csv

Tier odds & bonuses (default):
  Common 60%  (no bonus)
  Rare 25%    (+5% power)
  Epic 10%    (+10% power)
  Legendary 5%(+20% power)
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

W = H = 1024


@dataclass(frozen=True)
class Tier:
    name: str
    p: float
    color: str
    power_bonus_pct: float


TIERS = [
    Tier("Common", 0.60, "#9ca3af", 0.00),
    Tier("Rare", 0.25, "#60a5fa", 0.05),
    Tier("Epic", 0.10, "#c084fc", 0.10),
    Tier("Legendary", 0.05, "#ffd700", 0.20),
]


def roll_tier(rng: random.Random) -> Tier:
    r = rng.random()
    acc = 0.0
    for t in TIERS:
        acc += t.p
        if r < acc:
            return t
    return TIERS[-1]


def weighted_choice(d: dict, rng: random.Random) -> str:
    items = list(d.items())
    total = sum(float(w) for _, w in items)
    r = rng.uniform(0, total)
    for k, w in items:
        w = float(w)
        if r < w:
            return k
        r -= w
    return items[-1][0]


def sha_seed(s: str) -> int:
    # deterministic seed from string
    h = hashlib.sha256(s.encode("utf-8")).digest()
    return int.from_bytes(h[:8], "big", signed=False)


def ensure_file(p: Path):
    if not p.exists():
        raise FileNotFoundError(str(p))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=str, required=True, help="Root folder containing assets/ and config/")
    ap.add_argument("--count", type=int, default=100)
    ap.add_argument("--out", type=str, default="generated")
    ap.add_argument("--rarity", type=str, default="config/rarity.json")
    ap.add_argument("--collection", type=str, default="Hero Pull Heroes")
    ap.add_argument("--description", type=str, default="Hero Pull — generated layered heroes with tier rarity.")
    ap.add_argument(
        "--image-base",
        type=str,
        default="ipfs://REPLACE_ME/",
        help="Base URI for image field, e.g. ipfs://CID/ or https://.../images/",
    )
    ap.add_argument("--start-id", type=int, default=1)
    ap.add_argument(
        "--seed",
        type=str,
        default="hero-pull",
        help="Global seed (string). Same inputs => same outputs.",
    )
    args = ap.parse_args()

    src = Path(args.src)
    assets = src / "assets"
    rarity_path = src / args.rarity
    ensure_file(rarity_path)

    rarity = json.loads(rarity_path.read_text(encoding="utf-8"))

    out = Path(args.out)
    out_images = out / "images"
    out_meta = out / "metadata"
    out_images.mkdir(parents=True, exist_ok=True)
    out_meta.mkdir(parents=True, exist_ok=True)

    # CSV index
    csv_path = out / "index.csv"
    csv_f = csv_path.open("w", newline="", encoding="utf-8")
    writer = csv.writer(csv_f)
    writer.writerow(
        [
            "token_id",
            "file",
            "tier",
            "power",
            "skin",
            "hair_style",
            "hair_color",
            "eyes_style",
            "eyes_color",
            "mouth",
            "item",
        ]
    )

    try:
        for n in range(args.count):
            token_id = args.start_id + n
            token_str = str(token_id).zfill(5)

            # Deterministic per-token RNG
            rng = random.Random(sha_seed(f"{args.seed}:{token_id}"))

            tier = roll_tier(rng)

            # Use rarity weights exactly as provided in the ZIP (config/rarity.json)
            skin = weighted_choice(rarity["base"], rng)
            hair_style = weighted_choice(rarity["hair_style"], rng)
            hair_color = weighted_choice(rarity["hair_color"], rng)
            eyes_style = weighted_choice(rarity["eyes_style"], rng)
            eyes_color = weighted_choice(rarity["eyes_color"], rng)
            mouth = weighted_choice(rarity["mouth"], rng)
            item = weighted_choice(rarity["item"], rng)

            layers = [
                assets / "base" / f"{skin}.png",
                assets / "hair" / f"{hair_style}_{hair_color}.png",
                assets / "eyes" / f"{eyes_style}_{eyes_color}.png",
                assets / "mouth" / f"{mouth}.png",
                assets / "items" / f"{item}.png",
            ]
            for p in layers:
                ensure_file(p)

            img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            for p in layers:
                img.alpha_composite(Image.open(p).convert("RGBA"))

            # Gameplay stat: power
            base_power = rng.randint(80, 120)
            power = int(round(base_power * (1.0 + tier.power_bonus_pct)))

            file_name = f"hero_{token_str}.png"
            meta_name = f"hero_{token_str}.json"

            img.save(out_images / file_name, "PNG", optimize=True)

            meta = {
                "name": f"{args.collection} #{token_id}",
                "description": args.description,
                "image": f"{args.image_base}{file_name}",
                "attributes": [
                    {"trait_type": "Tier", "value": tier.name},
                    {"trait_type": "Tier Color", "value": tier.color},
                    {"trait_type": "Power", "value": power},
                    {"trait_type": "Skin", "value": skin},
                    {"trait_type": "Hair Style", "value": hair_style},
                    {"trait_type": "Hair Color", "value": hair_color},
                    {"trait_type": "Eyes Style", "value": eyes_style},
                    {"trait_type": "Eyes Color", "value": eyes_color},
                    {"trait_type": "Mouth", "value": mouth},
                    {"trait_type": "Item", "value": item},
                ],
            }
            (out_meta / meta_name).write_text(json.dumps(meta, indent=2), encoding="utf-8")

            writer.writerow(
                [
                    token_id,
                    file_name,
                    tier.name,
                    power,
                    skin,
                    hair_style,
                    hair_color,
                    eyes_style,
                    eyes_color,
                    mouth,
                    item,
                ]
            )

        print(f"Done. Wrote: {out_images} + {out_meta} + {csv_path}")

    finally:
        csv_f.close()


if __name__ == "__main__":
    main()
