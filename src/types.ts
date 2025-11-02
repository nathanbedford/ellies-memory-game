export interface Card {
  id: string;
  imageId: string;
  imageUrl: string;
  gradient?: string;
  isFlipped: boolean;
  isMatched: boolean;
  isFlyingToPlayer?: boolean;
  flyingToPlayerId?: number;
  matchedByPlayerId?: number; // Track which player matched this card
}

export interface Player {
  id: number;
  name: string;
  score: number;
  color: string; // Hex color code for the player
}

export type GameStatus = 'setup' | 'playing' | 'finished';

export interface GameState {
  cards: Card[];
  players: Player[];
  currentPlayer: number;
  selectedCards: string[];
  gameStatus: GameStatus;
  winner: Player | null;
  isTie: boolean;
}

export type CardPack = 'animals' | 'plants' | 'buildings' | 'colors' | 'ocean' | 'construction';

export interface CardPackOption {
  id: CardPack;
  name: string;
  emoji: string;
}
