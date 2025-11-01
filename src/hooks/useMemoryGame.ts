import { useState, useCallback } from 'react';
import { Card, Player, GameState } from '../types';

export const useMemoryGame = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialPlayers: Player[] = [
      { id: 1, name: 'Player 1', score: 0 },
      { id: 2, name: 'Player 2', score: 0 }
    ];

    return {
      cards: [],
      players: initialPlayers,
      currentPlayer: 1,
      selectedCards: [],
      gameStatus: 'playing',
      winner: null
    };
  });

  const initializeGame = useCallback((images: { id: string; url: string; gradient?: string }[]) => {
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

    setGameState({
      cards: shuffledCards,
      players: [
        { id: 1, name: 'Player 1', score: 0 },
        { id: 2, name: 'Player 2', score: 0 }
      ],
      currentPlayer: 1,
      selectedCards: [],
      gameStatus: 'playing',
      winner: null
    });
  }, []);

  const flipCard = useCallback((cardId: string) => {
    if (gameState.gameStatus !== 'playing') return;
    
    const card = gameState.cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;
    if (gameState.selectedCards.length >= 2) return;

    const newCards = gameState.cards.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    
    const newSelectedCards = [...gameState.selectedCards, cardId];

    setGameState(prev => ({
      ...prev,
      cards: newCards,
      selectedCards: newSelectedCards
    }));

    // Check for match when two cards are selected
    if (newSelectedCards.length === 2) {
      setTimeout(() => checkForMatch(newSelectedCards), 1000);
    }
  }, [gameState]);

  const checkForMatch = useCallback((selectedIds: string[]) => {
    setGameState(prev => {
      const [firstId, secondId] = selectedIds;
      const firstCard = prev.cards.find(c => c.id === firstId);
      const secondCard = prev.cards.find(c => c.id === secondId);

      if (!firstCard || !secondCard) return prev;

      const isMatch = firstCard.imageId === secondCard.imageId;
      
      let newCards = prev.cards;
      let newPlayers = [...prev.players];
      let nextPlayer = prev.currentPlayer;

      if (isMatch) {
        // Mark cards as matched
        newCards = prev.cards.map(c =>
          c.id === firstId || c.id === secondId
            ? { ...c, isMatched: true }
            : c
        );
        
        // Increment current player's score
        newPlayers = prev.players.map(p =>
          p.id === prev.currentPlayer
            ? { ...p, score: p.score + 1 }
            : p
        );

        // Check if game is finished
        const allMatched = newCards.every(c => c.isMatched);
        if (allMatched) {
          const winner = newPlayers.reduce((prev, current) => 
            prev.score > current.score ? prev : current
          );
          
          return {
            ...prev,
            cards: newCards,
            players: newPlayers,
            selectedCards: [],
            gameStatus: 'finished' as const,
            winner
          };
        }
      } else {
        // Flip cards back and switch player
        newCards = prev.cards.map(c =>
          c.id === firstId || c.id === secondId
            ? { ...c, isFlipped: false }
            : c
        );
        nextPlayer = prev.currentPlayer === 1 ? 2 : 1;
      }

      return {
        ...prev,
        cards: newCards,
        players: newPlayers,
        currentPlayer: nextPlayer,
        selectedCards: []
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setGameState({
      cards: [],
      players: [
        { id: 1, name: 'Player 1', score: 0 },
        { id: 2, name: 'Player 2', score: 0 }
      ],
      currentPlayer: 1,
      selectedCards: [],
      gameStatus: 'playing',
      winner: null
    });
  }, []);

  return {
    gameState,
    initializeGame,
    flipCard,
    resetGame
  };
};
