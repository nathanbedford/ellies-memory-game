/**
 * useGame - Unified hook for both local and online game modes
 *
 * This hook provides a single interface for game actions that works
 * in both local and online modes. It internally uses useLocalGame
 * for settings management and useOnlineGame for online state/actions.
 *
 * The key simplification:
 * - App.tsx no longer needs conditional switching like:
 *   `isOnlineMode ? onlineGame.flipCard : localGame.flipCard`
 * - Instead, just use `game.flipCard` everywhere
 *
 * How it works:
 * - Local mode: All actions come from useLocalGame
 * - Online mode: Game state/actions come from useOnlineGame,
 *   but settings still come from useLocalGame
 */

import { useMemo } from "react";
import { useLocalGame } from "./useLocalGame";
import { useOnlineGame } from "./useOnlineGame";
import { getPlayersFromPresence } from "../services/game/GameEngine";
import type { GameState, Player, PresenceData } from "../types";

export interface UseGameOptions {
	/** Game mode - 'local' for same-device, 'online' for multiplayer */
	mode: "local" | "online";

	/** Online mode options */
	roomCode?: string;
	localPlayerSlot?: number;
	presenceData?: PresenceData;
}

export interface UseGameReturn {
	// ============================================
	// Core Game State & Actions (mode-dependent)
	// ============================================

	/** Current game state */
	gameState: GameState;

	/** Players in the game */
	players: Player[];

	/** Replace entire game state */
	setFullGameState: (state: GameState) => void;

	/** Flip a card by ID */
	flipCard: (cardId: string) => void;

	/** End current player's turn */
	endTurn: () => void;

	/** Reset game (clear timeouts) */
	resetGame: () => void;

	/** Trigger game finish after final match animation */
	triggerGameFinish: () => void;

	/** Whether this client can make moves (always true in local, turn-based in online) */
	isAuthoritative: boolean;

	// ============================================
	// Admin Controls (mode-dependent)
	// ============================================

	/** Toggle all unmatched cards flipped/unflipped */
	toggleAllCardsFlipped: () => void;

	/** Match all but last pair (for testing) */
	endGameEarly: () => void;

	// ============================================
	// Settings (always from local game)
	// ============================================

	cardSize: number;
	autoSizeEnabled: boolean;
	useWhiteCardBackground: boolean;
	flipDuration: number;
	emojiSizePercentage: number;
	ttsEnabled: boolean;

	// ============================================
	// Settings Actions (always from local game)
	// ============================================

	updatePlayerName: (playerId: number, name: string) => void;
	updatePlayerColor: (playerId: number, color: string) => void;
	increaseCardSize: () => void;
	decreaseCardSize: () => void;
	toggleWhiteCardBackground: () => void;
	toggleAutoSize: () => void;
	increaseFlipDuration: () => void;
	decreaseFlipDuration: () => void;
	increaseEmojiSize: () => void;
	decreaseEmojiSize: () => void;
	toggleTtsEnabled: () => void;

	// ============================================
	// Game Setup (always from local game)
	// ============================================

	initializeGame: (
		images: { id: string; url: string; gradient?: string }[],
		startPlaying?: boolean,
	) => void;
	startGame: (
		player1Name: string,
		player2Name: string,
		firstPlayer: number,
	) => void;
	startGameWithFirstPlayer: (firstPlayer: number) => void;
	showStartGameModal: () => void;
	showStartModal: boolean;
	setShowStartModal: (show: boolean) => void;
	isAnimatingCards: boolean;

	// ============================================
	// Layout (always from local game)
	// ============================================

	updateAutoSizeMetrics: (metrics: {
		boardWidth: number;
		boardAvailableHeight: number;
		scoreboardHeight: number;
	}) => void;
	calculateOptimalCardSizeForCount: (
		cardCount: number,
		metricsOverride?: {
			boardWidth: number;
			boardAvailableHeight: number;
			scoreboardHeight: number;
		},
	) => void;

	// ============================================
	// Additional Admin Controls (local only)
	// ============================================

	flipAllExceptLastPair: () => void;
	allCardsFlipped: boolean;

	// ============================================
	// Effect Manager (shared)
	// ============================================

	effectManager: ReturnType<typeof useLocalGame>["effectManager"];
}

