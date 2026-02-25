import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '60px',
          background: 'linear-gradient(135deg, #0b0016 0%, #2a0a5e 55%, #7c4a00 100%)',
          color: 'white',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
        }}
      >
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ fontSize: 16, letterSpacing: 4, opacity: 0.8 }}>× FARCASTER MINI APP ×</div>
          <div style={{ fontSize: 84, fontWeight: 900, lineHeight: 0.95 }}>
            Hero
            <br />
            Pull
          </div>
          <div style={{ fontSize: 18, letterSpacing: 6, opacity: 0.8 }}>PULL · BATTLE · MERGE · MINT</div>
          <div style={{ fontSize: 16, opacity: 0.7 }}>hero-pull.vercel.app</div>
        </div>

        {/* Right: 4 hero cards */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 18, alignItems: 'center' }}>
          {[
            { seed: 'Shadow Viper', label: 'Common', border: 'rgba(255,255,255,0.15)' },
            { seed: 'Azure Spectre', label: 'Rare', border: 'rgba(96,165,250,0.9)' },
            { seed: 'Golden Phoenix', label: 'Legendary', border: 'rgba(255,215,0,0.9)' },
            { seed: 'Crimson Phantom', label: 'Epic', border: 'rgba(192,132,252,0.9)' },
          ].map((h) => (
            <div
              key={h.seed}
              style={{
                width: 170,
                height: 240,
                borderRadius: 18,
                border: `2px solid ${h.border}`,
                background: 'rgba(0,0,0,0.35)',
                boxShadow:
                  h.label === 'Legendary'
                    ? '0 0 30px rgba(255,215,0,0.25)'
                    : h.label === 'Epic'
                      ? '0 0 24px rgba(192,132,252,0.20)'
                      : h.label === 'Rare'
                        ? '0 0 18px rgba(96,165,250,0.18)'
                        : '0 0 0 rgba(0,0,0,0)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 18,
                gap: 12,
              }}
            >
              <img
                src={`https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(
                  h.seed
                )}&size=120`}
                width={120}
                height={120}
                style={{ borderRadius: 14 }}
              />
              <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.85 }}>{h.label.toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 800, textAlign: 'center' }}>{h.seed}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
