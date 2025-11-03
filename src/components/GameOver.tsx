import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player } from '../types';

interface GameOverProps {
  winner: Player | null;
  players: Player[];
  isTie: boolean;
  onPlayAgain: () => void;
  onExploreCards: () => void;
}

export const GameOver = ({ winner, players, isTie, onPlayAgain, onExploreCards }: GameOverProps) => {
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
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 transform scale-100 transition-transform">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Over!</h2>
          {isTie ? (
            <div className="mb-6">
              <p className="text-xl text-gray-600 mb-2">
                It's a tie! Both players win! 🎊
              </p>
              <p className="text-lg text-gray-500">
                {players[0]?.name} and {players[1]?.name} both scored {players[0]?.score} pairs!
              </p>
            </div>
          ) : (
            <p className="text-xl text-gray-600 mb-6">
              {winner?.name} wins with {winner?.score} pairs!
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
          </div>
        </div>
      </div>
    </div>
  );
};
