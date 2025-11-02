interface ResetConfirmationModalProps {
  onReplay: () => void;
  onNewGame: () => void;
  onCancel: () => void;
}

export const ResetConfirmationModal = ({ onReplay, onNewGame, onCancel }: ResetConfirmationModalProps) => {
  return (
    <div className="text-center space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Reset Game</h3>
        <p className="text-gray-600">What would you like to do?</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Replay Button */}
        <button
          onClick={onReplay}
          className="p-8 rounded-xl border-3 border-blue-500 bg-blue-50 hover:bg-blue-100 shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          <div className="space-y-4">
            <div className="text-6xl">🔄</div>
            <div className="text-xl font-bold text-blue-600">Replay</div>
            <div className="text-sm text-gray-600">Use same settings</div>
          </div>
        </button>

        {/* New Game Button */}
        <button
          onClick={onNewGame}
          className="p-8 rounded-xl border-3 border-purple-500 bg-purple-50 hover:bg-purple-100 shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          <div className="space-y-4">
            <div className="text-6xl">🎮</div>
            <div className="text-xl font-bold text-purple-600">New Game</div>
            <div className="text-sm text-gray-600">Choose new settings</div>
          </div>
        </button>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 text-lg shadow-lg transform hover:scale-[1.02]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

