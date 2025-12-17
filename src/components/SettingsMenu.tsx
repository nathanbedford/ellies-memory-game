interface SettingsMenuProps {
  cardSize: number;
  autoSizeEnabled: boolean;
  useWhiteCardBackground: boolean;
  flipDuration: number;
  emojiSizePercentage: number;
  ttsEnabled: boolean;
  backgroundBlurEnabled: boolean;
  onIncreaseSize: () => void;
  onDecreaseSize: () => void;
  onToggleAutoSize: () => void;
  onToggleWhiteCardBackground: () => void;
  onIncreaseFlipDuration: () => void;
  onDecreaseFlipDuration: () => void;
  onIncreaseEmojiSize: () => void;
  onDecreaseEmojiSize: () => void;
  onToggleTtsEnabled: () => void;
  onToggleBackgroundBlur: () => void;
  onClose: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onEndTurn?: () => void;
  gameStatus?: 'setup' | 'playing' | 'finished';
  onEnableAdmin?: () => void;
  onShowPWAInstall?: () => void;
  onReloadApp: () => void;
}

export const SettingsMenu = ({ cardSize, autoSizeEnabled, useWhiteCardBackground, flipDuration, emojiSizePercentage, ttsEnabled, backgroundBlurEnabled, onIncreaseSize, onDecreaseSize, onToggleAutoSize, onToggleWhiteCardBackground, onIncreaseFlipDuration, onDecreaseFlipDuration, onIncreaseEmojiSize, onDecreaseEmojiSize, onToggleTtsEnabled, onToggleBackgroundBlur, onClose, onToggleFullscreen, isFullscreen, onEndTurn, gameStatus, onEnableAdmin, onShowPWAInstall, onReloadApp }: SettingsMenuProps) => {
  return (
    <div className="h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col">
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

      <div className="space-y-6 flex-1">
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

          {/* PWA Install Instructions Button - only show on iPad */}
          {onShowPWAInstall && (
            <button
              onClick={() => {
                onShowPWAInstall();
                onClose();
              }}
              className="w-full mt-3 flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 border border-blue-200"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-base font-medium text-blue-800">
                  Install as App
                </span>
              </div>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Background Blur Toggle */}
          <label className="flex items-center gap-3 px-4 py-3 mt-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 cursor-pointer">
            <input
              type="checkbox"
              checked={backgroundBlurEnabled}
              onChange={onToggleBackgroundBlur}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
            <div className="flex items-center gap-3 flex-1">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-base font-medium text-gray-800">
                Background Blur
              </span>
            </div>
          </label>
          <p className="text-xs text-gray-500 mt-2 px-4">
            Apply a subtle blur to the background during gameplay
          </p>
        </div>

        {/* Card Size Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Card Size {autoSizeEnabled && <span className="text-sm text-green-600 font-normal">(Auto)</span>}
          </h3>
          {autoSizeEnabled && (
            <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Auto-sizing is enabled. Cards automatically adjust to fit your screen.
              </p>
            </div>
          )}
          <div className="flex items-center gap-4">
            <button
              onClick={onDecreaseSize}
              disabled={autoSizeEnabled || cardSize <= 60}
              className="px-6 py-3 text-base font-semibold bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:transform-none"
              title={autoSizeEnabled ? "Disable auto-size to use manual controls" : "Make cards smaller"}
            >
              −
            </button>

            <div className="flex-1 text-center">
              <div className="text-sm text-gray-600 mb-1">Current Size</div>
              <div className="text-2xl font-bold text-gray-800">{cardSize}px</div>
            </div>

            <button
              onClick={onIncreaseSize}
              disabled={autoSizeEnabled || cardSize >= 300}
              className="px-6 py-3 text-base font-semibold bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:transform-none"
              title={autoSizeEnabled ? "Disable auto-size to use manual controls" : "Make cards bigger"}
            >
              +
            </button>
          </div>

          {/* Auto-Size Toggle */}
          <div className="mt-4">
            <label className="flex items-center gap-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSizeEnabled}
                onChange={onToggleAutoSize}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
              />
              <div className="flex items-center gap-3 flex-1">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="text-base font-medium text-gray-800">
                  Auto-Size Cards
                </span>
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-2 px-4">
              Automatically adjust card size to fit your screen
            </p>
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
            Announce turns and matches with card names
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

      {/* Reload App Button - pinned to bottom */}
      <div className="pt-4 mt-4 border-t border-gray-200">
        <button
          onClick={() => {
            onReloadApp();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span className="font-medium">Reload App</span>
        </button>
      </div>
    </div>
  );
};

