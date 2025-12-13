/**
 * gameStore - Zustand store for game state and settings
 *
 * Uses persist middleware for localStorage persistence of settings.
 * Game state is managed separately depending on mode (local vs online).
 */

import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import type { GameState, CardPack } from "../types";
import {
	createInitialState,
	resetGameState,
	startGameWithCards,
	flipCard,
	checkMatch,
	applyMatch,
	applyNoMatch,
	checkAndFinishGame,
	updatePlayerName,
	updatePlayerColor,
	endTurn,
	initializeCards,
	type CardImage,
} from "../services/game/GameEngine";
import { DEFAULT_PAIR_COUNT } from "../utils/gridLayout";

// ============================================
// Settings Types
// ============================================

export interface GameSettings {
	// Player settings
	player1Name: string;
	player1Color: string;
	player2Name: string;
	player2Color: string;
	firstPlayer: 1 | 2;

	// Display settings
	cardSize: number;
	autoSizeEnabled: boolean;
	useWhiteCardBackground: boolean;
	flipDuration: number;
	emojiSizePercentage: number;
	ttsEnabled: boolean;

	// Game settings
	cardPack: CardPack;
	background: string;
	cardBack: string;

	// Pair count settings (separate for local and online modes)
	localPairCount: number;
	onlinePairCount: number;
}

const DEFAULT_SETTINGS: GameSettings = {
	player1Name: "Player 1",
	player1Color: "#3b82f6",
	player2Name: "Player 2",
	player2Color: "#10b981",
	firstPlayer: 1,
	cardSize: 100,
	autoSizeEnabled: true,
	useWhiteCardBackground: false,
	flipDuration: 2000,
	emojiSizePercentage: 72,
	ttsEnabled: true,
	cardPack: "animals",
	background: "default",
	cardBack: "default",
	localPairCount: DEFAULT_PAIR_COUNT,
	onlinePairCount: DEFAULT_PAIR_COUNT,
};

// ============================================
// Store State
// ============================================

interface GameStoreState {
	// Current game state (in-memory, not persisted)
	gameState: GameState;

	// Persisted settings
	settings: GameSettings;

	// UI state (transient)
	showStartModal: boolean;
	isAnimatingCards: boolean;
	allCardsFlipped: boolean;
	layoutMetrics: {
		boardWidth: number;
		boardAvailableHeight: number;
		scoreboardHeight: number;
	};
}

interface GameStoreActions {
	// Game state actions
	initializeGame: (images: CardImage[]) => void;
	flipCard: (cardId: string) => boolean;
	processMatchResult: () => { isMatch: boolean } | null;
	endCurrentTurn: () => void;
	resetGame: () => void;
	setGameState: (state: GameState) => void;

	// Player actions
	setPlayerName: (playerId: number, name: string) => void;
	setPlayerColor: (playerId: number, color: string) => void;
	setFirstPlayer: (playerId: 1 | 2) => void;

	// Settings actions
	setCardPack: (pack: CardPack) => void;
	setBackground: (bg: string) => void;
	setCardBack: (cb: string) => void;
	setCardSize: (size: number) => void;
	setAutoSizeEnabled: (enabled: boolean) => void;
	setUseWhiteCardBackground: (enabled: boolean) => void;
	setFlipDuration: (duration: number) => void;
	setEmojiSizePercentage: (percentage: number) => void;
	setTtsEnabled: (enabled: boolean) => void;
	setLocalPairCount: (count: number) => void;
	setOnlinePairCount: (count: number) => void;

	// UI state actions
	setShowStartModal: (show: boolean) => void;
	setIsAnimatingCards: (animating: boolean) => void;
	setAllCardsFlipped: (flipped: boolean) => void;
	updateLayoutMetrics: (metrics: {
		boardWidth: number;
		boardAvailableHeight: number;
		scoreboardHeight: number;
	}) => void;
}

type GameStore = GameStoreState & GameStoreActions;

// ============================================
// Store Implementation
// ============================================

