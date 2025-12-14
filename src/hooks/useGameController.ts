/**
 * useGameController - Unified hook for both local and online game modes
 *
 * This hook consolidates all game logic from useMemoryGame and useOnlineGame,
 * using GameEngine pure functions as the single source of truth for game rules.
 *
 * Key principles:
 * 1. GameEngine handles all pure game logic (flip, match, turn switch, etc.)
 * 2. This hook handles orchestration (animation timing, side effects, sync)
 * 3. Online mode uses authority pattern - only current player runs game logic
 * 4. EffectManager handles side effects (TTS, sounds) in a pluggable way
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { Card, GameState, OnlineGameState } from "../types";
import {
	canFlipCard,
	flipCard as engineFlipCard,
	checkMatch,
	startMatchAnimation,
	completeMatchAnimation,
	applyNoMatchWithReset,
	checkAndFinishGame,
	endTurn as engineEndTurn,
	getPlayerById,
	calculateWinner,
} from "../services/game/GameEngine";
import type { Player } from "../types";
import { EffectManager } from "../services/effects/EffectManager";
import type { ISyncAdapter } from "../services/sync/ISyncAdapter";

// ============================================
// Types
// ============================================

export interface GameSettings {
	flipDuration: number;
	cardSize: number;
	autoSizeEnabled: boolean;
	useWhiteCardBackground: boolean;
	emojiSizePercentage: number;
	ttsEnabled: boolean;
}

export interface LayoutMetrics {
	boardWidth: number;
	boardAvailableHeight: number;
	scoreboardHeight: number;
}

export interface UseGameControllerOptions {
	/** Game mode: 'local' for same-device, 'online' for networked */
	mode: "local" | "online";

	/** Initial game state */
	initialGameState: GameState;

	/** Initial settings */
	initialSettings: GameSettings;

	/** Players array (derived from settings for local, presence for online) */
	players: Player[];

	/** Effect manager for side effects (TTS, sounds) */
	effectManager?: EffectManager;

	// Online mode options
	/** Sync adapter for online mode (Firestore) */
	syncAdapter?: ISyncAdapter;
	/** Local player's slot (1 or 2) for online mode */
	localPlayerSlot?: number;
	/** Room code for online mode */
	roomCode?: string;
}

export interface GameControllerReturn {
	// State
	gameState: GameState;
	settings: GameSettings;
	layoutMetrics: LayoutMetrics;
	isAnimating: boolean;
	isAuthoritative: boolean;

	// Actions
	flipCard: (cardId: string) => void;
	endTurn: () => void;
	resetGame: () => void;
	setFullGameState: (state: GameState) => void;
	initializeGame: (cards: Card[]) => void;
	startGame: () => void;

	// Player management
	updatePlayerName: (playerId: number, newName: string) => void;
	updatePlayerColor: (playerId: number, newColor: string) => void;

	// Settings management
	updateSettings: (settings: Partial<GameSettings>) => void;
	updateLayoutMetrics: (metrics: LayoutMetrics) => void;

	// Utilities
	calculateOptimalCardSize: (cardCount: number) => number;
}

// ============================================
// Constants
// ============================================

const MATCH_ANIMATION_DURATION = 3000; // ms - must match CSS animation
const STUCK_THRESHOLD_MS = 15000; // 15 seconds without resolution is stuck

// ============================================
// Hook Implementation
// ============================================

