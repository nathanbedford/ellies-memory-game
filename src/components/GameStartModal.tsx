import { useState } from 'react';
import { Player } from '../types';

interface GameStartModalProps {
  players: Player[];
  currentPlayer: number;
  onStartGame: (firstPlayer: number) => void;
}

export const GameStartModal = ({ players, currentPlayer, onStartGame }: GameStartModalProps) => {
  const [selectedPlayer, setSelectedPlayer] = useState<1 | 2>(currentPlayer as 1 | 2);

  const handleStart = () => {
    onStartGame(selectedPlayer);
  };

  return (
    <div className="text-center space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Who Goes First?</h3>
        <p className="text-gray-600">Choose which player will start the game!</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => setSelectedPlayer(1)}
          className={`p-8 rounded-xl border-3 transition-all duration-300 transform hover:scale-105 ${
            selectedPlayer === 1
              ? 'border-blue-500 bg-blue-50 shadow-xl ring-4 ring-blue-200'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
          }`}
        >
          <div className="space-y-4">
            <div className="text-6xl">👤</div>
            <div className="text-xl font-bold text-blue-600">
              {players[0]?.name || 'Player 1'}
            </div>
            {selectedPlayer === 1 && (
              <div className="text-sm font-semibold text-blue-600 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Goes First
              </div>
            )}
          </div>
        </button>

        <button
          onClick={() => setSelectedPlayer(2)}
          className={`p-8 rounded-xl border-3 transition-all duration-300 transform hover:scale-105 ${
            selectedPlayer === 2
              ? 'border-green-500 bg-green-50 shadow-xl ring-4 ring-green-200'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
          }`}
        >
          <div className="space-y-4">
            <div className="text-6xl">👤</div>
            <div className="text-xl font-bold text-green-600">
              {players[1]?.name || 'Player 2'}
            </div>
            {selectedPlayer === 2 && (
              <div className="text-sm font-semibold text-green-600 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Goes First
              </div>
            )}
          </div>
        </button>
      </div>

      <button
        onClick={handleStart}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 text-lg shadow-lg transform hover:scale-[1.02]"
      >
        🎮 Start Game
      </button>
    </div>
  );
};
