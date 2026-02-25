const SCORE_KEY = 'hero-pull-score'
const SCORE_SIG_KEY = 'hero-pull-score-sig'
const SCORE_SALT_KEY = 'hero-pull-score-salt'
const LAST_AWARDED_BATTLE_KEY = 'hero-pull-last-awarded-battle'
const LAST_AWARDED_AT_KEY = 'hero-pull-last-awarded-at'

function clampScore(n: number) {
  return Math.max(0, Math.floor(n))
}

function getOrCreateSalt() {
  let salt = localStorage.getItem(SCORE_SALT_KEY)
  if (!salt) {
    salt = (globalThis.crypto?.randomUUID?.() ?? String(Date.now())) + '-' + Math.random().toString(16).slice(2)
    localStorage.setItem(SCORE_SALT_KEY, salt)
  }
  return salt
}

async function sha256Hex(input: string) {
  const enc = new TextEncoder()
  const bytes = enc.encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function signScore(score: number, salt: string) {
  return await sha256Hex(`${score}|${salt}|v1`)
}

export async function readScore(): Promise<number> {
  const raw = localStorage.getItem(SCORE_KEY)
  const sig = localStorage.getItem(SCORE_SIG_KEY)
  const salt = getOrCreateSalt()
  const score = clampScore(Number(raw ?? '0'))

  // If no signature yet, initialize.
  if (!sig) {
    const newSig = await signScore(score, salt)
    localStorage.setItem(SCORE_KEY, String(score))
    localStorage.setItem(SCORE_SIG_KEY, newSig)
    return score
  }

  const expected = await signScore(score, salt)
  if (sig !== expected) {
    // Tamper detected (best-effort): reset score.
    const reset = 0
    localStorage.setItem(SCORE_KEY, String(reset))
    localStorage.setItem(SCORE_SIG_KEY, await signScore(reset, salt))
    return reset
  }

  return score
}

export async function writeScore(score: number) {
  const salt = getOrCreateSalt()
  const next = clampScore(score)
  localStorage.setItem(SCORE_KEY, String(next))
  localStorage.setItem(SCORE_SIG_KEY, await signScore(next, salt))
  return next
}

export async function awardBattlePoints(opts: { battleId: string; delta: number; fid?: number }) {
  const { battleId, delta, fid } = opts

  // Anti-spam: only award once per battle id + simple cooldown.
  const lastBattleId = localStorage.getItem(LAST_AWARDED_BATTLE_KEY)
  if (lastBattleId && lastBattleId === battleId) {
    return await readScore()
  }

  const lastAt = Number(localStorage.getItem(LAST_AWARDED_AT_KEY) ?? '0')
  const now = Date.now()
  if (now - lastAt < 1500) {
    // too fast, ignore
    return await readScore()
  }

  const current = await readScore()
  const next = clampScore(current + delta)
  await writeScore(next)

  // Best-effort persist to server (Supabase) if fid is known.
  if (fid) {
    fetch('/api/score/add', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fid, delta, action: 'battle', ref: battleId }),
    }).catch(() => {})
  }

  localStorage.setItem(LAST_AWARDED_BATTLE_KEY, battleId)
  localStorage.setItem(LAST_AWARDED_AT_KEY, String(now))

  return next
}
