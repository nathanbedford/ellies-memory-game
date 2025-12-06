/**
 * GameEngine - Pure functions for memory game logic
 *
 * All functions are pure: they take state and return new state without side effects.
 * This makes the game logic testable, replayable, and easy to sync across network.
 */

import type { Card, Player, GameState } from '../../types';

// ============================================
// Helper Functions
// ============================================

/**
 * Sort players by ID (ensures consistent ordering)
 */
export function sortPlayersByID(players: Player[]): Player[] {
  return [...players].sort((a, b) => a.id - b.id);
}

/**
 * Get player by ID
 */
export function getPlayerById(players: Player[], id: number): Player | undefined {
  return players.find(p => p.id === id);
}

/**
 * Generate a 4-character room code (uppercase letters, excluding ambiguous chars)
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excludes O and I
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// ============================================
// Card Initialization
// ============================================

export interface CardImage {
  id: string;
  url: string;
  gradient?: string;
}

/**
 * Create pairs of cards from images
 */
export function createCardPairs(images: CardImage[]): Card[] {
  const cards: Card[] = [];

  images.forEach((image, index) => {
    // Create two cards for each image (a matching pair)
    cards.push({
      id: `card-${index * 2}`,
      imageId: image.id,
      imageUrl: image.url,
      gradient: image.gradient,
      isFlipped: false,
      isMatched: false,
    });
    cards.push({
      id: `card-${index * 2 + 1}`,
      imageId: image.id,
      imageUrl: image.url,
      gradient: image.gradient,
      isFlipped: false,
      isMatched: false,
    });
  });

  return cards;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleCards(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Initialize cards from images (create pairs and shuffle)
 */
export function initializeCards(images: CardImage[]): Card[] {
  const pairs = createCardPairs(images);
  return shuffleCards(pairs);
}

// ============================================
// Card Operations
// ============================================

/**
 * Check if a card can be flipped
 */
export function canFlipCard(state: GameState, cardId: string): boolean {
  if (state.gameStatus !== 'playing') {
    return false;
  }

  // Already have 2 cards selected
  if (state.selectedCards.length >= 2) {
    return false;
  }

  const card = state.cards.find(c => c.id === cardId);
  if (!card) {
    return false;
  }

  // Can't flip already flipped or matched cards
  if (card.isFlipped || card.isMatched) {
    return false;
  }

  return true;
}

/**
 * Flip a card (pure function - returns new state)
 */
export function flipCard(state: GameState, cardId: string): GameState {
  if (!canFlipCard(state, cardId)) {
    return state;
  }

  const newCards = state.cards.map(c =>
    c.id === cardId ? { ...c, isFlipped: true } : c
  );

  const newSelectedCards = [...state.selectedCards, cardId];

  return {
    ...state,
    cards: newCards,
    selectedCards: newSelectedCards,
  };
}

// ============================================
// Match Detection
// ============================================

export interface MatchResult {
  isMatch: boolean;
  firstCard: Card;
  secondCard: Card;
}

/**
 * Check if two selected cards are a match
 */
export function checkMatch(state: GameState): MatchResult | null {
  if (state.selectedCards.length !== 2) {
    return null;
  }

  const [firstId, secondId] = state.selectedCards;
  const firstCard = state.cards.find(c => c.id === firstId);
  const secondCard = state.cards.find(c => c.id === secondId);

  if (!firstCard || !secondCard) {
    return null;
  }

  return {
    isMatch: firstCard.imageId === secondCard.imageId,
    firstCard,
    secondCard,
  };
}

/**
 * Apply match result to state (marks cards as matched, updates score)
 */
export function applyMatch(state: GameState, matchResult: MatchResult): GameState {
  if (!matchResult.isMatch) {
    return state;
  }

  const { firstCard, secondCard } = matchResult;
  const currentPlayerId = state.currentPlayer;

  // Mark cards as matched
  const newCards = state.cards.map(c =>
    c.id === firstCard.id || c.id === secondCard.id
      ? { ...c, isMatched: true, isFlipped: true, matchedByPlayerId: currentPlayerId }
      : c
  );

  // Increment current player's score
  const newPlayers = sortPlayersByID(
    state.players.map(p =>
      p.id === currentPlayerId ? { ...p, score: p.score + 1 } : p
    )
  );

  return {
    ...state,
    cards: newCards,
    players: newPlayers,
    selectedCards: [],
  };
}

/**
 * Apply no-match result (flip cards back, switch player)
 */
export function applyNoMatch(state: GameState, matchResult: MatchResult): GameState {
  if (matchResult.isMatch) {
    return state;
  }

  const { firstCard, secondCard } = matchResult;

  // Flip cards back
  const newCards = state.cards.map(c =>
    c.id === firstCard.id || c.id === secondCard.id
      ? { ...c, isFlipped: false }
      : c
  );

  // Switch to next player
  const nextPlayer = state.currentPlayer === 1 ? 2 : 1;

  return {
    ...state,
    cards: newCards,
    currentPlayer: nextPlayer,
    selectedCards: [],
  };
}

// ============================================
// Turn Management
// ============================================

/**
 * Get the next player ID
 */
export function getNextPlayer(currentPlayer: number): number {
  return currentPlayer === 1 ? 2 : 1;
}

/**
 * Switch to the next player
 */
export function switchPlayer(state: GameState): GameState {
  return {
    ...state,
    currentPlayer: getNextPlayer(state.currentPlayer),
    selectedCards: [],
  };
}

/**
 * End turn manually (flip all non-matched cards back, switch player)
 */
export function endTurn(state: GameState): GameState {
  // Flip all non-matched, non-flying cards back
  const newCards = state.cards.map(c => {
    if (c.isMatched) {
      return c;
    }
    if (c.isFlyingToPlayer) {
      // Handle stuck flying cards - mark as matched if they have a pair
      return { ...c, isFlyingToPlayer: false, isFlipped: false };
    }
    if (c.isFlipped) {
      return { ...c, isFlipped: false };
    }
    return c;
  });

  return {
    ...state,
    cards: newCards,
    currentPlayer: getNextPlayer(state.currentPlayer),
    selectedCards: [],
  };
}

// ============================================
// Game Status
// ============================================

/**
 * Check if the game is over (all cards matched)
 */
export function isGameOver(state: GameState): boolean {
  if (state.cards.length === 0) {
    return false;
  }
  return state.cards.every(c => c.isMatched);
}

/**
 * Calculate the winner
 */
export function calculateWinner(state: GameState): { winner: Player | null; isTie: boolean } {
  if (state.players.length === 0) {
    return { winner: null, isTie: false };
  }

  // Find player with highest score
  const winner = state.players.reduce((prev, current) =>
    current.score > prev.score ? current : prev
  );

  // Check if it's a tie
  const isTie = state.players.every(p => p.score === winner.score);

  return {
    winner: isTie ? null : winner,
    isTie,
  };
}

/**
 * Finish the game and determine winner
 */
export function finishGame(state: GameState): GameState {
  const { winner, isTie } = calculateWinner(state);

  return {
    ...state,
    gameStatus: 'finished',
    winner,
    isTie,
    selectedCards: [],
  };
}

/**
 * Check if game should end and apply finish if so
 */
export function checkAndFinishGame(state: GameState): GameState {
  if (isGameOver(state)) {
    return finishGame(state);
  }
  return state;
}

// ============================================
// Game Reset
// ============================================

/**
 * Create initial game state
 */
export function createInitialState(
  player1Name: string = 'Player 1',
  player2Name: string = 'Player 2',
  player1Color: string = '#3b82f6',
  player2Color: string = '#10b981',
  firstPlayer: 1 | 2 = 1
): GameState {
  return {
    cards: [],
    players: sortPlayersByID([
      { id: 1, name: player1Name, score: 0, color: player1Color },
      { id: 2, name: player2Name, score: 0, color: player2Color },
    ]),
    currentPlayer: firstPlayer,
    selectedCards: [],
    gameStatus: 'setup',
    winner: null,
    isTie: false,
  };
}

/**
 * Reset game state (keep player names/colors, reset scores and cards)
 */
export function resetGameState(state: GameState): GameState {
  const player1 = getPlayerById(state.players, 1);
  const player2 = getPlayerById(state.players, 2);

  return {
    cards: [],
    players: sortPlayersByID([
      { id: 1, name: player1?.name || 'Player 1', score: 0, color: player1?.color || '#3b82f6' },
      { id: 2, name: player2?.name || 'Player 2', score: 0, color: player2?.color || '#10b981' },
    ]),
    currentPlayer: state.currentPlayer, // Keep the current player setting
    selectedCards: [],
    gameStatus: 'setup',
    winner: null,
    isTie: false,
  };
}

/**
 * Start game with cards
 */
export function startGameWithCards(state: GameState, cards: Card[]): GameState {
  return {
    ...state,
    cards,
    selectedCards: [],
    gameStatus: 'playing',
    winner: null,
    isTie: false,
  };
}

// ============================================
// Player Management
// ============================================

/**
 * Update player name
 */
export function updatePlayerName(state: GameState, playerId: number, newName: string): GameState {
  const newPlayers = sortPlayersByID(
    state.players.map(p =>
      p.id === playerId ? { ...p, name: newName.trim() } : p
    )
  );

  return {
    ...state,
    players: newPlayers,
  };
}

/**
 * Update player color
 */
export function updatePlayerColor(state: GameState, playerId: number, newColor: string): GameState {
  const newPlayers = sortPlayersByID(
    state.players.map(p =>
      p.id === playerId ? { ...p, color: newColor } : p
    )
  );

  return {
    ...state,
    players: newPlayers,
  };
}

// ============================================
// State Serialization (for network sync)
// ============================================

/**
 * Clean state for persistence (remove transient animation properties)
 */
export function cleanStateForPersistence(state: GameState): GameState {
  return {
    ...state,
    cards: state.cards.map(card => ({
      id: card.id,
      imageId: card.imageId,
      imageUrl: card.imageUrl,
      gradient: card.gradient,
      isFlipped: card.isFlipped,
      isMatched: card.isMatched,
      matchedByPlayerId: card.matchedByPlayerId,
      // Exclude: isFlyingToPlayer, flyingToPlayerId (transient animation state)
    })),
    players: sortPlayersByID(state.players),
    selectedCards: [], // Don't persist mid-selection state
  };
}

/**
 * Validate incoming state from network
 */
export function validateState(state: unknown): state is GameState {
  if (!state || typeof state !== 'object') return false;

  const s = state as GameState;

  if (!Array.isArray(s.cards)) return false;
  if (!Array.isArray(s.players)) return false;
  if (typeof s.currentPlayer !== 'number') return false;
  if (!Array.isArray(s.selectedCards)) return false;
  if (!['setup', 'playing', 'finished'].includes(s.gameStatus)) return false;

  return true;
}
