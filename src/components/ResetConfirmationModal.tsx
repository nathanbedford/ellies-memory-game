interface ResetConfirmationModalProps {
  onReplay: () => void;
  onNewGame: () => void;
  onChangeMode: () => void;
  onCancel: () => void;
  isOnlineMode?: boolean;
  isHost?: boolean;
}

export const ResetConfirmationModal = ({
  onReplay,
  onNewGame,
  onChangeMode,
  onCancel,
  isOnlineMode = false,
  isHost = true,
}: ResetConfirmationModalProps) => {
  // Guests in online mode can only leave - they can't restart or start new games
  const canStartGame = !isOnlineMode || isHost;

  return (
    <div className="text-center space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Reset Game</h3>
        <p className="text-gray-600">What would you like to do?</p>
      </div>

      {canStartGame ? (
        <div className="grid grid-cols-2 gap-4">
          {/* Replay Button */}
          <button
            type="button"
            onClick={onReplay}
            className="p-6 rounded-xl border-3 border-blue-500 bg-blue-50 hover:bg-blue-100 shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <div className="space-y-3">
              <div className="text-5xl">🔄</div>
              <div className="text-lg font-bold text-blue-600">Replay</div>
              <div className="text-xs text-gray-600">Same settings</div>
            </div>
          </button>

          {/* New Game Button */}
          <button
            type="button"
            onClick={onNewGame}
            className="p-6 rounded-xl border-3 border-purple-500 bg-purple-50 hover:bg-purple-100 shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <div className="space-y-3">
              <div className="text-5xl">🎮</div>
              <div className="text-lg font-bold text-purple-600">New Game</div>
              <div className="text-xs text-gray-600">New settings</div>
            </div>
          </button>
        </div>
      ) : (
        <div className="p-4 bg-gray-100 rounded-xl text-gray-600">
          <p>Only the host can start a new game.</p>
          <p className="text-sm mt-1">
            You can leave the room or wait for the host.
          </p>
        </div>
      )}

      {/* Change Mode / Leave Room Button - full width */}
      <button
        type="button"
        onClick={onChangeMode}
        className="w-full p-4 rounded-xl border-3 border-orange-500 bg-orange-50 hover:bg-orange-100 shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
      >
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl">{isOnlineMode ? "🚪" : "🔀"}</span>
          <div className="text-left">
            <div className="text-lg font-bold text-orange-600">
              {isOnlineMode ? "Leave Room" : "Change Mode"}
            </div>
            <div className="text-xs text-gray-600">
              {isOnlineMode
                ? "Exit the online room"
                : "Go back to local/online selection"}
            </div>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={onCancel}
        className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg transform hover:scale-[1.02]"
      >
        Cancel
      </button>
    </div>
  );
};
