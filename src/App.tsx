import { useEffect, useRef, useState } from 'react';
import { useMemoryGame } from './hooks/useMemoryGame';
import { useCardPacks } from './hooks/useCardPacks';
import { useBackgroundSelector, BackgroundTheme } from './hooks/useBackgroundSelector';
import { GameBoard } from './components/GameBoard';
import { GameOver } from './components/GameOver';
import { PlayerNameEditor } from './components/PlayerNameEditor';
import { Modal } from './components/Modal';
import { CardPackModal } from './components/CardPackModal';
import { BackgroundModal } from './components/BackgroundModal';
import { GameStartModal } from './components/GameStartModal';
import screenfull from 'screenfull';

function App() {
  const { selectedPack, setSelectedPack, getCurrentPackImages, cardPacks } = useCardPacks();
  const { gameState, showStartModal, setShowStartModal, cardSize, initializeGame, startGameWithFirstPlayer, updatePlayerName, increaseCardSize, decreaseCardSize, flipCard, resetGame } = useMemoryGame();
  const { selectedBackground, setSelectedBackground, getCurrentBackground } = useBackgroundSelector();
  const previousPackRef = useRef(selectedPack);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCardPackModalOpen, setIsCardPackModalOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [originalPack, setOriginalPack] = useState<string | null>(null);
  const [originalBackground, setOriginalBackground] = useState<BackgroundTheme | null>(null);

  useEffect(() => {
    if (previousPackRef.current !== selectedPack) {
      previousPackRef.current = selectedPack;
      const images = getCurrentPackImages;
      initializeGame(images);
    }
  }, [selectedPack, getCurrentPackImages, initializeGame]);

  // Initialize on first mount - only show modal if no cards exist
  useEffect(() => {
    const images = getCurrentPackImages;
    if (gameState.cards.length === 0) {
      initializeGame(images, true); // true = show modal
    } else {
      initializeGame(images, false); // false = don't show modal, just initialize
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (isResetting) {
      // During reset flow, just update the selection but don't apply yet
      setSelectedPack(newPack as any);
      setIsCardPackModalOpen(false);
      setIsBackgroundModalOpen(true);
    } else {
      setSelectedPack(newPack as any);
      setIsCardPackModalOpen(false);
      resetGame();
    }
  };

  const handleBackgroundChange = (newBackground: BackgroundTheme) => {
    if (isResetting) {
      // During reset flow, just update the selection but don't apply yet
      setSelectedBackground(newBackground);
      setIsBackgroundModalOpen(false);
      // Show start modal without initializing game yet
      setShowStartModal(true);
    } else {
      setSelectedBackground(newBackground);
      setIsBackgroundModalOpen(false);
    }
  };

  const handleResetClick = () => {
    // Store original state when reset starts
    setOriginalPack(selectedPack);
    setOriginalBackground(selectedBackground);
    setIsResetting(true);
    setIsCardPackModalOpen(true);
  };

  const cancelResetFlow = () => {
    // Restore original state
    if (originalPack !== null) {
      setSelectedPack(originalPack as any);
    }
    if (originalBackground !== null) {
      setSelectedBackground(originalBackground);
    }
    setIsResetting(false);
    setIsCardPackModalOpen(false);
    setIsBackgroundModalOpen(false);
    setShowStartModal(false);
  };

  const handleStartModalBack = () => {
    // Go back to background selection
    setShowStartModal(false);
    setIsBackgroundModalOpen(true);
  };

  const handleBackgroundModalBack = () => {
    // Go back to card pack selection
    setIsBackgroundModalOpen(false);
    setIsCardPackModalOpen(true);
  };


  return (
    <div className={`min-h-screen bg-gradient-to-br ${getCurrentBackground()} py-8`}>
      <div className="container mx-auto px-4">
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
          <header className="text-center mb-4">
            <div className="flex justify-center items-center gap-3">
              {/* Decrease Size Button */}
              <button
                onClick={decreaseCardSize}
                disabled={cardSize <= 60}
                className="px-4 py-3 text-base font-semibold bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                title="Make cards smaller"
              >
                −
              </button>
              
              {/* Reset Button */}
              <button
                onClick={handleResetClick}
                className="px-6 py-3 text-base font-semibold bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
              >
                🔄 Reset Game
              </button>
              
              {/* Increase Size Button */}
              <button
                onClick={increaseCardSize}
                disabled={cardSize >= 150}
                className="px-4 py-3 text-base font-semibold bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                title="Make cards bigger"
              >
                +
              </button>
            </div>
            
            {/* Size Indicator */}
            <div className="text-sm text-gray-600 mt-2">
              Card Size: {cardSize}px
            </div>
          </header>
        )}

        <main>
          {gameState.gameStatus === 'playing' && (
            <div className="flex gap-8 items-center justify-center">
              {/* Left Score Panel */}
              <div className="w-48 flex-shrink-0">
                <div className={`bg-white rounded-lg shadow-lg p-6 transition-all duration-300 ${
                  gameState.currentPlayer === 1 
                    ? 'ring-4 ring-blue-300 ring-opacity-75 shadow-2xl transform scale-105' 
                    : ''
                }`}>
                  <PlayerNameEditor
                    playerId={1}
                    initialName={gameState.players[0]?.name || 'Player 1'}
                    onSave={updatePlayerName}
                    className="mb-4"
                  />
                  <div className={`text-3xl font-bold ${gameState.currentPlayer === 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                    {gameState.players[0]?.score || 0}
                  </div>
                  {gameState.currentPlayer === 1 && (
                    <div className="text-sm text-blue-600 mt-2 flex items-center justify-center gap-1">
                      <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Current Turn
                    </div>
                  )}
                </div>
              </div>

              {/* Center Game Area */}
              <div className="flex-1">
                <GameBoard 
                  cards={gameState.cards} 
                  onCardClick={flipCard}
                  cardSize={cardSize}
                />
              </div>

              {/* Right Score Panel */}
              <div className="w-48 flex-shrink-0">
                <div className={`bg-white rounded-lg shadow-lg p-6 transition-all duration-300 ${
                  gameState.currentPlayer === 2 
                    ? 'ring-4 ring-green-300 ring-opacity-75 shadow-2xl transform scale-105' 
                    : ''
                }`}>
                  <PlayerNameEditor
                    playerId={2}
                    initialName={gameState.players[1]?.name || 'Player 2'}
                    onSave={updatePlayerName}
                    className="mb-4"
                  />
                  <div className={`text-3xl font-bold ${gameState.currentPlayer === 2 ? 'text-green-600' : 'text-gray-400'}`}>
                    {gameState.players[1]?.score || 0}
                  </div>
                  {gameState.currentPlayer === 2 && (
                    <div className="text-sm text-green-600 mt-2 flex items-center justify-center gap-1">
                      <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Current Turn
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {gameState.gameStatus === 'finished' && gameState.winner && (
          <GameOver 
            winner={gameState.winner} 
            onPlayAgain={resetGame} 
          />
        )}

        {/* Game Start Modal */}
        <Modal
          isOpen={showStartModal}
          onClose={() => {
            // Cancel the reset flow or go back to setup
            if (isResetting) {
              cancelResetFlow();
            } else {
              setShowStartModal(false);
            }
          }}
          onBack={isResetting ? handleStartModalBack : () => setShowStartModal(false)}
          title={isResetting ? "Step 3: Who Goes First?" : "Who Goes First?"}
        >
          <GameStartModal
            players={gameState.players}
            currentPlayer={gameState.currentPlayer}
            onStartGame={(firstPlayer) => {
              if (isResetting) {
                // Now apply all the changes: initialize game and start
                const images = getCurrentPackImages;
                initializeGame(images, false);
                resetGame();
                startGameWithFirstPlayer(firstPlayer);
                setIsResetting(false);
              } else {
                startGameWithFirstPlayer(firstPlayer);
              }
            }}
            onPlayerNameChange={updatePlayerName}
            onBack={handleStartModalBack}
            isResetting={isResetting}
          />
        </Modal>

        {/* Card Pack Modal */}
        <Modal
          isOpen={isCardPackModalOpen}
          onClose={() => {
            if (isResetting) {
              cancelResetFlow();
            } else {
              setIsCardPackModalOpen(false);
            }
          }}
          title={isResetting ? "Step 1: Choose Your Card Pack" : "Choose Your Card Pack"}
        >
          <CardPackModal
            cardPacks={cardPacks}
            selectedPack={selectedPack}
            onSelect={handlePackChange}
            onClose={() => setIsCardPackModalOpen(false)}
          />
        </Modal>

        {/* Background Modal */}
        <Modal
          isOpen={isBackgroundModalOpen}
          onClose={() => {
            if (isResetting) {
              cancelResetFlow();
            } else {
              setIsBackgroundModalOpen(false);
            }
          }}
          onBack={isResetting ? handleBackgroundModalBack : undefined}
          title={isResetting ? "Step 2: Choose Your Background" : "Choose Your Background"}
        >
          <BackgroundModal
            selectedBackground={selectedBackground}
            onSelect={(bg) => handleBackgroundChange(bg as BackgroundTheme)}
            onClose={() => {
              setIsBackgroundModalOpen(false);
              if (isResetting) {
                // Move to start modal
                setShowStartModal(true);
              }
            }}
            onBack={handleBackgroundModalBack}
            isResetting={isResetting}
          />
        </Modal>
      </div>
    </div>
  );
}

export default App;
