/**
 * useGameController - Unified hook for both local and online game modes
 *
 * This hook provides core game logic that can be used by useLocalGame and useOnlineGame,
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
	applyMatch,
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
	isAnimatingCards: boolean;

	// Actions
	flipCard: (cardId: string) => void;
	endTurn: () => void;
	resetGame: () => void;
	setFullGameState: (state: GameState) => void;
	initializeGame: (
		images: { id: string; url: string; gradient?: string }[],
		startPlaying?: boolean,
	) => void;
	startGame: () => void;
	startGameWithFirstPlayer: (firstPlayer: number) => void;

	// Player management
	updatePlayerName: (playerId: number, newName: string) => void;
	updatePlayerColor: (playerId: number, newColor: string) => void;

	// Settings management
	updateSettings: (settings: Partial<GameSettings>) => void;
	updateLayoutMetrics: (metrics: LayoutMetrics) => void;

	// Admin/Debug controls
	toggleAllCardsFlipped: () => void;
	endGameEarly: () => void;

	// Utilities
	calculateOptimalCardSize: (cardCount: number) => number;
}

// ============================================
// Constants
// ============================================

const STUCK_THRESHOLD_MS = 15000; // 15 seconds without resolution is stuck

// ============================================
// Helpers
// ============================================

/**
 * Convert imageId to human-readable card name for TTS
 * e.g. "african-elephant" -> "African Elephant"
 */
