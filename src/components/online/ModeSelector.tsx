/**
 * ModeSelector - Choose between local and online game modes
 */

import type { GameMode } from '../../types';

interface ModeSelectorProps {
  onSelectMode: (mode: GameMode) => void;
}

export const ModeSelector = ({ onSelectMode }: ModeSelectorProps) => {
  return (
    <div className="text-center space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">How would you like to play?</h2>
        <p className="text-gray-600">Choose your game mode to get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* Local Mode */}
        <button
          onClick={() => onSelectMode('local')}
          className="p-8 rounded-xl border-3 border-gray-200 bg-white hover:border-blue-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group"
        >
          <div className="space-y-4">
            <div className="text-6xl">
              <span className="inline-block transition-transform group-hover:scale-110">
                {""}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Same Device</h3>
            <p className="text-gray-600 text-sm">
              Play with a friend on the same screen. Take turns finding matches together!
            </p>
          </div>
        </button>

        {/* Online Mode */}
        <button
          onClick={() => onSelectMode('online')}
          className="p-8 rounded-xl border-3 border-gray-200 bg-white hover:border-purple-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group"
        >
          <div className="space-y-4">
            <div className="text-6xl">
              <span className="inline-block transition-transform group-hover:scale-110">
                {""}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Play Online</h3>
            <p className="text-gray-600 text-sm">
              Challenge a friend over the internet. Share a room code to connect!
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
