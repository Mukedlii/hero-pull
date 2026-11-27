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

// Normalize every transparent artwork layer to the same square canvas.
// "fill" would stretch non-square source files and make equipment drift
// away from the character; "contain" preserves proportions and centers it.
async function normalizeLayer(sharp: any, filePath: string, size: number): Promise<Buffer> {
  return sharp(filePath)
    .rotate()
    .resize(size, size, {
      fit: "contain",
      position: "centre",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
}

export async function GET(req: NextRequest) {
  try {
    const sharp = (await import("sharp")).default
    const { searchParams } = new URL(req.url)
    const char = validate(searchParams.get("char"), VALID_CHARS, "char_warrior_m")
    const rarity = validate(searchParams.get("rarity"), VALID_RARITIES, "Common")
    const ovrRaw = searchParams.get("ovr")
    const ovr = ovrRaw && VALID_OVERLAYS.has(ovrRaw) ? ovrRaw : null

    const layersDir = path.join(process.cwd(), "public", "layers")
    const SIZE = 512
    const bgPath = path.join(layersDir, "backgrounds", `${RARITY_BG[rarity]}.png`)
    const bgBuffer = fs.existsSync(bgPath)
      ? await sharp(bgPath).rotate().resize(SIZE, SIZE, { fit: "cover", position: "centre" }).png().toBuffer()
      : await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 30, g: 30, b: 30, alpha: 255 } } }).png().toBuffer()

    const composites: { input: Buffer; top: number; left: number }[] = []
    const charPath = path.join(layersDir, "chars", `${char}.png`)
    if (fs.existsSync(charPath)) {
      composites.push({ input: await normalizeLayer(sharp, charPath, SIZE), top: 0, left: 0 })
    }

    if (ovr) {
      const overlayPath = path.join(layersDir, "overlays", `${ovr}.png`)
      if (fs.existsSync(overlayPath)) {
        composites.push({ input: await normalizeLayer(sharp, overlayPath, SIZE), top: 0, left: 0 })
      }
    }

    const result = await sharp(bgBuffer).composite(composites).png().toBuffer()
    return new NextResponse(result, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    })
  } catch (err: any) {
    console.error("Hero image compositing error:", err)
    return NextResponse.json({ error: err.message || "Image composition failed" }, { status: 500 })
  }
}
