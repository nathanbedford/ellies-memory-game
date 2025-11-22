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

export type CardPack = 'animals' | 'animals-real' | 'plants' | 'buildings' | 'colors' | 'ocean' | 'ocean-real' | 'construction' | 'construction-real' | 'emotions-real' | 'insects-real' | 'jungle-animals-real' | 'plush-cute-animals-real' | 'animals-from-china-real';

export interface CardPackOption {
  id: CardPack;
  name: string;
  emoji: string;
}
