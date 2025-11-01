export interface Card {
  id: string;
  imageId: string;
  imageUrl: string;
  gradient?: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface Player {
  id: number;
  name: string;
  score: number;
}

export interface GameState {
  cards: Card[];
  players: Player[];
  currentPlayer: number;
  selectedCards: string[];
  gameStatus: 'playing' | 'finished';
  winner: Player | null;
}

export type CardPack = 'animals' | 'plants' | 'buildings' | 'colors';

export interface CardPackOption {
  id: CardPack;
  name: string;
  emoji: string;
}
