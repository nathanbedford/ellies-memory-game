/**
 * ModeSelector - Choose between local and online game modes
 */

import { Link } from '@tanstack/react-router';
import type { GameMode } from '../../types';

interface ModeSelectorProps {
  onSelectMode: (mode: GameMode) => void;
}

export const ModeSelector = ({ onSelectMode }: ModeSelectorProps) => {
  return (
    <div className="text-center space-y-8">
      <div>
        <h2 className="text-4xl font-bold text-gray-800 mb-2">Welcome to Matchimus!</h2>
        <p className="text-xl text-gray-600">How would you like to play?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* Local Mode */}
        <button
          type="button"
          onClick={() => onSelectMode('local')}
          className="p-8 rounded-xl border-3 border-gray-200 bg-white hover:border-blue-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group"
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg className="w-16 h-16 text-blue-500 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 64 64" aria-label="Same device icon">
                <title>Same device icon</title>
                {/* Monitor */}
                <rect x="8" y="8" width="48" height="36" rx="3" strokeWidth={2.5} />
                <path strokeLinecap="round" strokeWidth={2.5} d="M8 38h48" />
                <path strokeLinecap="round" strokeWidth={2.5} d="M26 44v6M38 44v6M22 50h20" />
                {/* Player 1 - left side */}
                <circle cx="22" cy="22" r="4" strokeWidth={2} fill="currentColor" fillOpacity={0.2} />
                <path strokeLinecap="round" strokeWidth={2} d="M15 34c0-4 3-6 7-6s7 2 7 6" />
                {/* Player 2 - right side */}
                <circle cx="42" cy="22" r="4" strokeWidth={2} fill="currentColor" fillOpacity={0.2} />
                <path strokeLinecap="round" strokeWidth={2} d="M35 34c0-4 3-6 7-6s7 2 7 6" />
                {/* Divider line between players */}
                <path strokeLinecap="round" strokeWidth={1.5} strokeDasharray="3 2" d="M32 14v20" opacity={0.5} />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Same Device</h3>
            <p className="text-gray-600 text-sm">
              Play with a friend on the same screen. Take turns finding matches together!
            </p>
          </div>
        </button>

        {/* Online Mode */}
        <button
          type="button"
          onClick={() => onSelectMode('online')}
          className="p-8 rounded-xl border-3 border-gray-200 bg-white hover:border-purple-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group"
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg className="w-16 h-16 text-purple-500 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 64 64" aria-label="Play online icon">
                <title>Play online icon</title>
                {/* Globe */}
                <circle cx="32" cy="32" r="18" strokeWidth={2} />
                <ellipse cx="32" cy="32" rx="8" ry="18" strokeWidth={1.5} />
                <path strokeLinecap="round" strokeWidth={1.5} d="M14 32h36" />
                <path strokeLinecap="round" strokeWidth={1.5} d="M17 22h30M17 42h30" />
                {/* Device 1 - top left with signal */}
                <rect x="4" y="4" width="14" height="10" rx="2" strokeWidth={2} fill="currentColor" fillOpacity={0.15} />
                <circle cx="11" cy="9" r="1.5" fill="currentColor" />
                {/* Signal waves from device 1 */}
                <path strokeLinecap="round" strokeWidth={1.5} d="M20 10c2 2 3 4 4 7" opacity={0.6} />
                <path strokeLinecap="round" strokeWidth={1.5} d="M17 14c3 2 5 5 6 9" opacity={0.4} />
                {/* Device 2 - bottom right with signal */}
                <rect x="46" y="50" width="14" height="10" rx="2" strokeWidth={2} fill="currentColor" fillOpacity={0.15} />
                <circle cx="53" cy="55" r="1.5" fill="currentColor" />
                {/* Signal waves from device 2 */}
                <path strokeLinecap="round" strokeWidth={1.5} d="M44 54c-2-2-3-4-4-7" opacity={0.6} />
                <path strokeLinecap="round" strokeWidth={1.5} d="M47 50c-3-2-5-5-6-9" opacity={0.4} />
                {/* Connection sparkles */}
                <circle cx="32" cy="14" r="2" fill="currentColor" fillOpacity={0.8} />
                <circle cx="32" cy="50" r="2" fill="currentColor" fillOpacity={0.8} />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Play Online</h3>
            <p className="text-gray-600 text-sm">
              Challenge a friend over the internet. Share a room code to connect!
            </p>
          </div>
        </button>
      </div>

      <footer className="mt-12 text-center text-sm text-gray-400">
        <Link to="/terms" className="hover:text-gray-600 transition-colors">
          Terms
        </Link>
        <span className="mx-2">·</span>
        <Link to="/privacy" className="hover:text-gray-600 transition-colors">
          Privacy
        </Link>
      </footer>
    </div>
  );
};
