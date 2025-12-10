import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player, Card } from '../types';
import { getPlayerScore } from '../services/game/GameEngine';

interface GameOverProps {
  winner: Player | null;
  players: Player[];
  cards: Card[];
  isTie: boolean;
  onPlayAgain: () => void;
  onExploreCards: () => void;
  onViewBackground: () => void;
  onClose: () => void;
}

export const GameOver = ({ winner, players, cards, isTie, onPlayAgain, onExploreCards, onViewBackground, onClose }: GameOverProps) => {
  useEffect(() => {
    // Full-screen confetti celebration
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Launch confetti from left and right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 transform scale-100 transition-transform relative">
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
          type="button"
          title="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Over!</h2>
          {isTie ? (
            <div className="mb-6">
              <p className="text-xl text-gray-600 mb-2">
                It's a tie! Both players win! 🎊
              </p>
              <p className="text-lg text-gray-500">
                {players.find(p => p.id === 1)?.name || 'Player 1'} and {players.find(p => p.id === 2)?.name || 'Player 2'} both scored {getPlayerScore(cards, 1)} pairs!
              </p>
            </div>
          ) : (
            <p className="text-xl text-gray-600 mb-6">
              {winner?.name} wins with {winner ? getPlayerScore(cards, winner.id) : 0} pairs!
            </p>
          )}
          <div className="flex flex-col gap-3">
            <button
              onClick={onPlayAgain}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 transform hover:scale-105"
            >
              Play Again
            </button>
            <button
              onClick={onExploreCards}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 transform hover:scale-105"
            >
              Explore All Cards
            </button>
            <button
              type="button"
              onClick={onViewBackground}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 transform hover:scale-105"
            >
              View Background
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