export function useGame(options: UseGameOptions): UseGameReturn {
	const { mode, roomCode = "", localPlayerSlot = 0, presenceData = {} } = options;

	// Always call both hooks (React hooks rule - can't be conditional)
	const localGame = useLocalGame();

	// Derive players for online mode from presence data
	const onlinePlayers = useMemo(
		() => getPlayersFromPresence(presenceData),
		[presenceData],
	);

	const onlineGame = useOnlineGame({
		roomCode,
		localPlayerSlot,
		flipDuration: localGame.flipDuration,
		initialGameState: localGame.gameState,
		players: onlinePlayers,
		effectManager: localGame.effectManager,
	});

	// Determine if we're actually in online mode
	const isOnlineMode = mode === "online" && roomCode && localPlayerSlot !== null;

	// Select which game interface to use based on mode
	// Online mode: game state/actions from onlineGame, settings from localGame
	// Local mode: everything from localGame

	const gameState = isOnlineMode ? onlineGame.gameState : localGame.gameState;
	const players = isOnlineMode ? onlinePlayers : localGame.players;
	const setFullGameState = isOnlineMode
		? onlineGame.setFullGameState
		: localGame.setFullGameState;
	const flipCard = isOnlineMode ? onlineGame.flipCard : localGame.flipCard;
	const endTurn = isOnlineMode ? onlineGame.endTurn : localGame.endTurn;
	const resetGame = isOnlineMode ? onlineGame.resetGame : localGame.resetGame;
	const triggerGameFinish = isOnlineMode
		? onlineGame.triggerGameFinish
		: localGame.triggerGameFinish;
	const toggleAllCardsFlipped = isOnlineMode
		? onlineGame.toggleAllCardsFlipped
		: localGame.toggleAllCardsFlipped;
	const endGameEarly = isOnlineMode
		? onlineGame.endGameEarly
		: localGame.endGameEarly;

	// isAuthoritative: in local mode always true, in online mode depends on turn
	const isAuthoritative = isOnlineMode ? onlineGame.isAuthoritative : true;

	return {
		// Core game state & actions (mode-dependent)
		gameState,
		players,
		setFullGameState,
		flipCard,
		endTurn,
		resetGame,
		triggerGameFinish,
		isAuthoritative,

		// Admin controls (mode-dependent)
		toggleAllCardsFlipped,
		endGameEarly,

		// Settings (always from local game)
		cardSize: localGame.cardSize,
		autoSizeEnabled: localGame.autoSizeEnabled,
		useWhiteCardBackground: localGame.useWhiteCardBackground,
		flipDuration: localGame.flipDuration,
		emojiSizePercentage: localGame.emojiSizePercentage,
		ttsEnabled: localGame.ttsEnabled,

		// Settings actions (always from local game)
		updatePlayerName: localGame.updatePlayerName,
		updatePlayerColor: localGame.updatePlayerColor,
		increaseCardSize: localGame.increaseCardSize,
		decreaseCardSize: localGame.decreaseCardSize,
		toggleWhiteCardBackground: localGame.toggleWhiteCardBackground,
		toggleAutoSize: localGame.toggleAutoSize,
		increaseFlipDuration: localGame.increaseFlipDuration,
		decreaseFlipDuration: localGame.decreaseFlipDuration,
		increaseEmojiSize: localGame.increaseEmojiSize,
		decreaseEmojiSize: localGame.decreaseEmojiSize,
		toggleTtsEnabled: localGame.toggleTtsEnabled,

		// Game setup (always from local game)
		initializeGame: localGame.initializeGame,
		startGame: localGame.startGame,
		startGameWithFirstPlayer: localGame.startGameWithFirstPlayer,
		showStartGameModal: localGame.showStartGameModal,
		showStartModal: localGame.showStartModal,
		setShowStartModal: localGame.setShowStartModal,
		isAnimatingCards: localGame.isAnimatingCards,

		// Layout (always from local game)
		updateAutoSizeMetrics: localGame.updateAutoSizeMetrics,
		calculateOptimalCardSizeForCount: localGame.calculateOptimalCardSizeForCount,

		// Additional admin controls (local only - safe to call in online but no effect)
		flipAllExceptLastPair: localGame.flipAllExceptLastPair,
		allCardsFlipped: localGame.allCardsFlipped,

		// Effect manager
		effectManager: localGame.effectManager,
	};
}
