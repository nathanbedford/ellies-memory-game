import { Player } from '../types';

interface GameOverProps {
  winner: Player;
  onPlayAgain: () => void;
}

export const GameOver = ({ winner, onPlayAgain }: GameOverProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 transform scale-100 transition-transform">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Over!</h2>
          <p className="text-xl text-gray-600 mb-6">
            {winner.name} wins with {winner.score} pairs!
          </p>
          <button
            onClick={onPlayAgain}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 transform hover:scale-105"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};
