import { useState, useCallback } from 'react';
import { Card, Player, GameState } from '../types';

export const useMemoryGame = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Load player names from localStorage
    const savedPlayer1Name = localStorage.getItem('player1Name') || 'Player 1';
    const savedPlayer2Name = localStorage.getItem('player2Name') || 'Player 2';
    const savedFirstPlayer = parseInt(localStorage.getItem('firstPlayer') || '1') as 1 | 2;

    const initialPlayers: Player[] = [
      { id: 1, name: savedPlayer1Name, score: 0 },
      { id: 2, name: savedPlayer2Name, score: 0 }
    ];

    return {
      cards: [],
      players: initialPlayers,
      currentPlayer: savedFirstPlayer,
      selectedCards: [],
      gameStatus: 'setup',
      winner: null
    };
  });

  const [currentImages, setCurrentImages] = useState<{ id: string; url: string; gradient?: string }[]>([]);
  const [showStartModal, setShowStartModal] = useState(false);

  const initializeGame = useCallback((images: { id: string; url: string; gradient?: string }[], showModal: boolean = false) => {
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
    setCurrentImages(images);

    setGameState(prev => ({
      ...prev,
      cards: shuffledCards,
      selectedCards: [],
      gameStatus: showModal ? 'setup' : 'playing',
      winner: null
    }));
    
    if (showModal) {
      setShowStartModal(true);
    }
  }, []);

  const startGame = useCallback((player1Name: string, player2Name: string, firstPlayer: number) => {
    setGameState({
      cards: [],
      players: [
        { id: 1, name: player1Name, score: 0 },
        { id: 2, name: player2Name, score: 0 }
      ],
      currentPlayer: firstPlayer,
      selectedCards: [],
      gameStatus: 'setup',
      winner: null
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
  }, []);

  const showStartGameModal = useCallback(() => {
    setShowStartModal(true);
  }, []);

  const updatePlayerName = useCallback((playerId: 1 | 2, newName: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(player =>
        player.id === playerId ? { ...player, name: newName } : player
      )
    }));
  }, []);

  const resetGame = useCallback(() => {
    if (currentImages.length === 0) return;
    
    const cards: Card[] = [];
    
    // Recreate pairs of cards from current images
    currentImages.forEach((image, index) => {
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

    // Alternate who goes first (if player 1 went first, now player 2 goes first)
    const nextFirstPlayer = gameState.currentPlayer === 1 ? 2 : 1;

    setGameState(prev => ({
      ...prev,
      cards: shuffledCards,
      players: [
        { id: 1, name: prev.players[0]?.name || 'Player 1', score: 0 },
        { id: 2, name: prev.players[1]?.name || 'Player 2', score: 0 }
      ],
      currentPlayer: nextFirstPlayer,
      selectedCards: [],
      gameStatus: 'setup',
      winner: null
    }));
    
    // Show the start modal to confirm who goes first
    setShowStartModal(true);
  }, [currentImages, gameState.currentPlayer]);

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

  return {
    gameState,
    showStartModal,
    initializeGame,
    startGame,
    startGameWithFirstPlayer,
    showStartGameModal,
    updatePlayerName,
    flipCard,
    resetGame
  };
};
