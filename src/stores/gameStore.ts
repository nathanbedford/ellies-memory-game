/**
 * gameStore - Zustand store for game state
 *
 * Pure game mechanics only. Settings are in settingsStore,
 * transient UI state is in uiStore.
 *
 * This store manages:
 * - Game state (cards, currentPlayer, gameStatus)
 * - Game actions (flip, match, endTurn, reset)
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
	applyMatch,
	applyNoMatch,
	type CardImage,
	checkAndFinishGame,
	checkMatch,
	createInitialState,
	endTurn,
	flipCard,
	initializeCards,
	resetGameState,
	startGameWithCards,
} from "../services/game/GameEngine";
import type { GameState } from "../types";

// ============================================
// Store State
// ============================================

interface GameStoreState {
	gameState: GameState;
}

interface GameStoreActions {
	initializeGame: (images: CardImage[], firstPlayer?: 1 | 2) => void;
	flipCard: (cardId: string) => boolean;
	processMatchResult: () => { isMatch: boolean } | null;
	endCurrentTurn: () => void;
	resetGame: () => void;
	setGameState: (state: GameState) => void;
}

type GameStore = GameStoreState & GameStoreActions;

// ============================================
// Store Implementation
// ============================================

export const useGameStore = create<GameStore>()(
	subscribeWithSelector((set, get) => ({
		gameState: createInitialState(1),

		initializeGame: (images: CardImage[], firstPlayer: 1 | 2 = 1) => {
			const { gameState } = get();
			const cards = initializeCards(images);
			const newState = startGameWithCards(
				{
					...gameState,
					currentPlayer: firstPlayer,
				},
				cards,
			);
			set({ gameState: newState });
		},

		flipCard: (cardId: string) => {
			const { gameState } = get();
			const newState = flipCard(gameState, cardId);
			if (newState !== gameState) {
				set({ gameState: newState });
				return true;
			}
			return false;
		},

		processMatchResult: () => {
			const { gameState } = get();
			const matchResult = checkMatch(gameState);

			if (!matchResult) {
				return null;
			}

			let newState: GameState;
			if (matchResult.isMatch) {
				newState = applyMatch(gameState, matchResult);
				newState = checkAndFinishGame(newState);
			} else {
				newState = applyNoMatch(gameState, matchResult);
			}

			set({ gameState: newState });
			return { isMatch: matchResult.isMatch };
		},

		endCurrentTurn: () => {
			const { gameState } = get();
			const newState = endTurn(gameState);
			set({ gameState: newState });
		},

		resetGame: () => {
			const { gameState } = get();
			const newState = resetGameState(gameState);
			set({ gameState: newState });
		},

		setGameState: (state: GameState) => {
			set({ gameState: state });
		},
	})),
);

// ============================================
// Selectors
// ============================================

export const selectGameState = (state: GameStore) => state.gameState;

export const selectIsGameOver = (state: GameStore) =>
	state.gameState.gameStatus === "finished";

export const selectCanFlipBase = (state: GameStore) => {
	const selectedCards = state.gameState.cards.filter(
		(c) => c.isFlipped && !c.isMatched,
	);
	return state.gameState.gameStatus === "playing" && selectedCards.length < 2;
};
