import { useState, useCallback, useRef, useEffect } from 'react';
import type { Card, Player, GameState } from '../types';
import { useTextToSpeech } from './useTextToSpeech';

// Helper function to ensure players are always sorted by ID (1, then 2)
const sortPlayersByID = (players: Player[]): Player[] => {
  return [...players].sort((a, b) => a.id - b.id);
};

// Helper function to get player by ID
const getPlayerById = (players: Player[], id: number): Player | undefined => {
  return players.find(p => p.id === id);
};

export const useMemoryGame = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Try to load saved game state from sessionStorage
    const savedGameState = sessionStorage.getItem('gameState');
    if (savedGameState) {
      try {
        const parsed = JSON.parse(savedGameState);
        // Validate that we have a valid game state with cards
        if (parsed && parsed.cards && Array.isArray(parsed.cards) && parsed.cards.length > 0) {
          // Clean up transient states that shouldn't persist (like animation states)
          const cleanedCards = parsed.cards.map((card: Card) => ({
            ...card,
            isFlyingToPlayer: false, // Don't persist animation state
            // Keep isFlipped and isMatched as they represent actual game state
          }));
          
          const players = parsed.players && Array.isArray(parsed.players) && parsed.players.length >= 2
            ? sortPlayersByID(parsed.players)
            : [
                { id: 1, name: 'Player 1', score: 0, color: '#3b82f6' },
                { id: 2, name: 'Player 2', score: 0, color: '#10b981' }
              ];
          
          return {
            cards: cleanedCards,
            players,
            currentPlayer: parsed.currentPlayer || 1,
            selectedCards: [], // Reset selected cards on reload
            gameStatus: parsed.gameStatus || 'setup',
            winner: parsed.winner || null,
            isTie: parsed.isTie || false
          };
        }
      } catch (e) {
        console.warn('Failed to load saved game state:', e);
      }
    }
    
    // Load player names from localStorage (fallback)
    const savedPlayer1Name = localStorage.getItem('player1Name') || 'Player 1';
    const savedPlayer2Name = localStorage.getItem('player2Name') || 'Player 2';
    const savedPlayer1Color = localStorage.getItem('player1Color') || '#3b82f6'; // Default blue
    const savedPlayer2Color = localStorage.getItem('player2Color') || '#10b981'; // Default green
    const savedFirstPlayer = parseInt(localStorage.getItem('firstPlayer') || '1') as 1 | 2;

    const initialPlayers: Player[] = [
      { id: 1, name: savedPlayer1Name, score: 0, color: savedPlayer1Color },
      { id: 2, name: savedPlayer2Name, score: 0, color: savedPlayer2Color }
    ];

    return {
      cards: [],
      players: initialPlayers,
      currentPlayer: savedFirstPlayer,
      selectedCards: [],
      gameStatus: 'setup',
      winner: null,
      isTie: false
    };
  });

  const [showStartModal, setShowStartModal] = useState(false);
  const [cardSize, setCardSize] = useState(() => {
    // Load card size from localStorage
    const savedCardSize = localStorage.getItem('cardSize');
    return savedCardSize ? parseInt(savedCardSize, 10) : 100;
  });
  const [autoSizeEnabled, setAutoSizeEnabled] = useState(() => {
    // Load auto-size preference from localStorage, default to true
    const saved = localStorage.getItem('autoSizeEnabled');
    return saved === null ? true : saved === 'true';
  });
  const [layoutMetrics, setLayoutMetrics] = useState({
    boardWidth: 0,
    boardAvailableHeight: 0,
    scoreboardHeight: 0
  });
  const [useWhiteCardBackground, setUseWhiteCardBackground] = useState(() => {
    // Load white card background preference from localStorage
    const saved = localStorage.getItem('useWhiteCardBackground');
    return saved === 'true'; // Default to false (use colorized backgrounds)
  });
  const [isAnimatingCards, setIsAnimatingCards] = useState(false);
  const isInitialLoadRef = useRef(true);
  const matchCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCheckingMatchRef = useRef(false);
  const [flipDuration, setFlipDuration] = useState(() => {
    // Load flip duration from localStorage, default to 2000ms (2 seconds)
    const saved = localStorage.getItem('flipDuration');
    return saved ? parseInt(saved, 10) : 2000;
  });
  const [emojiSizePercentage, setEmojiSizePercentage] = useState(() => {
    // Load emoji size percentage from localStorage, default to 72 (matches current default: 0.4 * 1.8 = 0.72)
    const saved = localStorage.getItem('emojiSizePercentage');
    return saved ? parseInt(saved, 10) : 72;
  });

  const [ttsEnabled, setTtsEnabled] = useState(() => {
    // Load TTS enabled preference from localStorage, default to true
    const saved = localStorage.getItem('ttsEnabled');
    return saved === null ? true : saved === 'true';
  });

  const [allCardsFlipped, setAllCardsFlipped] = useState(false);

  // Initialize text-to-speech
  const { speakPlayerTurn, speakMatchFound, isAvailable, cancel: cancelTTS } = useTextToSpeech();
  const ttsDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateAutoSizeMetrics = useCallback((metrics: { boardWidth: number; boardAvailableHeight: number; scoreboardHeight: number }) => {
    setLayoutMetrics(prev => {
      const roundedPrev = {
        boardWidth: Math.round(prev.boardWidth),
        boardAvailableHeight: Math.round(prev.boardAvailableHeight),
        scoreboardHeight: Math.round(prev.scoreboardHeight)
      };
      const roundedNext = {
        boardWidth: Math.round(metrics.boardWidth),
        boardAvailableHeight: Math.round(metrics.boardAvailableHeight),
        scoreboardHeight: Math.round(metrics.scoreboardHeight)
      };

      if (
        roundedPrev.boardWidth === roundedNext.boardWidth &&
        roundedPrev.boardAvailableHeight === roundedNext.boardAvailableHeight &&
        roundedPrev.scoreboardHeight === roundedNext.scoreboardHeight
      ) {
        return prev;
      }

      return metrics;
    });
  }, []);

  const calculateOptimalCardSize = useCallback((cardCount: number, metricsOverride?: { boardWidth: number; boardAvailableHeight: number; scoreboardHeight: number }) => {
    if (!autoSizeEnabled || cardCount === 0) {
      return Math.min(Math.max(cardSize, 60), 300);
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const horizontalPadding = 80;
    const gapSize = 8;
    const totalHorizontalGaps = 7 * gapSize;

    // Use provided metrics override, or fall back to state layoutMetrics
    const metrics = metricsOverride || layoutMetrics;

    // Use measured width if available, otherwise calculate from viewport
    const measuredBoardWidth = metrics.boardWidth > 0 ? metrics.boardWidth : 0;
    const effectiveBoardWidth = Math.max(measuredBoardWidth || viewportWidth - horizontalPadding, 0);

    const actualRows = Math.max(Math.ceil(cardCount / 8), 1);
    const widthForCards = Math.max(effectiveBoardWidth - totalHorizontalGaps, actualRows);
    const maxWidthBasedSize = Math.floor(widthForCards / 8);

    const totalVerticalGaps = (actualRows - 1) * gapSize;
    const safetyMargin = 10;

    // Use measured metrics if available, otherwise use viewport-based fallback
    // Scoreboard is typically ~90px + padding + gap, so reserve ~150px to be safe
    const scoreboardReserve = metrics.scoreboardHeight > 0
      ? metrics.scoreboardHeight + 50
      : 150;
    
    // Calculate available height: use measured if available, otherwise viewport minus reserve
    // When measured metrics aren't available, be more conservative with the reserve
    const measuredAvailableHeight = metrics.boardAvailableHeight > 0
      ? metrics.boardAvailableHeight
      : Math.max(viewportHeight - scoreboardReserve - 20, actualRows); // Extra 20px buffer when using fallback
    
    const effectiveAvailableHeight = Math.max(measuredAvailableHeight - safetyMargin, actualRows);
    const heightForCards = Math.max(effectiveAvailableHeight - totalVerticalGaps, actualRows);
    const maxHeightBasedSize = Math.floor(heightForCards / actualRows);

    const optimalSize = Math.min(
      300,
      Math.max(60, Math.min(maxWidthBasedSize, maxHeightBasedSize))
    );

    console.log('[AUTO-SIZE] Calculated optimal size', {
      cardCount,
      actualRows,
      viewportWidth,
      viewportHeight,
      availableWidth: effectiveBoardWidth,
      availableHeight: effectiveAvailableHeight,
      totalVerticalGaps,
      maxWidthBasedSize,
      maxHeightBasedSize,
      optimalSize,
      verticalReserved: scoreboardReserve,
      usingMeasuredMetrics: metrics.boardWidth > 0 || metrics.boardAvailableHeight > 0,
      metricsOverrideProvided: !!metricsOverride
    });

    return optimalSize;
  }, [autoSizeEnabled, cardSize, layoutMetrics]);

  // Exported function for calculating card size based on card count
  // Can be called externally (e.g., when pack is selected) before cards are created
  // Optional metricsOverride allows passing measured metrics directly to bypass state timing issues
  const calculateOptimalCardSizeForCount = useCallback((cardCount: number, metricsOverride?: { boardWidth: number; boardAvailableHeight: number; scoreboardHeight: number }) => {
    if (!autoSizeEnabled || cardCount === 0) {
      return;
    }

    const optimalSize = calculateOptimalCardSize(cardCount, metricsOverride);
    if (optimalSize !== cardSize) {
      setCardSize(optimalSize);
      localStorage.setItem('cardSize', optimalSize.toString());
    }
  }, [autoSizeEnabled, calculateOptimalCardSize, cardSize]);

  useEffect(() => {
    if (!autoSizeEnabled || gameState.cards.length === 0) return;

    const optimalSize = calculateOptimalCardSize(gameState.cards.length);
    if (optimalSize !== cardSize) {
      setCardSize(optimalSize);
      localStorage.setItem('cardSize', optimalSize.toString());
    }
  }, [autoSizeEnabled, calculateOptimalCardSize, cardSize, gameState.cards.length]);

  // Save game state to sessionStorage whenever it changes
  useEffect(() => {
    // Only save if we have cards (game is in progress or finished)
    if (gameState.cards.length > 0) {
      // Create a clean state without transient animation properties
      const stateToSave = {
        ...gameState,
        cards: gameState.cards.map(card => ({
          id: card.id,
          imageId: card.imageId,
          imageUrl: card.imageUrl,
          gradient: card.gradient,
          isFlipped: card.isFlipped,
          isMatched: card.isMatched,
          matchedByPlayerId: card.matchedByPlayerId
          // Exclude isFlyingToPlayer and flyingToPlayerId as they're transient
        })),
        players: sortPlayersByID(gameState.players) // Ensure players are sorted before saving
      };
      sessionStorage.setItem('gameState', JSON.stringify(stateToSave));
    } else {
      // Clear saved state if no cards (game reset or not started)
      sessionStorage.removeItem('gameState');
    }
  }, [gameState]);

  const initializeGame = useCallback((images: { id: string; url: string; gradient?: string }[], startPlaying: boolean = false) => {
    // Cancel any pending match check
    if (matchCheckTimeoutRef.current) {
      clearTimeout(matchCheckTimeoutRef.current);
      matchCheckTimeoutRef.current = null;
    }
    isCheckingMatchRef.current = false;
    
    const cards: Card[] = [];
    
    // Note: Card size is calculated in handleStartGame before initializeGame is called
    // with measured metrics passed directly to avoid state timing issues

    // Create pairs of cards
    images.forEach((image, index) => {
      cards.push({
        id: `card-${index * 2}`,
        imageId: image.id,
        imageUrl: image.url,
        gradient: image.gradient,
        isFlipped: false,
        isMatched: false
      });
      cards.push({
        id: `card-${index * 2 + 1}`,
        imageId: image.id,
        imageUrl: image.url,
        gradient: image.gradient,
        isFlipped: false,
        isMatched: false
      });
    });

    // Shuffle cards
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);

    if (startPlaying) {
      // Start animation sequence
      setIsAnimatingCards(true);
      setGameState(prev => ({
        ...prev,
        cards: shuffledCards,
        selectedCards: [],
        gameStatus: 'playing',
        winner: null,
        isTie: false
      }));
      
      // After animation completes, mark animation as done
      // 900ms per card animation + 30ms delay between cards
      const totalAnimationTime = shuffledCards.length * 30 + 900;
      setTimeout(() => {
        setIsAnimatingCards(false);
      }, totalAnimationTime);
    } else {
      setGameState(prev => ({
        ...prev,
        cards: shuffledCards,
        selectedCards: [],
        gameStatus: 'setup',
        winner: null,
        isTie: false
      }));
    }
  }, []);

  const startGame = useCallback((player1Name: string, player2Name: string, firstPlayer: number) => {
    const savedPlayer1Color = localStorage.getItem('player1Color') || '#3b82f6';
    const savedPlayer2Color = localStorage.getItem('player2Color') || '#10b981';
    const players = sortPlayersByID([
      { id: 1, name: player1Name, score: 0, color: savedPlayer1Color },
      { id: 2, name: player2Name, score: 0, color: savedPlayer2Color }
    ]);
    setGameState({
      cards: [],
      players,
      currentPlayer: firstPlayer,
      selectedCards: [],
      gameStatus: 'setup',
      winner: null,
      isTie: false
    });
    // Don't show modal yet - wait for cards to be initialized
  }, []);

  const startGameWithFirstPlayer = useCallback((firstPlayer: number) => {
    setGameState(prev => {
      const firstPlayerName = prev.players.find(p => p.id === firstPlayer)?.name || `Player ${firstPlayer}`;
      
      // Announce first player's turn after a short delay
      if (ttsEnabled && isAvailable()) {
        setTimeout(() => {
          speakPlayerTurn(firstPlayerName);
        }, 400);
      }
      
      return {
        ...prev,
        currentPlayer: firstPlayer,
        gameStatus: 'playing' as const
      };
    });
    setShowStartModal(false);
    localStorage.setItem('firstPlayer', firstPlayer.toString());
    isInitialLoadRef.current = false;
  }, [speakPlayerTurn, isAvailable, ttsEnabled]);

  const showStartGameModal = useCallback(() => {
    console.log('showStartGameModal called'); // Debug log
    setShowStartModal(true);
  }, []);

  const increaseCardSize = useCallback(() => {
    setCardSize(prev => {
      const newSize = Math.min(prev + 10, 300); // Max 300px
      localStorage.setItem('cardSize', newSize.toString());
      return newSize;
    });
  }, []);

  const decreaseCardSize = useCallback(() => {
    setCardSize(prev => {
      const newSize = Math.max(prev - 10, 60); // Min 60px
      localStorage.setItem('cardSize', newSize.toString());
      return newSize;
    });
  }, []);

  const toggleWhiteCardBackground = useCallback(() => {
    setUseWhiteCardBackground(prev => {
      const newValue = !prev;
      localStorage.setItem('useWhiteCardBackground', newValue.toString());
      return newValue;
    });
  }, []);

  const toggleAutoSize = useCallback(() => {
    setAutoSizeEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('autoSizeEnabled', newValue.toString());
      return newValue;
    });
  }, []);

  const updatePlayerName = useCallback((playerId: 1 | 2, newName: string) => {
    // Save to localStorage
    localStorage.setItem(`player${playerId}Name`, newName.trim());
    
    setGameState(prev => ({
      ...prev,
      players: sortPlayersByID(prev.players.map(player =>
        player.id === playerId ? { ...player, name: newName.trim() } : player
      ))
    }));
  }, []);

  const updatePlayerColor = useCallback((playerId: 1 | 2, newColor: string) => {
    // Save to localStorage
    localStorage.setItem(`player${playerId}Color`, newColor);
    
    setGameState(prev => ({
      ...prev,
      players: sortPlayersByID(prev.players.map(player =>
        player.id === playerId ? { ...player, color: newColor } : player
      ))
    }));
  }, []);

  const resetGame = useCallback(() => {
    // Cancel any pending match check
    if (matchCheckTimeoutRef.current) {
      clearTimeout(matchCheckTimeoutRef.current);
      matchCheckTimeoutRef.current = null;
    }
    // Cancel any pending TTS
    if (ttsDelayTimeoutRef.current) {
      clearTimeout(ttsDelayTimeoutRef.current);
      ttsDelayTimeoutRef.current = null;
    }
    cancelTTS();
    isCheckingMatchRef.current = false;
    setAllCardsFlipped(false);
    
    // Clear saved game state from sessionStorage
    sessionStorage.removeItem('gameState');
    
    // Reset clears cards and goes back to setup mode
    // The actual reset flow will be handled by App.tsx
    setGameState(prev => {
      const player1 = getPlayerById(prev.players, 1);
      const player2 = getPlayerById(prev.players, 2);
      const players = sortPlayersByID([
        { id: 1, name: player1?.name || 'Player 1', score: 0, color: player1?.color || '#3b82f6' },
        { id: 2, name: player2?.name || 'Player 2', score: 0, color: player2?.color || '#10b981' }
      ]);
      return {
        ...prev,
        cards: [],
        players,
        selectedCards: [],
        gameStatus: 'setup',
        winner: null,
        isTie: false
      };
    });
  }, [cancelTTS]);

  const checkForMatch = useCallback((selectedIds: string[]) => {
    // Prevent duplicate match checks
    if (isCheckingMatchRef.current) {
      console.log('[MATCH CHECK] Match check already in progress, ignoring duplicate call', JSON.stringify({ selectedIds }));
      return;
    }
    
    isCheckingMatchRef.current = true;
    matchCheckTimeoutRef.current = null;
    
    console.log('[MATCH CHECK] Starting match check', JSON.stringify({ selectedIds, timestamp: new Date().toISOString() }));
    
    setGameState(prev => {
      const [firstId, secondId] = selectedIds;
      
      // Verify the cards are still selected (prevent race conditions)
      if (prev.selectedCards.length !== 2 || 
          !prev.selectedCards.includes(firstId) || 
          !prev.selectedCards.includes(secondId)) {
        console.log('[MATCH CHECK] Cards no longer selected, ignoring', JSON.stringify({
          selectedIds,
          currentSelectedCards: prev.selectedCards
        }));
        isCheckingMatchRef.current = false;
        return prev;
      }
      
      const firstCard = prev.cards.find(c => c.id === firstId);
      const secondCard = prev.cards.find(c => c.id === secondId);

      console.log('[MATCH CHECK] Cards found', JSON.stringify({ 
        firstCard: firstCard ? { id: firstCard.id, imageId: firstCard.imageId, isFlipped: firstCard.isFlipped, isMatched: firstCard.isMatched } : null,
        secondCard: secondCard ? { id: secondCard.id, imageId: secondCard.imageId, isFlipped: secondCard.isFlipped, isMatched: secondCard.isMatched } : null
      }));

      if (!firstCard || !secondCard) {
        console.warn('[MATCH CHECK] Cards not found!', JSON.stringify({ firstId, secondId, availableCardIds: prev.cards.map(c => c.id) }));
        isCheckingMatchRef.current = false;
        return prev;
      }

      const isMatch = firstCard.imageId === secondCard.imageId;
      console.log('[MATCH CHECK] Match result', JSON.stringify({ isMatch, imageId1: firstCard.imageId, imageId2: secondCard.imageId }));
      
      let newCards = prev.cards;
      let newPlayers = [...prev.players];
      let nextPlayer = prev.currentPlayer;

      if (isMatch) {
        console.log('[MATCH CHECK] ✓ MATCH FOUND! Marking cards as flying to player', JSON.stringify({
          cardIds: [firstId, secondId],
          playerId: prev.currentPlayer,
          playerName: prev.players.find(p => p.id === prev.currentPlayer)?.name
        }));
        
        // Mark cards as flying to player (will animate to player's name)
        newCards = prev.cards.map(c =>
          c.id === firstId || c.id === secondId
            ? { ...c, isFlipped: true, isFlyingToPlayer: true, flyingToPlayerId: prev.currentPlayer }
            : c
        );
        
        // Verify cards were marked correctly
        const flyingCards = newCards.filter(c => c.isFlyingToPlayer);
        console.log('[MATCH CHECK] Cards marked as flying', JSON.stringify({
          flyingCardsCount: flyingCards.length,
          flyingCards: flyingCards.map(c => ({
            id: c.id,
            isFlyingToPlayer: c.isFlyingToPlayer,
            flyingToPlayerId: c.flyingToPlayerId
          }))
        }));
        
        // Increment current player's score
        newPlayers = sortPlayersByID(prev.players.map(p =>
          p.id === prev.currentPlayer
            ? { ...p, score: p.score + 1 }
            : p
        ));
        
        // Capture the player ID who matched these cards
        const matchedByPlayerId = prev.currentPlayer;
        
        // Announce match found immediately (don't wait for animation)
        if (ttsEnabled && isAvailable()) {
          // Cancel any pending TTS
          if (ttsDelayTimeoutRef.current) {
            clearTimeout(ttsDelayTimeoutRef.current);
          }
          ttsDelayTimeoutRef.current = setTimeout(() => {
            const matchedPlayerName = prev.players.find(p => p.id === matchedByPlayerId)?.name || `Player ${matchedByPlayerId}`;
            speakMatchFound(matchedPlayerName);
            ttsDelayTimeoutRef.current = null;
          }, 400); // Small delay to let visual feedback register
        }
        
        // After animation completes, mark as matched
        setTimeout(() => {
          console.log('[MATCH CHECK] Animation timeout fired, marking cards as matched', JSON.stringify({
            cardIds: [firstId, secondId],
            matchedByPlayerId,
            timestamp: new Date().toISOString()
          }));

          setGameState(prevState => {
            const beforeMatch = prevState.cards.filter(c => c.isMatched).length;
            const updatedCards = prevState.cards.map(c =>
              c.id === firstId || c.id === secondId
                ? { ...c, isMatched: true, isFlyingToPlayer: false, matchedByPlayerId }
                : c
            );
            const afterMatch = updatedCards.filter(c => c.isMatched).length;

            console.log('[MATCH CHECK] Cards marked as matched', JSON.stringify({
              beforeMatchCount: beforeMatch,
              afterMatchCount: afterMatch,
              matchedCardIds: updatedCards.filter(c => c.isMatched).map(c => c.id)
            }));

            const filteredSelectedCards = prevState.selectedCards.filter(
              id => id !== firstId && id !== secondId
            );

            // Check if game is finished after cards are marked as matched
            const allMatched = updatedCards.every(c => c.isMatched);
            if (allMatched) {
              // Find the player with the highest score
              const winner = prevState.players.reduce((prevPlayer, currentPlayer) =>
                currentPlayer.score > prevPlayer.score ? currentPlayer : prevPlayer
              );

              // Check if it's a tie
              const isTie = prevState.players.every(player => player.score === winner.score);

              return {
                ...prevState,
                cards: updatedCards,
                selectedCards: filteredSelectedCards,
                gameStatus: 'finished' as const,
                winner: isTie ? null : winner,
                isTie
              };
            }

            return {
              ...prevState,
              cards: updatedCards,
              selectedCards: filteredSelectedCards
            };
          });
        }, 1000); // Match animation duration (matches CSS animation length)
      } else {
        // Flip cards back and switch player
        console.log('[MATCH CHECK] ✗ NO MATCH - Flipping cards back', JSON.stringify({
          cardIds: [firstId, secondId],
          currentPlayer: prev.currentPlayer,
          nextPlayer: prev.currentPlayer === 1 ? 2 : 1
        }));
        
        newCards = prev.cards.map(c => {
          if (c.id === firstId || c.id === secondId) {
            console.log('[MATCH CHECK] Flipping card back', JSON.stringify({
              cardId: c.id,
              wasFlipped: c.isFlipped,
              willBeFlipped: false
            }));
            return { ...c, isFlipped: false };
          }
          return c;
        });
        
        nextPlayer = prev.currentPlayer === 1 ? 2 : 1;
        
        // Verify cards were flipped back
        const flippedBackCards = newCards.filter(c => (c.id === firstId || c.id === secondId) && !c.isFlipped);
        console.log('[MATCH CHECK] Cards flipped back verification', JSON.stringify({
          expectedCount: 2,
          actualCount: flippedBackCards.length,
          cardStates: newCards.filter(c => c.id === firstId || c.id === secondId).map(c => ({
            id: c.id,
            isFlipped: c.isFlipped,
            isMatched: c.isMatched
          }))
        }));
      }

      const newState = {
        ...prev,
        cards: [...newCards], // Ensure new array reference
        players: newPlayers,
        currentPlayer: nextPlayer,
        selectedCards: []
      };
      
      console.log('[MATCH CHECK] State update complete', JSON.stringify({
        cardsCount: newState.cards.length,
        flippedCardsCount: newState.cards.filter(c => c.isFlipped && !c.isFlyingToPlayer && !c.isMatched).length,
        matchedCardsCount: newState.cards.filter(c => c.isMatched).length,
        currentPlayer: newState.currentPlayer,
        selectedCardsCount: newState.selectedCards.length
      }));

      // Announce next player's turn if no match was found
      if (!isMatch && ttsEnabled && isAvailable()) {
        // Cancel any pending TTS
        if (ttsDelayTimeoutRef.current) {
          clearTimeout(ttsDelayTimeoutRef.current);
        }
        // Announce immediately after determining no match (don't wait for flip animation)
        ttsDelayTimeoutRef.current = setTimeout(() => {
          const nextPlayerName = newPlayers.find(p => p.id === nextPlayer)?.name || `Player ${nextPlayer}`;
          speakPlayerTurn(nextPlayerName);
          ttsDelayTimeoutRef.current = null;
        }, 400); // Small delay to let visual feedback register
      }

      // Reset the checking flag after state update completes
      // Use requestAnimationFrame to ensure React has rendered the update
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isCheckingMatchRef.current = false;
        });
      });

      return newState;
    });
  }, [speakPlayerTurn, speakMatchFound, isAvailable, ttsEnabled]);

  const endTurn = useCallback(() => {
    // Cancel any pending match check
    if (matchCheckTimeoutRef.current) {
      clearTimeout(matchCheckTimeoutRef.current);
      matchCheckTimeoutRef.current = null;
    }
    // Cancel any pending TTS
    if (ttsDelayTimeoutRef.current) {
      clearTimeout(ttsDelayTimeoutRef.current);
      ttsDelayTimeoutRef.current = null;
    }
    cancelTTS();
    isCheckingMatchRef.current = false;
    
    setGameState(prev => {
      // Find all stuck flying cards (cards that are flying but stuck)
      const flyingCards = prev.cards.filter(c => c.isFlyingToPlayer);
      
      // Group flying cards by imageId to find pairs
      const flyingByImageId: { [key: string]: Card[] } = {};
      flyingCards.forEach(card => {
        if (!flyingByImageId[card.imageId]) {
          flyingByImageId[card.imageId] = [];
        }
        flyingByImageId[card.imageId].push(card);
      });
      
      // Find stuck pairs (cards with same imageId that are both flying)
      const stuckPairIds = new Set<string>();
      Object.values(flyingByImageId).forEach(cards => {
        if (cards.length >= 2) {
          // These are pairs that should be matched
          for (const c of cards) {
            stuckPairIds.add(c.id);
          }
        }
      });
      
      // Process cards: fix stuck matches and flip back non-matched cards
      const newCards = prev.cards.map(c => {
        // If card is stuck flying and part of a pair, mark it as matched
        if (c.isFlyingToPlayer && stuckPairIds.has(c.id)) {
          console.log('[END TURN] Fixing stuck matched card', JSON.stringify({
            cardId: c.id,
            imageId: c.imageId
          }));
          return { ...c, isMatched: true, isFlyingToPlayer: false, isFlipped: false };
        }
        
        // If card is stuck flying but not part of a pair, clear flying state and flip back
        if (c.isFlyingToPlayer && !stuckPairIds.has(c.id)) {
          console.log('[END TURN] Clearing stuck flying card (not a pair)', JSON.stringify({
            cardId: c.id,
            imageId: c.imageId
          }));
          return { ...c, isFlyingToPlayer: false, isFlipped: false };
        }
        
        // Flip all other face-up cards back (except matched ones)
        if (c.isFlipped && !c.isMatched) {
          return { ...c, isFlipped: false };
        }
        
        return c;
      });
      
      // Switch to next player
      const nextPlayer = prev.currentPlayer === 1 ? 2 : 1;
      
      const stuckFlyingCount = flyingCards.length;
      const stuckPairsFixed = stuckPairIds.size / 2;
      
      console.log('[END TURN] Manually ending turn', JSON.stringify({
        previousPlayer: prev.currentPlayer,
        nextPlayer,
        flippedCardsCount: prev.cards.filter(c => c.isFlipped && !c.isMatched).length,
        stuckFlyingCount,
        stuckPairsFixed,
        timestamp: new Date().toISOString()
      }));
      
      return {
        ...prev,
        cards: [...newCards], // Ensure new array reference
        currentPlayer: nextPlayer,
        selectedCards: []
      };
    });
  }, [cancelTTS]);

  const increaseFlipDuration = useCallback(() => {
    setFlipDuration(prev => {
      const newDuration = Math.min(prev + 500, 10000); // Max 10 seconds
      localStorage.setItem('flipDuration', newDuration.toString());
      return newDuration;
    });
  }, []);

  const decreaseFlipDuration = useCallback(() => {
    setFlipDuration(prev => {
      const newDuration = Math.max(prev - 500, 500); // Min 0.5 seconds
      localStorage.setItem('flipDuration', newDuration.toString());
      return newDuration;
    });
  }, []);

  const increaseEmojiSize = useCallback(() => {
    setEmojiSizePercentage(prev => {
      const newPercentage = Math.min(prev + 5, 150); // Max 150%
      localStorage.setItem('emojiSizePercentage', newPercentage.toString());
      return newPercentage;
    });
  }, []);

  const decreaseEmojiSize = useCallback(() => {
    setEmojiSizePercentage(prev => {
      const newPercentage = Math.max(prev - 5, 20); // Min 20%
      localStorage.setItem('emojiSizePercentage', newPercentage.toString());
      return newPercentage;
    });
  }, []);

  const toggleTtsEnabled = useCallback(() => {
    setTtsEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('ttsEnabled', newValue.toString());
      // Cancel any ongoing TTS when disabling
      if (!newValue) {
        cancelTTS();
        if (ttsDelayTimeoutRef.current) {
          clearTimeout(ttsDelayTimeoutRef.current);
          ttsDelayTimeoutRef.current = null;
        }
      }
      return newValue;
    });
  }, [cancelTTS]);

  const flipCard = useCallback((cardId: string) => {
    // Prevent card flips during match checks to avoid race conditions
    if (isCheckingMatchRef.current) {
      console.log('[FLIP CARD] Match check in progress, ignoring card click', JSON.stringify({
        cardId,
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    setGameState(prev => {
      console.log('[FLIP CARD] Card clicked', JSON.stringify({
        cardId,
        gameStatus: prev.gameStatus,
        selectedCardsCount: prev.selectedCards.length,
        selectedCards: prev.selectedCards,
        timestamp: new Date().toISOString()
      }));
      
      if (prev.gameStatus !== 'playing') {
        console.log('[FLIP CARD] Game not playing, ignoring');
        return prev;
      }
      
      // Check if any cards are currently flying to a player
      const flyingCards = prev.cards.filter(c => c.isFlyingToPlayer);
      if (flyingCards.length > 0) {
        console.log('[FLIP CARD] Cards are currently flying to player, proceeding with new selection', JSON.stringify({
          flyingCardsCount: flyingCards.length,
          flyingCardIds: flyingCards.map(c => c.id)
        }));
      }
      
      // Additional guard: prevent flipping if we have 2 selected cards and match check might be pending
      if (prev.selectedCards.length >= 2) {
        console.log('[FLIP CARD] Already have 2 cards selected, ignoring');
        return prev;
      }
      
      const card = prev.cards.find(c => c.id === cardId);
      if (!card || card.isFlipped || card.isMatched) {
        console.log('[FLIP CARD] Card invalid or already flipped/matched', JSON.stringify({
          cardFound: !!card,
          isFlipped: card?.isFlipped,
          isMatched: card?.isMatched
        }));
        return prev;
      }
      
      if (prev.selectedCards.length >= 2) {
        console.log('[FLIP CARD] Already have 2 cards selected, ignoring');
        return prev;
      }

      const newCards = prev.cards.map(c =>
        c.id === cardId ? { ...c, isFlipped: true } : c
      );
      
      const newSelectedCards = [...prev.selectedCards, cardId];
      console.log('[FLIP CARD] Card flipped, new selected cards', JSON.stringify({
        newSelectedCards,
        willCheckMatch: newSelectedCards.length === 2
      }));

      // Check for match when two cards are selected
      if (newSelectedCards.length === 2) {
        // Cancel any existing match check timeout
        if (matchCheckTimeoutRef.current) {
          console.log('[FLIP CARD] Cancelling existing match check timeout');
          clearTimeout(matchCheckTimeoutRef.current);
          matchCheckTimeoutRef.current = null;
        }
        
        console.log('[FLIP CARD] Scheduling match check', JSON.stringify({
          selectedCards: newSelectedCards,
          duration: flipDuration
        }));
        matchCheckTimeoutRef.current = setTimeout(() => {
          console.log('[FLIP CARD] Match check timeout fired, calling checkForMatch');
          matchCheckTimeoutRef.current = null;
          checkForMatch(newSelectedCards);
        }, flipDuration);
      }

      return {
        ...prev,
        cards: newCards,
        selectedCards: newSelectedCards
      };
    });
  }, [checkForMatch, flipDuration]);

  const endGameEarly = useCallback(() => {
    setGameState(prev => {
      if (prev.gameStatus !== 'playing' || prev.cards.length === 0) {
        return prev;
      }

      // Find the player with the highest score
      const winner = prev.players.reduce((prevPlayer, currentPlayer) =>
        currentPlayer.score > prevPlayer.score ? currentPlayer : prevPlayer
      );

      // Check if it's a tie
      const isTie = prev.players.every(player => player.score === winner.score);

      return {
        ...prev,
        gameStatus: 'finished' as const,
        winner: isTie ? null : winner,
        isTie,
        selectedCards: []
      };
    });
  }, []);

  const toggleAllCardsFlipped = useCallback(() => {
    setGameState(prev => {
      if (prev.cards.length === 0) return prev;

      // Check if all unmatched cards are currently flipped
      const unmatchedCards = prev.cards.filter(c => !c.isMatched && !c.isFlyingToPlayer);
      const allFlipped = unmatchedCards.length > 0 && unmatchedCards.every(c => c.isFlipped);
      const newFlippedState = !allFlipped;
      
      setAllCardsFlipped(newFlippedState);

      const newCards = prev.cards.map(card => {
        // Don't flip matched cards or cards that are currently flying
        if (card.isMatched || card.isFlyingToPlayer) {
          return card;
        }
        return { ...card, isFlipped: newFlippedState };
      });

      return {
        ...prev,
        cards: newCards,
        selectedCards: [] // Clear selected cards when toggling
      };
    });
  }, []);

  // Test function: Advance game to end state - flip all cards except last pair, mark them as matched, and distribute evenly between players
  const flipAllExceptLastPair = useCallback(() => {
    setGameState(prev => {
      if (prev.cards.length === 0) return prev;
      
      // Find the last pair (cards with the same imageId that appear last)
      const lastPairImageId = prev.cards[prev.cards.length - 1]?.imageId;
      if (!lastPairImageId) return prev;
      
      // Get all cards that should be matched (all except the last pair)
      const cardsToMatch: Card[] = [];
      
      prev.cards.forEach(card => {
        if (card.imageId !== lastPairImageId && !card.isMatched) {
          cardsToMatch.push(card);
        }
      });
      
      // Group cards by imageId to get pairs
      const cardPairs: { [imageId: string]: Card[] } = {};
      cardsToMatch.forEach(card => {
        if (!cardPairs[card.imageId]) {
          cardPairs[card.imageId] = [];
        }
        cardPairs[card.imageId].push(card);
      });
      
      // Get complete pairs only (should be exactly 2 cards each)
      const pairs = Object.values(cardPairs).filter(pair => pair.length === 2);
      
      // Create a map of card ID to assigned player ID
      const cardToPlayerMap = new Map<string, number>();
      
      // Distribute pairs evenly between players
      pairs.forEach((pair, index) => {
        const assignedPlayer = (index % 2 === 0) ? 1 : 2;
        // Assign both cards in the pair to the same player
        pair.forEach(card => {
          cardToPlayerMap.set(card.id, assignedPlayer);
        });
      });
      
      // Update cards
      const newCards = prev.cards.map(card => {
        // Keep the last pair unflipped and unmatched
        if (card.imageId === lastPairImageId) {
          return { ...card, isFlipped: false, isMatched: false };
        }
        
        // If already matched, keep as is
        if (card.isMatched) {
          return card;
        }
        
        // Check if this card should be matched
        const matchedByPlayerId = cardToPlayerMap.get(card.id);
        if (matchedByPlayerId !== undefined) {
          return {
            ...card,
            isFlipped: true,
            isMatched: true,
            matchedByPlayerId
          };
        }
        
        return card;
      });
      
      // Calculate new scores (count pairs, not individual cards)
      const player1Matches = pairs.filter((_, index) => index % 2 === 0).length;
      const player2Matches = pairs.filter((_, index) => index % 2 === 1).length;
      
      const newPlayers = sortPlayersByID(prev.players.map(player => ({
        ...player,
        score: player.id === 1 ? player1Matches : player2Matches
      })));
      
      return {
        ...prev,
        cards: newCards,
        players: newPlayers,
        selectedCards: []
      };
    });
  }, []);

  return {
    gameState,
    showStartModal,
    setShowStartModal,
    cardSize,
    autoSizeEnabled,
    useWhiteCardBackground,
    flipDuration,
    emojiSizePercentage,
    ttsEnabled,
    initializeGame,
    startGame,
    startGameWithFirstPlayer,
    showStartGameModal,
    updatePlayerName,
    updatePlayerColor,
    increaseCardSize,
    decreaseCardSize,
    toggleWhiteCardBackground,
    toggleAutoSize,
    increaseFlipDuration,
    decreaseFlipDuration,
    increaseEmojiSize,
    decreaseEmojiSize,
    toggleTtsEnabled,
    flipCard,
    endTurn,
    resetGame,
    isAnimatingCards,
    flipAllExceptLastPair,
    endGameEarly,
    toggleAllCardsFlipped,
    allCardsFlipped,
    updateAutoSizeMetrics,
    calculateOptimalCardSizeForCount
  };
};