export const useGameStore = create<GameStore>()(
	subscribeWithSelector(
		persist(
			(set, get) => ({
				// Initial state
				gameState: createInitialState(
					DEFAULT_SETTINGS.player1Name,
					DEFAULT_SETTINGS.player2Name,
					DEFAULT_SETTINGS.player1Color,
					DEFAULT_SETTINGS.player2Color,
					DEFAULT_SETTINGS.firstPlayer,
				),
				settings: DEFAULT_SETTINGS,
				showStartModal: false,
				isAnimatingCards: false,
				allCardsFlipped: false,
				layoutMetrics: {
					boardWidth: 0,
					boardAvailableHeight: 0,
					scoreboardHeight: 0,
				},

				// Game state actions
				initializeGame: (images: CardImage[]) => {
					const { gameState, settings } = get();
					const cards = initializeCards(images);
					const newState = startGameWithCards(
						{
							...gameState,
							currentPlayer: settings.firstPlayer,
						},
						cards,
					);
					set({ gameState: newState, showStartModal: false });
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
					set({ gameState: newState, showStartModal: false });
				},

				setGameState: (state: GameState) => {
					set({ gameState: state });
				},

				// Player actions
				setPlayerName: (playerId: number, name: string) => {
					const { gameState, settings } = get();
					const newState = updatePlayerName(gameState, playerId, name);
					const settingsUpdate =
						playerId === 1 ? { player1Name: name } : { player2Name: name };
					set({
						gameState: newState,
						settings: { ...settings, ...settingsUpdate },
					});
				},

				setPlayerColor: (playerId: number, color: string) => {
					const { gameState, settings } = get();
					const newState = updatePlayerColor(gameState, playerId, color);
					const settingsUpdate =
						playerId === 1 ? { player1Color: color } : { player2Color: color };
					set({
						gameState: newState,
						settings: { ...settings, ...settingsUpdate },
					});
				},

				setFirstPlayer: (playerId: 1 | 2) => {
					const { settings } = get();
					set({ settings: { ...settings, firstPlayer: playerId } });
				},

				// Settings actions
				setCardPack: (pack: CardPack) => {
					const { settings } = get();
					set({ settings: { ...settings, cardPack: pack } });
				},

				setBackground: (bg: string) => {
					const { settings } = get();
					set({ settings: { ...settings, background: bg } });
				},

				setCardBack: (cb: string) => {
					const { settings } = get();
					set({ settings: { ...settings, cardBack: cb } });
				},

				setCardSize: (size: number) => {
					const { settings } = get();
					set({ settings: { ...settings, cardSize: size } });
				},

				setAutoSizeEnabled: (enabled: boolean) => {
					const { settings } = get();
					set({ settings: { ...settings, autoSizeEnabled: enabled } });
				},

				setUseWhiteCardBackground: (enabled: boolean) => {
					const { settings } = get();
					set({ settings: { ...settings, useWhiteCardBackground: enabled } });
				},

				setFlipDuration: (duration: number) => {
					const { settings } = get();
					set({ settings: { ...settings, flipDuration: duration } });
				},

				setEmojiSizePercentage: (percentage: number) => {
					const { settings } = get();
					set({ settings: { ...settings, emojiSizePercentage: percentage } });
				},

				setTtsEnabled: (enabled: boolean) => {
					const { settings } = get();
					set({ settings: { ...settings, ttsEnabled: enabled } });
				},

				setLocalPairCount: (count: number) => {
					const { settings } = get();
					set({ settings: { ...settings, localPairCount: count } });
				},

				setOnlinePairCount: (count: number) => {
					const { settings } = get();
					set({ settings: { ...settings, onlinePairCount: count } });
				},

				// UI state actions
				setShowStartModal: (show: boolean) => {
					set({ showStartModal: show });
				},

				setIsAnimatingCards: (animating: boolean) => {
					set({ isAnimatingCards: animating });
				},

				setAllCardsFlipped: (flipped: boolean) => {
					set({ allCardsFlipped: flipped });
				},

				updateLayoutMetrics: (metrics) => {
					set({ layoutMetrics: metrics });
				},
			}),
			{
				name: "matchimus-game-settings",
				// Only persist settings, not game state or transient UI state
				partialize: (state) => ({
					settings: state.settings,
				}),
			},
		),
	),
);

// ============================================
// Selectors
// ============================================

export const selectGameState = (state: GameStore) => state.gameState;
export const selectSettings = (state: GameStore) => state.settings;
export const selectCurrentPlayer = (state: GameStore) =>
	state.gameState.players.find((p) => p.id === state.gameState.currentPlayer);
export const selectIsGameOver = (state: GameStore) =>
	state.gameState.gameStatus === "finished";
export const selectCanFlip = (state: GameStore) =>
	state.gameState.gameStatus === "playing" &&
	state.gameState.selectedCards.length < 2 &&
	!state.isAnimatingCards;
