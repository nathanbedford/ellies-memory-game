/**
 * OpponentDisconnectOverlay - Shows when opponent disconnects mid-game
 *
 * Displays a modal overlay with:
 * - Warning icon and disconnect message
 * - Countdown timer (60 seconds default)
 * - "Leave Game" button to exit cleanly
 *
 * Disappears automatically if opponent reconnects.
 */

interface OpponentDisconnectOverlayProps {
  isVisible: boolean;
  opponentName: string;
  secondsRemaining: number;
  onLeaveGame: () => void;
}

export const OpponentDisconnectOverlay = ({
  isVisible,
  opponentName,
  secondsRemaining,
  onLeaveGame,
}: OpponentDisconnectOverlayProps) => {
  if (!isVisible) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 transform scale-100 transition-transform">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="text-6xl mb-4">
            <span role="img" aria-label="warning">&#x26A0;&#xFE0F;</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {opponentName} Disconnected
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-4">
            Waiting for them to reconnect...
          </p>

          {/* Animated waiting indicator with countdown */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-gray-500 font-mono">
              {timeDisplay}
            </span>
          </div>

          {/* Helper text */}
          {secondsRemaining <= 0 && (
            <p className="text-sm text-orange-600 mb-4">
              You've waited long enough. Feel free to leave.
            </p>
          )}

          {/* Leave Game Button */}
          <button
            onClick={onLeaveGame}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 transform hover:scale-105"
          >
            Leave Game
          </button>

          {/* Subtle note */}
          <p className="text-xs text-gray-400 mt-4">
            The game will resume if they reconnect
          </p>
        </div>
      </div>
    </div>
  );
};
