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

export type GameStatus = "setup" | "playing" | "finished";

export interface GameState {
	cards: Card[];
	players: Player[];
	currentPlayer: number;
	selectedCards: string[];
	gameStatus: GameStatus;
	winner: Player | null;
	isTie: boolean;
}

export type CardPack =
	| "animals"
	| "animals-real"
	| "plants"
	| "buildings"
	| "colors"
	| "ocean"
	| "ocean-real"
	| "construction"
	| "construction-real"
	| "emotions-real"
	| "insects-real"
	| "jungle-animals-real"
	| "plush-cute-animals-real"
	| "animals-from-china-real"
	| "thanksgiving"
	| "christmas";

export interface CardPackOption {
	id: CardPack;
	name: string;
	emoji: string;
}

// ============================================
// Online Multiplayer Types
// ============================================

export type GameMode = "local" | "online";

export type ConnectionStatus =
	| "disconnected"
	| "connecting"
	| "connected"
	| "reconnecting";

export type RoomStatus = "waiting" | "playing" | "finished";

export interface OnlinePlayer extends Player {
	odahId: string; // Firebase anonymous auth UID
	isHost: boolean;
	isConnected: boolean;
	lastSeen: number; // Timestamp
}

export interface RoomConfig {
	roomCode: string;
	hostId: string;
	status: RoomStatus;
	cardPack: CardPack;
	background: string;
	cardBack: string;
	createdAt: number;
	lastActivity: number;
}

export interface OnlineGameState extends GameState {
	syncVersion: number; // For optimistic concurrency control
	lastUpdatedBy?: number; // Player slot (1 or 2) who made the last update - used to skip self-updates
}

export interface Room {
	roomCode: string;
	hostId: string;
	status: RoomStatus;
	config: {
		cardPack: CardPack;
		background: string;
		cardBack: string;
	} | null;
	players: Record<
		string,
		{
			slot: 1 | 2;
			name: string;
			color: string;
		}
	>;
	gameState: OnlineGameState | null;
	createdAt: number;
	lastActivity: number;
}

// RTDB Presence
export interface PresenceData {
	odahId: string;
	name: string;
	online: boolean;
	lastSeen: number;
}

// Cursor Position (normalized coordinates 0-1)
export interface CursorPosition {
	x: number; // Normalized x position (0-1)
	y: number; // Normalized y position (0-1)
	timestamp: number; // Timestamp when position was recorded
}
