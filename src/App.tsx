import { useEffect, useRef, useState } from 'react';
import { useMemoryGame } from './hooks/useMemoryGame';
import { useCardPacks } from './hooks/useCardPacks';
import { GameBoard } from './components/GameBoard';
import { GameOver } from './components/GameOver';
import { CardPackSelector } from './components/CardPackSelector';
import screenfull from 'screenfull';

function App() {
  const { selectedPack, setSelectedPack, getCurrentPackImages, cardPacks } = useCardPacks();
  const { gameState, initializeGame, flipCard, resetGame } = useMemoryGame();
  const previousPackRef = useRef(selectedPack);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (previousPackRef.current !== selectedPack) {
      previousPackRef.current = selectedPack;
      const images = getCurrentPackImages;
      initializeGame(images);
    }
  }, [selectedPack, getCurrentPackImages, initializeGame]);

  // Initialize on first mount
  useEffect(() => {
    const images = getCurrentPackImages;
    initializeGame(images);
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
    setSelectedPack(newPack as any);
    resetGame();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
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

        <main className="flex gap-8 items-center justify-center">
          {/* Left Score Panel */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Player 1</h3>
              <div className={`text-3xl font-bold ${gameState.currentPlayer === 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                {gameState.players[0]?.score || 0}
              </div>
              {gameState.currentPlayer === 1 && (
                <div className="text-sm text-blue-600 mt-2">Current Turn</div>
              )}
            </div>
          </div>

          {/* Center Game Area */}
          <div className="flex-1 max-w-2xl">
            <div className="text-center mb-6">
              <CardPackSelector 
                selectedPack={selectedPack}
                onPackChange={handlePackChange}
                cardPacks={cardPacks}
              />
            </div>
            
            <GameBoard 
              cards={gameState.cards} 
              onCardClick={flipCard} 
            />

            <div className="text-center mt-8">
              <button
                onClick={resetGame}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
              >
                Reset Game
              </button>
            </div>
          </div>

          {/* Right Score Panel */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Player 2</h3>
              <div className={`text-3xl font-bold ${gameState.currentPlayer === 2 ? 'text-green-600' : 'text-gray-400'}`}>
                {gameState.players[1]?.score || 0}
              </div>
              {gameState.currentPlayer === 2 && (
                <div className="text-sm text-green-600 mt-2">Current Turn</div>
              )}
            </div>
          </div>
        </main>

        {gameState.gameStatus === 'finished' && gameState.winner && (
          <GameOver 
            winner={gameState.winner} 
            onPlayAgain={resetGame} 
          />
        )}
      </div>
    </div>
  );
}

export default App;
