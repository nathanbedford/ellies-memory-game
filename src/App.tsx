import { useEffect, useState } from 'react';
import { useMemoryGame } from './hooks/useMemoryGame';
import { useCardPacks } from './hooks/useCardPacks';
import { useBackgroundSelector, BackgroundTheme } from './hooks/useBackgroundSelector';
import { useCardBackSelector, CardBackType } from './hooks/useCardBackSelector';
import { GameBoard } from './components/GameBoard';
import { GameOver } from './components/GameOver';
import { Modal } from './components/Modal';
import { CardPackModal } from './components/CardPackModal';
import { BackgroundModal } from './components/BackgroundModal';
import { CardBackModal } from './components/CardBackModal';
import { GameStartModal } from './components/GameStartModal';
import { ResetConfirmationModal } from './components/ResetConfirmationModal';
import { SettingsMenu } from './components/SettingsMenu';
import { PlayerMatchesModal } from './components/PlayerMatchesModal';
import screenfull from 'screenfull';

type SetupStep = 'cardPack' | 'background' | 'cardBack' | 'startGame' | null;

function App() {
  const { selectedPack, setSelectedPack, getCurrentPackImages, cardPacks } = useCardPacks();
  const { gameState, cardSize, useWhiteCardBackground, flipDuration, emojiSizePercentage, initializeGame, startGameWithFirstPlayer, updatePlayerName, updatePlayerColor, increaseCardSize, decreaseCardSize, toggleWhiteCardBackground, increaseFlipDuration, decreaseFlipDuration, increaseEmojiSize, decreaseEmojiSize, flipCard, endTurn, resetGame, isAnimatingCards } = useMemoryGame();
  const { selectedBackground, setSelectedBackground, getCurrentBackground } = useBackgroundSelector();
  const { selectedCardBack, setSelectedCardBack, getCurrentCardBack } = useCardBackSelector();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [originalPack, setOriginalPack] = useState<string | null>(null);
  const [originalBackground, setOriginalBackground] = useState<BackgroundTheme | null>(null);
  const [originalCardBack, setOriginalCardBack] = useState<CardBackType | null>(null);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [lastConfig, setLastConfig] = useState<{
    pack: string;
    background: BackgroundTheme;
    cardBack: CardBackType;
    firstPlayer: number;
  } | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedPlayerForMatches, setSelectedPlayerForMatches] = useState<number | null>(null);

  // Handle replay initialization when pack changes
  useEffect(() => {
    if (isReplaying && lastConfig && selectedPack === lastConfig.pack) {
      const images = getCurrentPackImages;
      initializeGame(images, true);
      startGameWithFirstPlayer(lastConfig.firstPlayer);
      setIsReplaying(false);
    }
  }, [selectedPack, isReplaying, lastConfig, getCurrentPackImages, initializeGame, startGameWithFirstPlayer]);

  // Welcome screen shows when no cards exist and setupStep is null
  // User must click "Start Game" to begin setup flow

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(screenfull.isFullscreen);
    };

    if (screenfull.isEnabled) {
      screenfull.on('change', handleFullscreenChange);
      return () => {
        screenfull.off('change', handleFullscreenChange);
      };
    }
  }, []);

  const toggleFullscreen = () => {
    if (screenfull.isEnabled) {
      screenfull.toggle();
    }
  };

  const handlePackChange = (newPack: string) => {
    setSelectedPack(newPack as any);
    setSetupStep('background');
  };

  const handleBackgroundChange = (newBackground: BackgroundTheme) => {
    setSelectedBackground(newBackground);
    setSetupStep('cardBack');
  };

  const handleCardBackChange = (newCardBack: CardBackType) => {
    setSelectedCardBack(newCardBack);
    setSetupStep('startGame');
  };

  const handleResetClick = () => {
    // Store current configuration as last config
    setLastConfig({
      pack: selectedPack,
      background: selectedBackground,
      cardBack: selectedCardBack,
      firstPlayer: gameState.currentPlayer
    });
    setShowResetConfirmation(true);
  };

  const handleReplay = () => {
    // Replay with last configuration
    if (!lastConfig) return;
    
    resetGame();
    setSelectedPack(lastConfig.pack as any);
    setSelectedBackground(lastConfig.background);
    setSelectedCardBack(lastConfig.cardBack);
    setShowResetConfirmation(false);
    setIsReplaying(true);
  };

  const handleNewGame = () => {
    // Start new game setup flow
    setOriginalPack(selectedPack);
    setOriginalBackground(selectedBackground);
    setOriginalCardBack(selectedCardBack);
    setIsResetting(true);
    resetGame();
    setSetupStep('cardPack');
    setShowResetConfirmation(false);
  };

  const cancelSetupFlow = () => {
    // Restore original state if resetting
    if (isResetting) {
      if (originalPack !== null) {
        setSelectedPack(originalPack as any);
      }
      if (originalBackground !== null) {
        setSelectedBackground(originalBackground);
      }
      if (originalCardBack !== null) {
        setSelectedCardBack(originalCardBack);
      }
      setIsResetting(false);
    }
    setSetupStep(null);
  };

  const handleStartModalBack = () => {
    // Go back to card back selection
    setSetupStep('cardBack');
  };

  const handleCardBackModalBack = () => {
    // Go back to background selection
    setSetupStep('background');
  };

  const handleBackgroundModalBack = () => {
    // Go back to card pack selection
    setSetupStep('cardPack');
  };

  const handleStartGame = (firstPlayer: number) => {
    // Initialize game with animation and start playing
    const images = getCurrentPackImages;
    initializeGame(images, true); // true = start playing with animation
    startGameWithFirstPlayer(firstPlayer);
    setSetupStep(null);
    setIsResetting(false);
    localStorage.setItem('hasPlayedBefore', 'true');
    
    // Store configuration for replay
    setLastConfig({
      pack: selectedPack,
      background: selectedBackground,
      cardBack: selectedCardBack,
      firstPlayer
    });
  };

  // Prevent scrollbars during card animation
  useEffect(() => {
    if (isAnimatingCards) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAnimatingCards]);


  const currentBackground = getCurrentBackground();
  const backgroundStyle = currentBackground.imageUrl
    ? {
        backgroundImage: `url(${currentBackground.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {};
  const backgroundClass = currentBackground.imageUrl
    ? 'min-h-screen'
    : `min-h-screen bg-gradient-to-br ${currentBackground.gradient || ''}`;

  return (
    <div className={`${backgroundClass} ${gameState.gameStatus === 'playing' ? 'pt-4' : 'py-8'}`} style={backgroundStyle}>
      <div className="container mx-auto px-4 max-w-full">
        {gameState.gameStatus === 'setup' ? (
          <header className="text-center mb-8 relative">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Ellie's Memory Game</h1>
            <p className="text-gray-600">Two players take turns finding matching pairs!</p>
            
            {/* Fullscreen Button */}
            {screenfull.isEnabled && (
              <button
                onClick={toggleFullscreen}
                className="absolute top-0 right-0 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors duration-200"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            )}
          </header>
        ) : (
          <>
            {/* Fixed position controls */}
            {/* Left side - Reset Button */}
            <div className="fixed top-5 left-5 z-10">
              <button
                onClick={handleResetClick}
                className="p-3 text-base font-semibold bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
                title="Reset Game"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            {/* Right side - Settings Button */}
            <div className="fixed top-5 right-5 z-10">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-3 text-base font-semibold bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
                title="Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            
            {/* Settings Slide-over Menu */}
            <div
              className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
                isSettingsOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
                      <SettingsMenu
                        cardSize={cardSize}
                        useWhiteCardBackground={useWhiteCardBackground}
                        flipDuration={flipDuration}
                        emojiSizePercentage={emojiSizePercentage}
                        onIncreaseSize={increaseCardSize}
                        onDecreaseSize={decreaseCardSize}
                        onToggleWhiteCardBackground={toggleWhiteCardBackground}
                        onIncreaseFlipDuration={increaseFlipDuration}
                        onDecreaseFlipDuration={decreaseFlipDuration}
                        onIncreaseEmojiSize={increaseEmojiSize}
                        onDecreaseEmojiSize={decreaseEmojiSize}
                        onClose={() => setIsSettingsOpen(false)}
                        onToggleFullscreen={toggleFullscreen}
                        isFullscreen={isFullscreen}
                        onEndTurn={endTurn}
                        gameStatus={gameState.gameStatus}
                      />
            </div>
            
            {/* Backdrop when settings menu is open */}
            {isSettingsOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setIsSettingsOpen(false)}
              />
            )}
          </>
        )}

        <main>
          {/* Welcome Screen */}
          {gameState.cards.length === 0 && setupStep === null && (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-6">
                <h2 className="text-5xl font-bold text-gray-800 mb-4">Welcome!</h2>
                <p className="text-xl text-gray-600 mb-8">Ready to play Ellie's Memory Game?</p>
                <button
                  onClick={() => setSetupStep('cardPack')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 text-lg shadow-lg transform hover:scale-[1.02]"
                >
                  🎮 Start Game
                </button>
              </div>
            </div>
          )}

          {gameState.gameStatus === 'playing' && (
            <div className="flex flex-col gap-6 items-center w-full max-w-full">
              {/* Compact Header - Players Points and Current Player */}
              <div className="w-full max-w-2xl mx-auto">
                <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-lg shadow-lg p-3">
                  <div className="flex items-center justify-between">
              {/* Player 1 */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                gameState.currentPlayer === 1 
                  ? 'bg-opacity-90 ring-2' 
                  : 'bg-gray-50 bg-opacity-50'
              }`}
              style={gameState.currentPlayer === 1 ? {
                backgroundColor: `${gameState.players[0]?.color || '#3b82f6'}20`,
                '--tw-ring-color': gameState.players[0]?.color || '#3b82f6'
              } as React.CSSProperties & { '--tw-ring-color': string } : {}}
              >
                <span className="text-3xl text-gray-600 font-medium">{gameState.players[0]?.name || 'Player 1'}:</span>
                <button
                  onClick={() => setSelectedPlayerForMatches(1)}
                  className={`text-2xl font-bold cursor-pointer hover:opacity-75 transition-opacity ${gameState.currentPlayer === 1 ? '' : 'text-gray-400'}`}
                  style={gameState.currentPlayer === 1 ? { color: gameState.players[0]?.color || '#3b82f6' } : {}}
                  title="Click to view matches"
                >
                  {gameState.players[0]?.score || 0}
                </button>
                {gameState.currentPlayer === 1 && (
                  <div className="font-semibold flex flex-col items-center gap-1" style={{ color: gameState.players[0]?.color || '#3b82f6' }}>
                    <svg className="animate-pulse" fill="currentColor" viewBox="0 0 20 20" style={{ width: '30px', height: '30px' }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs">Turn</span>
                  </div>
                )}
              </div>

                    {/* VS Divider */}
                    <div className="text-gray-400 font-semibold px-3 text-sm">VS</div>

              {/* Player 2 */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                gameState.currentPlayer === 2 
                  ? 'bg-opacity-90 ring-2' 
                  : 'bg-gray-50 bg-opacity-50'
              }`}
              style={gameState.currentPlayer === 2 ? {
                backgroundColor: `${gameState.players[1]?.color || '#10b981'}20`,
                '--tw-ring-color': gameState.players[1]?.color || '#10b981'
              } as React.CSSProperties & { '--tw-ring-color': string } : {}}
              >
                <span className="text-3xl text-gray-600 font-medium">{gameState.players[1]?.name || 'Player 2'}:</span>
                <button
                  onClick={() => setSelectedPlayerForMatches(2)}
                  className={`text-2xl font-bold cursor-pointer hover:opacity-75 transition-opacity ${gameState.currentPlayer === 2 ? '' : 'text-gray-400'}`}
                  style={gameState.currentPlayer === 2 ? { color: gameState.players[1]?.color || '#10b981' } : {}}
                  title="Click to view matches"
                >
                  {gameState.players[1]?.score || 0}
                </button>
                {gameState.currentPlayer === 2 && (
                  <div className="font-semibold flex flex-col items-center gap-1" style={{ color: gameState.players[1]?.color || '#10b981' }}>
                    <svg className="animate-pulse" fill="currentColor" viewBox="0 0 20 20" style={{ width: '30px', height: '30px' }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs">Turn</span>
                  </div>
                )}
              </div>
                  </div>
                </div>
              </div>

              {/* Center Game Area - Full Width Below */}
              <div className="w-full flex justify-center">
                <GameBoard 
                  cards={gameState.cards} 
                  onCardClick={flipCard}
                  cardSize={cardSize}
                  isAnimating={isAnimatingCards}
                  useWhiteCardBackground={useWhiteCardBackground}
                  emojiSizePercentage={emojiSizePercentage}
                  cardBack={getCurrentCardBack()}
                />
              </div>
            </div>
          )}
        </main>

        {gameState.gameStatus === 'finished' && (gameState.winner || gameState.isTie) && (
          <GameOver 
            winner={gameState.winner} 
            players={gameState.players}
            isTie={gameState.isTie}
            onPlayAgain={handleResetClick} 
          />
        )}

        {/* Reset Confirmation Modal */}
        <Modal
          isOpen={showResetConfirmation}
          onClose={() => setShowResetConfirmation(false)}
          title="Reset Game"
        >
          <ResetConfirmationModal
            onReplay={handleReplay}
            onNewGame={handleNewGame}
            onCancel={() => setShowResetConfirmation(false)}
          />
        </Modal>

        {/* Game Start Modal */}
        <Modal
          isOpen={setupStep === 'startGame'}
          onClose={cancelSetupFlow}
          onBack={handleStartModalBack}
          title={isResetting ? "Step 4: Who Goes First?" : "Step 4: Who Goes First?"}
        >
          <GameStartModal
            players={gameState.players}
            currentPlayer={gameState.currentPlayer}
            onStartGame={handleStartGame}
            onPlayerNameChange={updatePlayerName}
            onPlayerColorChange={updatePlayerColor}
            onBack={handleStartModalBack}
            isResetting={isResetting}
          />
        </Modal>

        {/* Card Pack Modal */}
        <Modal
          isOpen={setupStep === 'cardPack'}
          onClose={cancelSetupFlow}
          title={isResetting ? "Step 1: Choose Your Card Pack" : "Step 1: Choose Your Card Pack"}
        >
          <CardPackModal
            cardPacks={cardPacks}
            selectedPack={selectedPack}
            onSelect={handlePackChange}
            onClose={cancelSetupFlow}
          />
        </Modal>

        {/* Background Modal */}
        <Modal
          isOpen={setupStep === 'background'}
          onClose={cancelSetupFlow}
          onBack={handleBackgroundModalBack}
          title={isResetting ? "Step 2: Choose Your Background" : "Step 2: Choose Your Background"}
        >
          <BackgroundModal
            selectedBackground={selectedBackground}
            onSelect={(bg) => handleBackgroundChange(bg as BackgroundTheme)}
            onClose={cancelSetupFlow}
            onBack={handleBackgroundModalBack}
            isResetting={isResetting}
          />
        </Modal>

        {/* Card Back Modal */}
        <Modal
          isOpen={setupStep === 'cardBack'}
          onClose={cancelSetupFlow}
          onBack={handleCardBackModalBack}
          title={isResetting ? "Step 3: Choose Your Card Back" : "Step 3: Choose Your Card Back"}
        >
          <CardBackModal
            selectedCardBack={selectedCardBack}
            onSelect={(cb) => handleCardBackChange(cb as CardBackType)}
            onClose={cancelSetupFlow}
            onBack={handleCardBackModalBack}
            isResetting={isResetting}
          />
        </Modal>

        {/* Player Matches Modal */}
        {selectedPlayerForMatches !== null && gameState.players[selectedPlayerForMatches - 1] && (
          <PlayerMatchesModal
            isOpen={selectedPlayerForMatches !== null}
            onClose={() => setSelectedPlayerForMatches(null)}
            player={gameState.players[selectedPlayerForMatches - 1]}
            cards={gameState.cards}
            cardSize={cardSize}
            useWhiteCardBackground={useWhiteCardBackground}
            emojiSizePercentage={emojiSizePercentage}
            cardBack={getCurrentCardBack()}
          />
        )}
      </div>
    </div>
  );
}

export default App;
