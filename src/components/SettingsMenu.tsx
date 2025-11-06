interface SettingsMenuProps {
  cardSize: number;
  useWhiteCardBackground: boolean;
  flipDuration: number;
  emojiSizePercentage: number;
  ttsEnabled: boolean;
  onIncreaseSize: () => void;
  onDecreaseSize: () => void;
  onToggleWhiteCardBackground: () => void;
  onIncreaseFlipDuration: () => void;
  onDecreaseFlipDuration: () => void;
  onIncreaseEmojiSize: () => void;
  onDecreaseEmojiSize: () => void;
  onToggleTtsEnabled: () => void;
  onClose: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onEndTurn?: () => void;
  gameStatus?: 'setup' | 'playing' | 'finished';
  onEnableAdmin?: () => void;
}

export const SettingsMenu = ({ cardSize, useWhiteCardBackground, flipDuration, emojiSizePercentage, ttsEnabled, onIncreaseSize, onDecreaseSize, onToggleWhiteCardBackground, onIncreaseFlipDuration, onDecreaseFlipDuration, onIncreaseEmojiSize, onDecreaseEmojiSize, onToggleTtsEnabled, onClose, onToggleFullscreen, isFullscreen, onEndTurn, gameStatus, onEnableAdmin }: SettingsMenuProps) => {
  return (
    <div className="h-full bg-white shadow-2xl p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          title="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {/* Fullscreen Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Display</h3>
          <button
            onClick={onToggleFullscreen}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isFullscreen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                )}
              </svg>
              <span className="text-base font-medium text-gray-800">
                {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              </span>
            </div>
          </button>
        </div>

        {/* Card Size Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Card Size</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={onDecreaseSize}
              disabled={cardSize <= 60}
              className="px-6 py-3 text-base font-semibold bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:transform-none"
              title="Make cards smaller"
            >
              −
            </button>
            
            <div className="flex-1 text-center">
              <div className="text-sm text-gray-600 mb-1">Current Size</div>
              <div className="text-2xl font-bold text-gray-800">{cardSize}px</div>
            </div>
            
            <button
              onClick={onIncreaseSize}
              disabled={cardSize >= 300}
              className="px-6 py-3 text-base font-semibold bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:transform-none"
              title="Make cards bigger"
            >
              +
            </button>
          </div>
        </div>

        {/* Card Background Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Card Appearance</h3>
          <label className="flex items-center gap-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 cursor-pointer">
            <input
              type="checkbox"
              checked={useWhiteCardBackground}
              onChange={onToggleWhiteCardBackground}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
            <div className="flex items-center gap-3 flex-1">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span className="text-base font-medium text-gray-800">
                White Background
              </span>
            </div>
          </label>
        </div>

        {/* Voice Announcements Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Audio</h3>
          <label className="flex items-center gap-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 cursor-pointer">
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={onToggleTtsEnabled}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
            <div className="flex items-center gap-3 flex-1">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <span className="text-base font-medium text-gray-800">
                Voice Announcements
              </span>
            </div>
          </label>
          <p className="text-xs text-gray-500 mt-2 px-4">
            Announce whose turn it is after each pair is picked
          </p>
        </div>

        {/* Flip Duration Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Card Flip Duration</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={onDecreaseFlipDuration}
              disabled={flipDuration <= 500}
              className="px-6 py-3 text-base font-semibold bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:transform-none"
              title="Make flip duration shorter"
            >
              −
            </button>
            
            <div className="flex-1 text-center">
              <div className="text-sm text-gray-600 mb-1">Current Duration</div>
              <div className="text-2xl font-bold text-gray-800">{flipDuration / 1000}s</div>
            </div>
            
            <button
              onClick={onIncreaseFlipDuration}
              disabled={flipDuration >= 10000}
              className="px-6 py-3 text-base font-semibold bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:transform-none"
              title="Make flip duration longer"
            >
              +
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            How long cards stay flipped before checking for a match
          </p>
        </div>

        {/* Emoji Size Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Emoji Size</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={onDecreaseEmojiSize}
              disabled={emojiSizePercentage <= 20}
              className="px-6 py-3 text-base font-semibold bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:transform-none"
              title="Make emojis smaller"
            >
              −
            </button>
            
            <div className="flex-1 text-center">
              <div className="text-sm text-gray-600 mb-1">Current Size</div>
              <div className="text-2xl font-bold text-gray-800">{emojiSizePercentage}%</div>
            </div>
            
            <button
              onClick={onIncreaseEmojiSize}
              disabled={emojiSizePercentage >= 150}
              className="px-6 py-3 text-base font-semibold bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:transform-none"
              title="Make emojis bigger"
            >
              +
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Size of emojis relative to card size
          </p>
        </div>

        {/* Game Actions Section */}
        {onEndTurn && gameStatus === 'playing' && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Game Actions</h3>
            <button
              onClick={() => {
                onEndTurn();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span>End Turn</span>
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Flip all cards face down and switch to the next player
            </p>
          </div>
        )}

        {/* Admin link - placed at bottom with spacing to require scrolling */}
        {onEnableAdmin && (
          <div className="border-t border-gray-200 pt-6 pb-8 mt-8">
            <div className="pt-16 pb-8">
              <button
                onClick={() => {
                  onEnableAdmin();
                  onClose();
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200 underline"
              >
                Admin
              </button>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

