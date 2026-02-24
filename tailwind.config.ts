import type { Config } from 'tailwindcss'

/**
 * Tailwind configuration for the Hero Pull mini app.
 *
 * This file enables dark mode by default and defines custom
 * colour palettes that map directly to the rarity levels used in
 * the game. By keeping the colours here you can fine‑tune the
 * glow effects of each card without touching component code.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        rarity: {
          common: '#9ca3af', // gray
          rare: '#3b82f6',   // blue
          epic: '#9333ea',   // purple
          legendary: '#eab308' // gold
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  },
  plugins: []
}

export default config