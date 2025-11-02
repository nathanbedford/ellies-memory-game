import { useState } from 'react';
import { Player } from '../types';

interface GameStartModalProps {
  players: Player[];
  currentPlayer: number;
  onStartGame: (firstPlayer: number) => void;
  onPlayerNameChange?: (playerId: 1 | 2, newName: string) => void;
  onBack?: () => void;
  isResetting?: boolean;
}

export const GameStartModal = ({ players, currentPlayer, onStartGame, onPlayerNameChange, onBack, isResetting = false }: GameStartModalProps) => {
  const [selectedPlayer, setSelectedPlayer] = useState<1 | 2>(currentPlayer as 1 | 2);
  const [editingPlayer, setEditingPlayer] = useState<1 | 2 | null>(null);
  const [tempNames, setTempNames] = useState({
    1: players[0]?.name || 'Player 1',
    2: players[1]?.name || 'Player 2'
  });

  const handleStart = () => {
    // Apply any name changes before starting
    if (tempNames[1] !== players[0]?.name && onPlayerNameChange) {
      onPlayerNameChange(1, tempNames[1]);
    }
    if (tempNames[2] !== players[1]?.name && onPlayerNameChange) {
      onPlayerNameChange(2, tempNames[2]);
    }
    onStartGame(selectedPlayer);
  };

  const handleNameClick = (playerId: 1 | 2) => {
    setEditingPlayer(playerId);
  };

  const handleNameChange = (playerId: 1 | 2, newName: string) => {
    setTempNames(prev => ({
      ...prev,
      [playerId]: newName
    }));
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlayer && tempNames[editingPlayer].trim()) {
      setEditingPlayer(null);
    }
  };

  const handleNameCancel = () => {
    if (editingPlayer) {
      setTempNames(prev => ({
        ...prev,
        [editingPlayer]: editingPlayer === 1 ? players[0]?.name || 'Player 1' : players[1]?.name || 'Player 2'
      }));
      setEditingPlayer(null);
    }
  };

  return (
    <div className="text-center space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Who Goes First?</h3>
        <p className="text-gray-600">Choose which player will start the game!</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => !editingPlayer && setSelectedPlayer(1)}
          disabled={editingPlayer !== null}
          className={`p-8 rounded-xl border-3 transition-all duration-300 transform hover:scale-105 ${
            selectedPlayer === 1
              ? 'border-blue-500 bg-blue-50 shadow-xl ring-4 ring-blue-200'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
          } ${editingPlayer !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="space-y-4">
            <div className="text-6xl">👤</div>
            
            {/* Player 1 Name Input */}
            {editingPlayer === 1 ? (
              <form onSubmit={handleNameSubmit} className="space-y-2">
                <input
                  type="text"
                  value={tempNames[1]}
                  onChange={(e) => handleNameChange(1, e.target.value)}
                  onBlur={handleNameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      handleNameCancel();
                    }
                  }}
                  className="w-full px-3 py-2 text-xl font-bold text-center text-blue-600 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  maxLength={20}
                  autoFocus
                />
                <div className="text-xs text-gray-500">Press Enter or click away to save</div>
              </form>
            ) : (
              <div 
                onClick={() => handleNameClick(1)}
                className="text-xl font-bold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
                title="Click to edit name"
              >
                {tempNames[1]}
                <svg className="w-4 h-4 inline-block ml-1 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </div>
            )}
            
            {selectedPlayer === 1 && !editingPlayer && (
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
          onClick={() => !editingPlayer && setSelectedPlayer(2)}
          disabled={editingPlayer !== null}
          className={`p-8 rounded-xl border-3 transition-all duration-300 transform hover:scale-105 ${
            selectedPlayer === 2
              ? 'border-green-500 bg-green-50 shadow-xl ring-4 ring-green-200'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
          } ${editingPlayer !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="space-y-4">
            <div className="text-6xl">👤</div>
            
            {/* Player 2 Name Input */}
            {editingPlayer === 2 ? (
              <form onSubmit={handleNameSubmit} className="space-y-2">
                <input
                  type="text"
                  value={tempNames[2]}
                  onChange={(e) => handleNameChange(2, e.target.value)}
                  onBlur={handleNameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      handleNameCancel();
                    }
                  }}
                  className="w-full px-3 py-2 text-xl font-bold text-center text-green-600 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                  maxLength={20}
                  autoFocus
                />
                <div className="text-xs text-gray-500">Press Enter or click away to save</div>
              </form>
            ) : (
              <div 
                onClick={() => handleNameClick(2)}
                className="text-xl font-bold text-green-600 cursor-pointer hover:text-green-700 transition-colors"
                title="Click to edit name"
              >
                {tempNames[2]}
                <svg className="w-4 h-4 inline-block ml-1 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </div>
            )}
            
            {selectedPlayer === 2 && !editingPlayer && (
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

      <div className="flex gap-4">
        {isResetting && onBack && (
          <button
            onClick={onBack}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 text-lg shadow-lg transform hover:scale-[1.02]"
          >
            ← Back
          </button>
        )}
        
        <button
          onClick={handleStart}
          className={`font-bold py-4 px-8 rounded-lg transition-all duration-200 text-lg shadow-lg transform hover:scale-[1.02] ${
            isResetting && onBack ? 'flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' : 'w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
          } text-white`}
        >
          🎮 Start Game
        </button>
      </div>
    </div>
  );
};