const formatCardNameForSpeech = (imageId: string): string => {
	return imageId
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

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
	const [isAnimatingCards, setIsAnimatingCards] = useState(false);

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
	// Track game round to detect resets
	const lastGameRoundRef = useRef(
		(initialGameState as OnlineGameState).gameRound || 0,
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

				// Preserve gameRound if state already has it (from previous sync)
				const currentGameRound =
					(state as OnlineGameState).gameRound ?? lastGameRoundRef.current;

				const onlineState: OnlineGameState = {
					...state,
					syncVersion: newVersion,
					lastUpdatedBy: localPlayerSlot,
					gameRound: currentGameRound,
				};

				await syncAdapter.setState(onlineState);

				console.log(`[SYNC] ${context || "unknown"}`, {
					version: newVersion,
					currentPlayer: state.currentPlayer,
					gameRound: currentGameRound,
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

		// Don't subscribe until we have a valid localPlayerSlot
		// This prevents the race condition where guest initially gets slot 1 as fallback
		// and then filters out host's first card flip thinking it's their own update
		if (!localPlayerSlot || localPlayerSlot < 1 || localPlayerSlot > 2) {
			console.log("[SUBSCRIPTION] Invalid localPlayerSlot, skipping", { localPlayerSlot });
			return;
		}

		const unsubscribe = syncAdapter.subscribeToState((remoteState) => {
			const onlineState = remoteState as OnlineGameState;
			const remoteVersion = onlineState.syncVersion || 0;
			const remoteGameRound = onlineState.gameRound || 0;
			const lastUpdatedBy = onlineState.lastUpdatedBy;

			// Check if this is a new game round (reset detected)
			// Use > instead of !== to reject stale updates from older rounds
			const isNewRound = remoteGameRound > lastGameRoundRef.current;

			// Skip if this update came from us (unless it's a new round)
			if (lastUpdatedBy === localPlayerSlot && !isNewRound) {
				// Still track version and round
				lastSyncedVersionRef.current = Math.max(
					lastSyncedVersionRef.current,
					remoteVersion,
				);
				localVersionRef.current = Math.max(
					localVersionRef.current,
					remoteVersion,
				);
				lastGameRoundRef.current = remoteGameRound;
				return;
			}

			// Apply if remote is newer OR if it's a new round (reset)
			if (remoteVersion > lastSyncedVersionRef.current || isNewRound) {
				if (isNewRound) {
					console.log("[SUBSCRIPTION] New round detected - resetting version tracking", {
						oldRound: lastGameRoundRef.current,
						newRound: remoteGameRound,
						remoteVersion,
					});
					// Reset version tracking for new round
					lastSyncedVersionRef.current = remoteVersion;
					localVersionRef.current = remoteVersion;
					lastGameRoundRef.current = remoteGameRound;
				} else {
					lastSyncedVersionRef.current = remoteVersion;
					localVersionRef.current = remoteVersion;
				}

				// Cancel any pending match check (opponent's turn now or game reset)
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
				// Apply match directly - animation is handled locally by GameBoard
				const matchedState = applyMatch(currentState, matchResult);
				const finalState = checkAndFinishGame(matchedState);

				setGameState(finalState);
				if (isOnlineMode) {
					syncToFirestore(finalState, `match:complete`);
				}

				// Notify effect manager (TTS will announce match with card name)
				const matchedCardName = formatCardNameForSpeech(firstCard.imageId);
				effectManager?.notifyMatchFound(currentPlayerName, currentPlayerId, matchedCardName);

				// Check for game over - derive winner/isTie from cards
				if (finalState.gameStatus === "finished") {
					const { winner, isTie } = calculateWinner(finalState.cards, players);
					effectManager?.notifyGameOver(winner, isTie);
				}

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
				const onlineState = newState as OnlineGameState;
				const version = onlineState.syncVersion || 0;
				const gameRound = onlineState.gameRound || 0;
				lastSyncedVersionRef.current = version;
				localVersionRef.current = version;
				lastGameRoundRef.current = gameRound;
			}
		},
		[isOnlineMode],
	);

	const initializeGame = useCallback(
		(
			images: { id: string; url: string; gradient?: string }[],
			startPlaying: boolean = false,
		) => {
			// Cancel any pending match check
			if (matchCheckTimeoutRef.current) {
				clearTimeout(matchCheckTimeoutRef.current);
				matchCheckTimeoutRef.current = null;
			}
			isCheckingMatchRef.current = false;

			// Create pairs of cards from images
			const cards: Card[] = [];
			images.forEach((image, index) => {
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

			// Shuffle cards
			const shuffledCards = [...cards].sort(() => Math.random() - 0.5);

			if (startPlaying) {
				// Start animation sequence
				setIsAnimatingCards(true);
				setIsAnimating(true);
				setGameState((prev) => ({
					...prev,
					cards: shuffledCards,
					gameStatus: "playing",
				}));

				// After animation completes, mark animation as done
				// 900ms per card animation + 30ms delay between cards
				const totalAnimationTime = shuffledCards.length * 30 + 900;
				setTimeout(() => {
					setIsAnimatingCards(false);
					setIsAnimating(false);
				}, totalAnimationTime);
			} else {
				setGameState((prev) => ({
					...prev,
					cards: shuffledCards,
					gameStatus: "setup",
				}));
			}
		},
		[],
	);

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

	const startGameWithFirstPlayer = useCallback(
		(firstPlayer: number) => {
			const firstPlayerName =
				getPlayerById(players, firstPlayer)?.name || `Player ${firstPlayer}`;

			// Notify effects (TTS will announce first player's turn)
			effectManager?.notifyGameStart(firstPlayerName, firstPlayer);

			setGameState((prev) => ({
				...prev,
				currentPlayer: firstPlayer,
				gameStatus: "playing" as const,
			}));

			// Persist first player preference to localStorage
			localStorage.setItem("firstPlayer", firstPlayer.toString());
		},
		[effectManager, players],
	);

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
	// Admin/Debug Controls
	// ============================================

	const toggleAllCardsFlipped = useCallback(() => {
		if (gameState.cards.length === 0) return;

		const unmatchedCards = gameState.cards.filter((c) => !c.isMatched);
		if (unmatchedCards.length === 0) return;

		const allFlipped = unmatchedCards.every((c) => c.isFlipped);
		const newFlippedState = !allFlipped;

		const newCards = gameState.cards.map((card) => {
			if (card.isMatched) {
				return card;
			}
			return { ...card, isFlipped: newFlippedState };
		});

		const newState: GameState = {
			...gameState,
			cards: newCards,
		};

		setGameState(newState);
		if (isOnlineMode) {
			syncToFirestore(
				newState,
				newFlippedState ? "admin:revealAll" : "admin:hideAll",
			);
		}
	}, [gameState, isOnlineMode, syncToFirestore]);

	const endGameEarly = useCallback(() => {
		if (gameState.gameStatus !== "playing" || gameState.cards.length === 0) {
			return;
		}

		// Set up test state: Player 1 gets 10 matches, Player 2 gets 9 matches
		// This leaves 1 pair (2 cards) unmatched for easy testing

		// Get all unmatched cards
		const unmatchedCards = gameState.cards.filter((c) => !c.isMatched);

		// Group unmatched cards by imageId to get pairs
		const cardPairs: { [imageId: string]: Card[] } = {};
		unmatchedCards.forEach((card) => {
			if (!cardPairs[card.imageId]) {
				cardPairs[card.imageId] = [];
			}
			cardPairs[card.imageId].push(card);
		});

		// Get complete pairs only (should be exactly 2 cards each)
		const pairs = Object.values(cardPairs).filter((pair) => pair.length === 2);

		// Find the last pair to leave unmatched
		const lastPair = pairs[pairs.length - 1];
		const lastPairImageId = lastPair?.[0]?.imageId;

		// Create a map of card ID to assigned player ID
		const cardToPlayerMap = new Map<string, number>();

		// Distribute pairs: 10 to Player 1, 9 to Player 2
		// Skip the last pair (leave it unmatched)
		const pairsToAssign = pairs.slice(0, -1);
		pairsToAssign.forEach((pair, index) => {
			// First 10 pairs go to Player 1, next 9 pairs go to Player 2
			const assignedPlayer = index < 10 ? 1 : 2;
			pair.forEach((card) => {
				cardToPlayerMap.set(card.id, assignedPlayer);
			});
		});

		// Update cards
		const newCards = gameState.cards.map((card) => {
			// Keep already matched cards as is
			if (card.isMatched) {
				return card;
			}

			// Keep the last pair unflipped and unmatched
			if (card.imageId === lastPairImageId) {
				return { ...card, isFlipped: false, isMatched: false };
			}

			// Check if this card should be matched
			const matchedByPlayerId = cardToPlayerMap.get(card.id);
			if (matchedByPlayerId !== undefined) {
				return {
					...card,
					isFlipped: true,
					isMatched: true,
					matchedByPlayerId,
				};
			}

			return card;
		});

		// Keep game in "playing" status so user can complete the final match
		const newState: GameState = {
			...gameState,
			cards: newCards,
		};

		setGameState(newState);
		if (isOnlineMode) {
			syncToFirestore(newState, "admin:endGameEarly");
		}
	}, [gameState, isOnlineMode, syncToFirestore]);

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
		isAnimatingCards,

		// Actions
		flipCard,
		endTurn,
		resetGame,
		setFullGameState,
		initializeGame,
		startGame,
		startGameWithFirstPlayer,

		// Player management
		updatePlayerName,
		updatePlayerColor,

		// Settings management
		updateSettings,
		updateLayoutMetrics,

		// Admin/Debug controls
		toggleAllCardsFlipped,
		endGameEarly,

		// Utilities
		calculateOptimalCardSize,
	};
}