export function useGameController(
	options: UseGameControllerOptions,
): GameControllerReturn {
	const {
		mode,
		initialGameState,
		initialSettings,
		players,
		effectManager,
		syncAdapter,
		localPlayerSlot,
		roomCode,
	} = options;

	// ============================================
	// State
	// ============================================

	const [gameState, setGameState] = useState<GameState>(initialGameState);
	const [settings, setSettings] = useState<GameSettings>(initialSettings);
	const [layoutMetrics, setLayoutMetrics] = useState<LayoutMetrics>({
		boardWidth: 0,
		boardAvailableHeight: 0,
		scoreboardHeight: 0,
	});
	const [isAnimating, setIsAnimating] = useState(false);

	// ============================================
	// Refs
	// ============================================

	const matchCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const isCheckingMatchRef = useRef(false);

	// Online mode refs
	const lastSyncedVersionRef = useRef(0);
	const localVersionRef = useRef(
		(initialGameState as OnlineGameState).syncVersion || 0,
	);

	// Stuck detection refs
	const cardsFlippedAtRef = useRef<number | null>(null);
	const stuckCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
		null,
	);

	// ============================================
	// Computed Values
	// ============================================

	const isOnlineMode = mode === "online";
	const isAuthoritative =
		!isOnlineMode || localPlayerSlot === gameState.currentPlayer;

	// ============================================
	// Sync Helper (Online mode)
	// ============================================

	const syncToFirestore = useCallback(
		async (state: GameState, context?: string) => {
			if (!isOnlineMode || !syncAdapter) return;

			try {
				// Increment version and mark who updated
				const newVersion = localVersionRef.current + 1;
				localVersionRef.current = newVersion;

				const onlineState: OnlineGameState = {
					...state,
					syncVersion: newVersion,
					lastUpdatedBy: localPlayerSlot,
					gameRound: (state as OnlineGameState).gameRound || 0,
				};

				await syncAdapter.setState(onlineState);

				console.log(`[SYNC] ${context || "unknown"}`, {
					version: newVersion,
					currentPlayer: state.currentPlayer,
				});
			} catch (error) {
				console.error(`[SYNC ERROR] ${context || "unknown"}`, error);
			}
		},
		[isOnlineMode, syncAdapter, localPlayerSlot],
	);

	// ============================================
	// Online State Subscription
	// ============================================

	useEffect(() => {
		if (!isOnlineMode || !syncAdapter || !roomCode) return;

		const unsubscribe = syncAdapter.subscribeToState((remoteState) => {
			const onlineState = remoteState as OnlineGameState;
			const remoteVersion = onlineState.syncVersion || 0;
			const lastUpdatedBy = onlineState.lastUpdatedBy;

			// Skip if this update came from us
			if (lastUpdatedBy === localPlayerSlot) {
				lastSyncedVersionRef.current = Math.max(
					lastSyncedVersionRef.current,
					remoteVersion,
				);
				localVersionRef.current = Math.max(
					localVersionRef.current,
					remoteVersion,
				);
				return;
			}

			// Only apply if remote is newer
			if (remoteVersion > lastSyncedVersionRef.current) {
				lastSyncedVersionRef.current = remoteVersion;
				localVersionRef.current = remoteVersion;

				// Cancel any pending match check (opponent's turn now)
				if (matchCheckTimeoutRef.current) {
					clearTimeout(matchCheckTimeoutRef.current);
					matchCheckTimeoutRef.current = null;
				}
				isCheckingMatchRef.current = false;

				setGameState(remoteState);
			}
		});

		return () => unsubscribe();
	}, [isOnlineMode, syncAdapter, roomCode, localPlayerSlot]);

	// ============================================
	// Actions - endTurn (defined early for use in useEffect)
	// ============================================

	const endTurn = useCallback(() => {
		// Clear any pending match check
		if (matchCheckTimeoutRef.current) {
			clearTimeout(matchCheckTimeoutRef.current);
			matchCheckTimeoutRef.current = null;
		}
		isCheckingMatchRef.current = false;

		// Use GameEngine to end turn
		const newState = engineEndTurn(gameState);
		setGameState(newState);

		if (isOnlineMode) {
			syncToFirestore(newState, "endTurn");
		}

		// Notify turn change (players passed in from settings/presence)
		const nextPlayerId = newState.currentPlayer;
		const nextPlayerName =
			getPlayerById(players, nextPlayerId)?.name ||
			`Player ${nextPlayerId}`;
		effectManager?.notifyTurnChange(nextPlayerName, nextPlayerId);
	}, [gameState, isOnlineMode, syncToFirestore, effectManager, players]);

	// ============================================
	// Stuck Game Detection
	// ============================================

	useEffect(() => {
		if (!isAuthoritative) return;

		const flippedUnmatched = gameState.cards.filter(
			(c) => c.isFlipped && !c.isMatched,
		);
		const hasPendingMatchResolution =
			flippedUnmatched.length >= 2 ||
			isCheckingMatchRef.current ||
			!!matchCheckTimeoutRef.current;

		if (hasPendingMatchResolution && !cardsFlippedAtRef.current) {
			cardsFlippedAtRef.current = Date.now();
		} else if (!hasPendingMatchResolution && cardsFlippedAtRef.current) {
			cardsFlippedAtRef.current = null;
		}

		if (stuckCheckIntervalRef.current) {
			clearInterval(stuckCheckIntervalRef.current);
			stuckCheckIntervalRef.current = null;
		}

		if (hasPendingMatchResolution) {
			stuckCheckIntervalRef.current = setInterval(() => {
				if (cardsFlippedAtRef.current) {
					const elapsed = Date.now() - cardsFlippedAtRef.current;
					if (elapsed > STUCK_THRESHOLD_MS && isAuthoritative) {
						console.log("[STUCK DETECTION] Auto-triggering endTurn");
						endTurn();
					}
				}
			}, 5000);
		}

		return () => {
			if (stuckCheckIntervalRef.current) {
				clearInterval(stuckCheckIntervalRef.current);
				stuckCheckIntervalRef.current = null;
			}
		};
	}, [gameState.cards, isAuthoritative, endTurn]);

	// ============================================
	// Match Check Logic
	// ============================================

	const checkForMatch = useCallback(
		(_selectedIds: string[], currentState: GameState) => {
			// Double-check authority
			if (isOnlineMode && localPlayerSlot !== currentState.currentPlayer) {
				console.warn("[MATCH CHECK] Lost authority, aborting");
				return;
			}

			isCheckingMatchRef.current = true;

			const matchResult = checkMatch(currentState);
			if (!matchResult) {
				console.error("[MATCH CHECK] Could not find selected cards");
				isCheckingMatchRef.current = false;
				return;
			}

			const { isMatch, firstCard, secondCard } = matchResult;
			const cardIds: [string, string] = [firstCard.id, secondCard.id];
			const currentPlayerId = currentState.currentPlayer;
			const currentPlayerName =
				getPlayerById(players, currentPlayerId)?.name ||
				`Player ${currentPlayerId}`;

			if (isMatch) {
				// PHASE 1: Start flying animation
				const flyingState = startMatchAnimation(
					currentState,
					cardIds,
					currentPlayerId,
				);

				setGameState(flyingState);
				if (isOnlineMode) {
					syncToFirestore(flyingState, `match:flying`);
				}

				// Notify effect manager
				effectManager?.notifyMatchFound(currentPlayerName, currentPlayerId);

				// PHASE 2: Complete match after animation
				setTimeout(() => {
					setGameState((prevState) => {
						const matchedState = completeMatchAnimation(
							prevState,
							cardIds,
							currentPlayerId,
						);
						const finalState = checkAndFinishGame(matchedState);

						if (isOnlineMode) {
							syncToFirestore(finalState, `match:complete`);
						}

						// Check for game over - derive winner/isTie from cards
						if (finalState.gameStatus === "finished") {
							const { winner, isTie } = calculateWinner(finalState.cards, players);
							effectManager?.notifyGameOver(winner, isTie);
						}

						return finalState;
					});
				}, MATCH_ANIMATION_DURATION);

				isCheckingMatchRef.current = false;
			} else {
				// No match - flip back and switch turns
				const noMatchState = applyNoMatchWithReset(currentState, cardIds);

				setGameState(noMatchState);
				if (isOnlineMode) {
					syncToFirestore(noMatchState, `noMatch`);
				}

				// Notify effect manager of turn change
				const nextPlayerId = noMatchState.currentPlayer;
				const nextPlayerName =
					getPlayerById(players, nextPlayerId)?.name ||
					`Player ${nextPlayerId}`;
				effectManager?.notifyTurnChange(nextPlayerName, nextPlayerId);

				isCheckingMatchRef.current = false;
			}
		},
		[isOnlineMode, localPlayerSlot, syncToFirestore, effectManager, players],
	);

	// ============================================
	// Actions
	// ============================================

	const flipCard = useCallback(
		(cardId: string) => {
			// Online mode: strict turn enforcement
			if (isOnlineMode && localPlayerSlot !== gameState.currentPlayer) {
				console.log("[FLIP] Not your turn");
				return;
			}

			// Prevent during match check
			if (isCheckingMatchRef.current) {
				console.log("[FLIP] Match check in progress");
				return;
			}

			// Validate flip using GameEngine
			if (!canFlipCard(gameState, cardId)) {
				return;
			}

			// Apply flip using GameEngine
			const newState = engineFlipCard(gameState, cardId);
			setGameState(newState);

			// Sync immediately in online mode
			if (isOnlineMode) {
				syncToFirestore(newState, `flip:${cardId}`);
			}

			// Schedule match check if 2 cards selected (derived from card state)
			const selectedCards = newState.cards.filter(c => c.isFlipped && !c.isMatched);
			if (selectedCards.length === 2) {
				if (matchCheckTimeoutRef.current) {
					clearTimeout(matchCheckTimeoutRef.current);
				}

				const selectedCardIds = selectedCards.map(c => c.id);
				matchCheckTimeoutRef.current = setTimeout(() => {
					matchCheckTimeoutRef.current = null;
					checkForMatch(selectedCardIds, newState);
				}, settings.flipDuration);
			}
		},
		[
			gameState,
			isOnlineMode,
			localPlayerSlot,
			settings.flipDuration,
			syncToFirestore,
			checkForMatch,
		],
	);

	const resetGame = useCallback(() => {
		// Clear timeouts
		if (matchCheckTimeoutRef.current) {
			clearTimeout(matchCheckTimeoutRef.current);
			matchCheckTimeoutRef.current = null;
		}
		isCheckingMatchRef.current = false;
		cardsFlippedAtRef.current = null;
	}, []);

	const setFullGameState = useCallback(
		(newState: GameState) => {
			setGameState(newState);

			if (isOnlineMode) {
				const version = (newState as OnlineGameState).syncVersion || 0;
				lastSyncedVersionRef.current = version;
				localVersionRef.current = version;
			}
		},
		[isOnlineMode],
	);

	const initializeGame = useCallback((cards: Card[]) => {
		setIsAnimating(true);
		setGameState((prev) => ({
			...prev,
			cards,
			gameStatus: "setup",
		}));
	}, []);

	const startGame = useCallback(() => {
		setGameState((prev) => ({
			...prev,
			gameStatus: "playing",
		}));
		setIsAnimating(false);

		// Notify game start (players passed in from settings/presence)
		const firstPlayerId = gameState.currentPlayer;
		const firstPlayerName =
			getPlayerById(players, firstPlayerId)?.name ||
			`Player ${firstPlayerId}`;
		effectManager?.notifyGameStart(firstPlayerName, firstPlayerId);
	}, [gameState.currentPlayer, players, effectManager]);

	// ============================================
	// Player Management
	// Note: Player names/colors are stored in settings, not game state
	// These functions just persist to localStorage; actual state updates
	// happen via the gameStore.setPlayerName/setPlayerColor actions
	// ============================================

	const updatePlayerName = useCallback(
		(playerId: number, newName: string) => {
			const trimmedName = newName.trim();
			if (!trimmedName) return;

			// Persist to localStorage (gameStore handles the actual state update)
			localStorage.setItem(`player${playerId}Name`, trimmedName);
		},
		[],
	);

	const updatePlayerColor = useCallback(
		(playerId: number, newColor: string) => {
			// Persist to localStorage (gameStore handles the actual state update)
			localStorage.setItem(`player${playerId}Color`, newColor);
		},
		[],
	);

	// ============================================
	// Settings Management
	// ============================================

	const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
		setSettings((prev) => {
			const updated = { ...prev, ...newSettings };

			// Persist relevant settings to localStorage
			if ("flipDuration" in newSettings) {
				localStorage.setItem("flipDuration", String(updated.flipDuration));
			}
			if ("cardSize" in newSettings) {
				localStorage.setItem("cardSize", String(updated.cardSize));
			}
			if ("autoSizeEnabled" in newSettings) {
				localStorage.setItem(
					"autoSizeEnabled",
					String(updated.autoSizeEnabled),
				);
			}
			if ("useWhiteCardBackground" in newSettings) {
				localStorage.setItem(
					"useWhiteCardBackground",
					String(updated.useWhiteCardBackground),
				);
			}
			if ("emojiSizePercentage" in newSettings) {
				localStorage.setItem(
					"emojiSizePercentage",
					String(updated.emojiSizePercentage),
				);
			}
			if ("ttsEnabled" in newSettings) {
				localStorage.setItem("ttsEnabled", String(updated.ttsEnabled));
			}

			return updated;
		});
	}, []);

	const updateLayoutMetrics = useCallback((metrics: LayoutMetrics) => {
		setLayoutMetrics((prev) => {
			// Only update if values actually changed (prevent re-renders)
			if (
				Math.round(prev.boardWidth) === Math.round(metrics.boardWidth) &&
				Math.round(prev.boardAvailableHeight) ===
					Math.round(metrics.boardAvailableHeight) &&
				Math.round(prev.scoreboardHeight) ===
					Math.round(metrics.scoreboardHeight)
			) {
				return prev;
			}
			return metrics;
		});
	}, []);

	// ============================================
	// Utilities
	// ============================================

	const calculateOptimalCardSize = useCallback(
		(cardCount: number): number => {
			if (!settings.autoSizeEnabled || cardCount === 0) {
				return settings.cardSize;
			}

			const { boardWidth, boardAvailableHeight } = layoutMetrics;
			if (boardWidth === 0 || boardAvailableHeight === 0) {
				return settings.cardSize;
			}

			// Calculate optimal grid dimensions
			const aspectRatio = boardWidth / boardAvailableHeight;
			let bestSize = 0;

			for (let cols = 1; cols <= cardCount; cols++) {
				const rows = Math.ceil(cardCount / cols);
				const gridRatio = cols / rows;

				// Skip if grid aspect ratio is too different from container
				if (Math.abs(gridRatio - aspectRatio) > 1) continue;

				const maxCardWidth = (boardWidth - (cols + 1) * 8) / cols;
				const maxCardHeight = (boardAvailableHeight - (rows + 1) * 8) / rows;
				const size = Math.min(maxCardWidth, maxCardHeight);

				if (size > bestSize) {
					bestSize = size;
				}
			}

			// Clamp to reasonable range
			return Math.max(60, Math.min(200, Math.floor(bestSize)));
		},
		[settings.autoSizeEnabled, settings.cardSize, layoutMetrics],
	);

	// ============================================
	// Return
	// ============================================

	return {
		// State
		gameState,
		settings,
		layoutMetrics,
		isAnimating,
		isAuthoritative,

		// Actions
		flipCard,
		endTurn,
		resetGame,
		setFullGameState,
		initializeGame,
		startGame,

		// Player management
		updatePlayerName,
		updatePlayerColor,

		// Settings management
		updateSettings,
		updateLayoutMetrics,

		// Utilities
		calculateOptimalCardSize,
	};
}
