"use client"

import { Hero } from '@/lib/heroes'

interface Props {
  hero: Hero
  opponent: Hero
  /**
   * The winner indicator. If 'hero', the user's hero wins. If 'opponent', the
   * opponent wins. If null, the battle is still in progress and animations
   * will play.
   */
  winner: 'hero' | 'opponent' | null
  onBattleAgain: () => void
  onShare: () => void
}

export default function BattleArena({ hero, opponent, winner, onBattleAgain, onShare }: Props) {
  const rarityBorder: Record<Hero['rarity'], string> = {
    Common: 'border-gray-500',
    Rare: 'border-blue-500 shadow-[0_0_12px_#60a5fa]',
    Epic: 'border-purple-500 shadow-[0_0_15px_#c084fc]',
    Legendary: 'border-yellow-400 shadow-[0_0_20px_#ffd700]',
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-8 max-w-sm mx-auto">
      {/* Cards and VS label */}
      <div className="flex flex-row items-center justify-center gap-2 w-full">
        <div
          className={`relative w-36 p-3 rounded-lg border-2 text-center bg-gray-900 ${
            winner === 'hero' ? 'winner-glow' : ''
          } ${!winner ? 'battle-shake' : ''} ${rarityBorder[hero.rarity]}`}
        >
          <h3 className="text-sm font-bold mb-1 truncate">{hero.name}</h3>

          <div className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 mx-auto mb-2 ${rarityBorder[hero.rarity]}`}>
            <img
              src={hero.imageUrl}
              alt={hero.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>

          <p className="text-sm">ATK: {hero.attack}</p>
          <p className="text-sm">DEF: {hero.defense}</p>
          <p className="text-sm">SPD: {hero.speed}</p>
        </div>

        <div className="text-xl font-bold text-red-500">VS</div>

        <div
          className={`relative w-36 p-3 rounded-lg border-2 text-center bg-gray-900 ${
            winner === 'opponent' ? 'winner-glow' : ''
          } ${!winner ? 'battle-shake' : ''} ${rarityBorder[opponent.rarity]}`}
        >
          <h3 className="text-sm font-bold mb-1 truncate">{opponent.name}</h3>

          <div className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 mx-auto mb-2 ${rarityBorder[opponent.rarity]}`}>
            <img
              src={opponent.imageUrl}
              alt={opponent.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>

          <p className="text-sm">ATK: {opponent.attack}</p>
          <p className="text-sm">DEF: {opponent.defense}</p>
          <p className="text-sm">SPD: {opponent.speed}</p>
        </div>
      </div>

      {/* Outcome message */}
      {winner && (
        <div className="text-xl font-semibold">{winner === 'hero' ? 'Victory! 🏆' : 'Defeat! 😢'}</div>
      )}

      {/* Control buttons */}
      {winner && (
        <div className="flex gap-4 mt-2">
          <button onClick={onBattleAgain} className="bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded">
            Battle Again
          </button>
          <button onClick={onShare} className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded">
            Share Result
          </button>
        </div>
      )}
    </div>
  )
}
