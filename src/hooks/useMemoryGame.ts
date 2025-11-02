import { useState, useCallback, useRef } from 'react';
import type { Card, Player, GameState } from '../types';

export const useMemoryGame = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Load player names from localStorage
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

  const initializeGame = useCallback((images: { id: string; url: string; gradient?: string }[], startPlaying: boolean = false) => {
    // Cancel any pending match check
    if (matchCheckTimeoutRef.current) {
      clearTimeout(matchCheckTimeoutRef.current);
      matchCheckTimeoutRef.current = null;
    }
    isCheckingMatchRef.current = false;
    
    const cards: Card[] = [];
    
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
    setGameState({
      cards: [],
      players: [
        { id: 1, name: player1Name, score: 0, color: savedPlayer1Color },
        { id: 2, name: player2Name, score: 0, color: savedPlayer2Color }
      ],
      currentPlayer: firstPlayer,
      selectedCards: [],
      gameStatus: 'setup',
      winner: null,
      isTie: false
    });
    // Don't show modal yet - wait for cards to be initialized
  }, []);

  const startGameWithFirstPlayer = useCallback((firstPlayer: number) => {
    setGameState(prev => ({
      ...prev,
      currentPlayer: firstPlayer,
      gameStatus: 'playing' as const
    }));
    setShowStartModal(false);
    localStorage.setItem('firstPlayer', firstPlayer.toString());
    isInitialLoadRef.current = false;
  }, []);

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

  const updatePlayerName = useCallback((playerId: 1 | 2, newName: string) => {
    // Save to localStorage
    localStorage.setItem(`player${playerId}Name`, newName.trim());
    
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(player =>
        player.id === playerId ? { ...player, name: newName.trim() } : player
      )
    }));
  }, []);

  const updatePlayerColor = useCallback((playerId: 1 | 2, newColor: string) => {
    // Save to localStorage
    localStorage.setItem(`player${playerId}Color`, newColor);
    
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(player =>
        player.id === playerId ? { ...player, color: newColor } : player
      )
    }));
  }, []);

  const resetGame = useCallback(() => {
    // Cancel any pending match check
    if (matchCheckTimeoutRef.current) {
      clearTimeout(matchCheckTimeoutRef.current);
      matchCheckTimeoutRef.current = null;
    }
    isCheckingMatchRef.current = false;
    
    // Reset clears cards and goes back to setup mode
    // The actual reset flow will be handled by App.tsx
    setGameState(prev => ({
      ...prev,
      cards: [],
      players: [
        { id: 1, name: prev.players[0]?.name || 'Player 1', score: 0, color: prev.players[0]?.color || '#3b82f6' },
        { id: 2, name: prev.players[1]?.name || 'Player 2', score: 0, color: prev.players[1]?.color || '#10b981' }
      ],
      selectedCards: [],
      gameStatus: 'setup',
      winner: null,
      isTie: false
    }));
  }, []);

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
        newPlayers = prev.players.map(p =>
          p.id === prev.currentPlayer
            ? { ...p, score: p.score + 1 }
            : p
        );
        
        // Capture the player ID who matched these cards
        const matchedByPlayerId = prev.currentPlayer;
        
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
                selectedCards: [],
                gameStatus: 'finished' as const,
                winner: isTie ? null : winner,
                isTie
              };
            }
            
            return {
              ...prevState,
              cards: updatedCards,
              selectedCards: []
            };
          });
        }, 1000); // Match animation duration (increased to match CSS animation)
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

      // Reset the checking flag after state update completes
      // Use requestAnimationFrame to ensure React has rendered the update
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isCheckingMatchRef.current = false;
        });
      });

      return newState;
    });
  }, []);

  const endTurn = useCallback(() => {
    // Cancel any pending match check
    if (matchCheckTimeoutRef.current) {
      clearTimeout(matchCheckTimeoutRef.current);
      matchCheckTimeoutRef.current = null;
    }
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
  }, []);

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
        console.log('[FLIP CARD] Cards are currently flying to player, ignoring', JSON.stringify({
          flyingCardsCount: flyingCards.length,
          flyingCardIds: flyingCards.map(c => c.id)
        }));
        return prev;
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

  return {
    gameState,
    showStartModal,
    setShowStartModal,
    cardSize,
    useWhiteCardBackground,
    flipDuration,
    initializeGame,
    startGame,
    startGameWithFirstPlayer,
    showStartGameModal,
    updatePlayerName,
    updatePlayerColor,
    increaseCardSize,
    decreaseCardSize,
    toggleWhiteCardBackground,
    increaseFlipDuration,
    decreaseFlipDuration,
    flipCard,
    endTurn,
    resetGame,
    isAnimatingCards
  };
};
