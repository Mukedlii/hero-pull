import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"
import { LAYER_OPTIONS, RARITY_BG } from "@/lib/heroLayers"

export const dynamic = "force-dynamic"

const VALID_CHARS = new Set(LAYER_OPTIONS.chars)
const VALID_OVERLAYS = new Set(LAYER_OPTIONS.overlays)
const VALID_RARITIES = new Set(Object.keys(RARITY_BG))

function validate(value: string | null, allowed: Set<string>, fallback: string): string {
  return value && allowed.has(value) ? value : fallback
}

export async function GET(req: NextRequest) {
  try {
    const sharp = (await import("sharp")).default

    const { searchParams } = new URL(req.url)
    const char = validate(searchParams.get("char"), VALID_CHARS, "char_warrior_m")
    const rarity = validate(searchParams.get("rarity"), VALID_RARITIES, "Common")
    const ovrRaw = searchParams.get("ovr")
    const ovr = ovrRaw && VALID_OVERLAYS.has(ovrRaw) ? ovrRaw : null

    const bgFile = RARITY_BG[rarity]
    const layersDir = path.join(process.cwd(), "public", "layers")

    const SIZE = 512

    const bgPath = path.join(layersDir, "backgrounds", `${bgFile}.png`)
    const bgBuffer = fs.existsSync(bgPath)
      ? await sharp(bgPath).resize(SIZE, SIZE, { fit: "cover" }).toBuffer()
      : await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 30, g: 30, b: 30, alpha: 255 } } }).png().toBuffer()

    const overlays: { input: Buffer; top: number; left: number }[] = []

    const charPath = path.join(layersDir, "chars", `${char}.png`)
    if (fs.existsSync(charPath)) {
      const resized = await sharp(charPath)
        .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer()
      overlays.push({ input: resized, top: 0, left: 0 })
    }

    if (ovr) {
      const ovrPath = path.join(layersDir, "overlays", `${ovr}.png`)
      if (fs.existsSync(ovrPath)) {
        // Overlays are authored to align with the full 1:1 canvas.
        // Resizing them smaller + centering can cause "double face"/smearing artifacts on mobile.
        const resized = await sharp(ovrPath)
          .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer()
        overlays.push({ input: resized, top: 0, left: 0 })
      }
    }

    const result = await sharp(bgBuffer)
      .composite(overlays)
      // PNG ignores "quality" (that's for JPEG/WebP). Keep output deterministic.
      .png()
      .toBuffer()

    return new NextResponse(result, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (err: any) {
    console.error("Hero image compositing error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
