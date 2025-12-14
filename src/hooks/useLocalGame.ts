/**
 * useLocalGame - Hook for local (same-device) game mode
 *
 * This hook composes useGameController with settings management to provide
 * a complete local game experience for same-device multiplayer.
 *
 * Key principles:
 * 1. Uses useGameController for core game logic
 * 2. Manages game settings (card size, flip duration, TTS, etc.)
 * 3. Creates and manages EffectManager for TTS and other effects
 * 4. Provides admin controls for testing/debugging
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import type { Card, GameState } from "../types";
import { useGameController } from "./useGameController";
import { useTextToSpeech } from "./useTextToSpeech";
import {
	getPlayersFromSettings,
	type PlayerSettings,
} from "../services/game/GameEngine";
import { EffectManager, createTTSEffect } from "../services/effects";
import { calculateGridDimensions } from "../utils/gridLayout";

export interface UseLocalGameReturn {
	// State
	gameState: GameState;
	players: ReturnType<typeof getPlayersFromSettings>;
	showStartModal: boolean;
	setShowStartModal: (show: boolean) => void;
	isAnimatingCards: boolean;

	// Settings
	cardSize: number;
	autoSizeEnabled: boolean;
	useWhiteCardBackground: boolean;
	flipDuration: number;
	emojiSizePercentage: number;
	ttsEnabled: boolean;

	// Game actions
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
	flipCard: (cardId: string) => void;
	endTurn: () => void;
	resetGame: () => void;
	setFullGameState: (state: GameState) => void;

	// Settings actions
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

	// Admin controls
	flipAllExceptLastPair: () => void;
	endGameEarly: () => void;
	toggleAllCardsFlipped: () => void;
	allCardsFlipped: boolean;

	// Layout
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

	// Effect manager (for sharing with online mode)
	effectManager: EffectManager;
}

export function useLocalGame(): UseLocalGameReturn {
	// ============================================
	// Player Settings State
	// ============================================

	const [playerSettings, setPlayerSettings] = useState<PlayerSettings>(() => ({
		player1Name: localStorage.getItem("player1Name") || "Player 1",
		player1Color: localStorage.getItem("player1Color") || "#3b82f6",
		player2Name: localStorage.getItem("player2Name") || "Player 2",
		player2Color: localStorage.getItem("player2Color") || "#10b981",
	}));

	const players = useMemo(
		() => getPlayersFromSettings(playerSettings),
		[playerSettings],
	);

	// ============================================
	// Settings State
	// ============================================

	const [cardSize, setCardSize] = useState(() => {
		const saved = localStorage.getItem("cardSize");
		return saved ? parseInt(saved, 10) : 100;
	});

	const [autoSizeEnabled, setAutoSizeEnabled] = useState(() => {
		const saved = localStorage.getItem("autoSizeEnabled");
		return saved === null ? true : saved === "true";
	});

	const [useWhiteCardBackground, setUseWhiteCardBackground] = useState(() => {
		const saved = localStorage.getItem("useWhiteCardBackground");
		return saved === "true";
	});

	const [flipDuration, setFlipDuration] = useState(() => {
		const saved = localStorage.getItem("flipDuration");
		return saved ? parseInt(saved, 10) : 1500;
	});

	const [emojiSizePercentage, setEmojiSizePercentage] = useState(() => {
		const saved = localStorage.getItem("emojiSizePercentage");
		return saved ? parseInt(saved, 10) : 72;
	});

	const [ttsEnabled, setTtsEnabled] = useState(() => {
		const saved = localStorage.getItem("ttsEnabled");
		return saved === null ? true : saved === "true";
	});

	const [layoutMetrics, setLayoutMetrics] = useState({
		boardWidth: 0,
		boardAvailableHeight: 0,
		scoreboardHeight: 0,
	});

	// ============================================
	// UI State
	// ============================================

	const [showStartModal, setShowStartModal] = useState(false);
	const [allCardsFlipped, setAllCardsFlipped] = useState(false);

	// ============================================
	// Effect Manager & TTS
	// ============================================

	const tts = useTextToSpeech();
	const effectManager = useMemo(() => new EffectManager(), []);

	useEffect(() => {
		const ttsEffect = createTTSEffect(tts, () => ttsEnabled);
		const unregister = effectManager.register(ttsEffect);
		return unregister;
	}, [effectManager, tts, ttsEnabled]);

	// ============================================
	// Game Controller
	// ============================================

	const savedFirstPlayer = parseInt(
		localStorage.getItem("firstPlayer") || "1",
	) as 1 | 2;

	const initialGameState: GameState = {
		cards: [],
		currentPlayer: savedFirstPlayer,
		gameStatus: "setup",
	};

	const controller = useGameController({
		mode: "local",
		initialGameState,
		initialSettings: {
			flipDuration,
			cardSize,
			autoSizeEnabled,
			useWhiteCardBackground,
			emojiSizePercentage,
			ttsEnabled,
		},
		players,
		effectManager,
	});

	// ============================================
	// Settings Actions
	// ============================================

	const updatePlayerName = useCallback((playerId: number, newName: string) => {
		const trimmedName = newName.trim();
		localStorage.setItem(`player${playerId}Name`, trimmedName);
		setPlayerSettings((prev) =>
			playerId === 1
				? { ...prev, player1Name: trimmedName }
				: { ...prev, player2Name: trimmedName },
		);
	}, []);

	const updatePlayerColor = useCallback((playerId: number, newColor: string) => {
		localStorage.setItem(`player${playerId}Color`, newColor);
		setPlayerSettings((prev) =>
			playerId === 1
				? { ...prev, player1Color: newColor }
				: { ...prev, player2Color: newColor },
		);
	}, []);

	const increaseCardSize = useCallback(() => {
		setCardSize((prev) => {
			const newSize = Math.min(prev + 10, 300);
			localStorage.setItem("cardSize", newSize.toString());
			return newSize;
		});
	}, []);

	const decreaseCardSize = useCallback(() => {
		setCardSize((prev) => {
			const newSize = Math.max(prev - 10, 60);
			localStorage.setItem("cardSize", newSize.toString());
			return newSize;
		});
	}, []);

	const toggleWhiteCardBackground = useCallback(() => {
		setUseWhiteCardBackground((prev) => {
			const newValue = !prev;
			localStorage.setItem("useWhiteCardBackground", newValue.toString());
			return newValue;
		});
	}, []);

	const toggleAutoSize = useCallback(() => {
		setAutoSizeEnabled((prev) => {
			const newValue = !prev;
			localStorage.setItem("autoSizeEnabled", newValue.toString());
			return newValue;
		});
	}, []);

	const increaseFlipDuration = useCallback(() => {
		setFlipDuration((prev) => {
			const newDuration = Math.min(prev + 500, 10000);
			localStorage.setItem("flipDuration", newDuration.toString());
			return newDuration;
		});
	}, []);

	const decreaseFlipDuration = useCallback(() => {
		setFlipDuration((prev) => {
			const newDuration = Math.max(prev - 500, 500);
			localStorage.setItem("flipDuration", newDuration.toString());
			return newDuration;
		});
	}, []);

	const increaseEmojiSize = useCallback(() => {
		setEmojiSizePercentage((prev) => {
			const newPercentage = Math.min(prev + 5, 150);
			localStorage.setItem("emojiSizePercentage", newPercentage.toString());
			return newPercentage;
		});
	}, []);

	const decreaseEmojiSize = useCallback(() => {
		setEmojiSizePercentage((prev) => {
			const newPercentage = Math.max(prev - 5, 20);
			localStorage.setItem("emojiSizePercentage", newPercentage.toString());
			return newPercentage;
		});
	}, []);

	const toggleTtsEnabled = useCallback(() => {
		setTtsEnabled((prev) => {
			const newValue = !prev;
			localStorage.setItem("ttsEnabled", newValue.toString());
			return newValue;
		});
	}, []);

	// ============================================
	// Layout Actions
	// ============================================

	const updateAutoSizeMetrics = useCallback(
		(metrics: {
			boardWidth: number;
			boardAvailableHeight: number;
			scoreboardHeight: number;
		}) => {
			setLayoutMetrics((prev) => {
				const roundedPrev = {
					boardWidth: Math.round(prev.boardWidth),
					boardAvailableHeight: Math.round(prev.boardAvailableHeight),
					scoreboardHeight: Math.round(prev.scoreboardHeight),
				};
				const roundedNext = {
					boardWidth: Math.round(metrics.boardWidth),
					boardAvailableHeight: Math.round(metrics.boardAvailableHeight),
					scoreboardHeight: Math.round(metrics.scoreboardHeight),
				};

				if (
					roundedPrev.boardWidth === roundedNext.boardWidth &&
					roundedPrev.boardAvailableHeight === roundedNext.boardAvailableHeight &&
					roundedPrev.scoreboardHeight === roundedNext.scoreboardHeight
				) {
					return prev;
				}

				return metrics;
			});
		},
		[],
	);

	const calculateOptimalCardSize = useCallback(
		(
			cardCount: number,
			metricsOverride?: {
				boardWidth: number;
				boardAvailableHeight: number;
				scoreboardHeight: number;
			},
		) => {
			if (!autoSizeEnabled || cardCount === 0) {
				return Math.min(Math.max(cardSize, 60), 300);
			}

			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			const pairCount = Math.floor(cardCount / 2);
			const { columns, rows: gridRows } = calculateGridDimensions(pairCount);

			const horizontalPadding = 80;
			const gapSize = 8;
			const totalHorizontalGaps = (columns - 1) * gapSize;

			const metrics = metricsOverride || layoutMetrics;

			const measuredBoardWidth =
				metrics.boardWidth > 0 ? metrics.boardWidth : 0;
			const effectiveBoardWidth = Math.max(
				measuredBoardWidth || viewportWidth - horizontalPadding,
				0,
			);

			const actualRows = Math.max(gridRows, 1);
			const widthForCards = Math.max(
				effectiveBoardWidth - totalHorizontalGaps,
				columns,
			);
			const maxWidthBasedSize = Math.floor(widthForCards / columns);

			const totalVerticalGaps = (actualRows - 1) * gapSize;
			const safetyMargin = 10;

			const scoreboardReserve =
				metrics.scoreboardHeight > 0 ? metrics.scoreboardHeight + 50 : 150;

			const measuredAvailableHeight =
				metrics.boardAvailableHeight > 0
					? metrics.boardAvailableHeight
					: Math.max(viewportHeight - scoreboardReserve - 20, actualRows);

			const effectiveAvailableHeight = Math.max(
				measuredAvailableHeight - safetyMargin,
				actualRows,
			);
			const heightForCards = Math.max(
				effectiveAvailableHeight - totalVerticalGaps,
				actualRows,
			);
			const maxHeightBasedSize = Math.floor(heightForCards / actualRows);

			const optimalSize = Math.min(
				300,
				Math.max(60, Math.min(maxWidthBasedSize, maxHeightBasedSize)),
			);

			return optimalSize;
		},
		[autoSizeEnabled, cardSize, layoutMetrics],
	);

	const calculateOptimalCardSizeForCount = useCallback(
		(
			cardCount: number,
			metricsOverride?: {
				boardWidth: number;
				boardAvailableHeight: number;
				scoreboardHeight: number;
			},
		) => {
			if (!autoSizeEnabled || cardCount === 0) {
				return;
			}

			const optimalSize = calculateOptimalCardSize(cardCount, metricsOverride);
			if (optimalSize !== cardSize) {
				setCardSize(optimalSize);
				localStorage.setItem("cardSize", optimalSize.toString());
			}
		},
		[autoSizeEnabled, calculateOptimalCardSize, cardSize],
	);

	// ============================================
	// Game Actions
	// ============================================

	const startGame = useCallback(
		(player1Name: string, player2Name: string, firstPlayer: number) => {
			const savedPlayer1Color =
				localStorage.getItem("player1Color") || "#3b82f6";
			const savedPlayer2Color =
				localStorage.getItem("player2Color") || "#10b981";

			setPlayerSettings({
				player1Name,
				player1Color: savedPlayer1Color,
				player2Name,
				player2Color: savedPlayer2Color,
			});

			controller.setFullGameState({
				cards: [],
				currentPlayer: firstPlayer,
				gameStatus: "setup",
			});
		},
		[controller],
	);

	const showStartGameModal = useCallback(() => {
		setShowStartModal(true);
	}, []);

	// ============================================
	// Admin Controls
	// ============================================

	const flipAllExceptLastPair = useCallback(() => {
		controller.setFullGameState(
			(() => {
				const prev = controller.gameState;
				if (prev.cards.length === 0) return prev;

				const lastPairImageId = prev.cards[prev.cards.length - 1]?.imageId;
				if (!lastPairImageId) return prev;

				const cardsToMatch: Card[] = [];
				prev.cards.forEach((card) => {
					if (card.imageId !== lastPairImageId && !card.isMatched) {
						cardsToMatch.push(card);
					}
				});

				const cardPairs: { [imageId: string]: Card[] } = {};
				cardsToMatch.forEach((card) => {
					if (!cardPairs[card.imageId]) {
						cardPairs[card.imageId] = [];
					}
					cardPairs[card.imageId].push(card);
				});

				const pairs = Object.values(cardPairs).filter(
					(pair) => pair.length === 2,
				);

				const cardToPlayerMap = new Map<string, number>();
				pairs.forEach((pair, index) => {
					const assignedPlayer = index % 2 === 0 ? 1 : 2;
					pair.forEach((card) => {
						cardToPlayerMap.set(card.id, assignedPlayer);
					});
				});

				const newCards = prev.cards.map((card) => {
					if (card.imageId === lastPairImageId) {
						return { ...card, isFlipped: false, isMatched: false };
					}
					if (card.isMatched) {
						return card;
					}
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

				return { ...prev, cards: newCards };
			})(),
		);
	}, [controller]);

	const endGameEarly = useCallback(() => {
		controller.setFullGameState(
			(() => {
				const prev = controller.gameState;
				if (prev.gameStatus !== "playing" || prev.cards.length === 0) {
					return prev;
				}

				const unmatchedCards = prev.cards.filter((c) => !c.isMatched);
				const cardPairs: { [imageId: string]: Card[] } = {};
				unmatchedCards.forEach((card) => {
					if (!cardPairs[card.imageId]) {
						cardPairs[card.imageId] = [];
					}
					cardPairs[card.imageId].push(card);
				});

				const pairs = Object.values(cardPairs).filter(
					(pair) => pair.length === 2,
				);

				const lastPair = pairs[pairs.length - 1];
				const lastPairImageId = lastPair?.[0]?.imageId;

				const cardToPlayerMap = new Map<string, number>();
				const pairsToAssign = pairs.slice(0, -1);
				pairsToAssign.forEach((pair, index) => {
					const assignedPlayer = index < 10 ? 1 : 2;
					pair.forEach((card) => {
						cardToPlayerMap.set(card.id, assignedPlayer);
					});
				});

				const newCards = prev.cards.map((card) => {
					if (card.isMatched) {
						return card;
					}
					if (card.imageId === lastPairImageId) {
						return { ...card, isFlipped: false, isMatched: false };
					}
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

				return { ...prev, cards: newCards };
			})(),
		);
	}, [controller]);

	const toggleAllCardsFlipped = useCallback(() => {
		controller.setFullGameState(
			(() => {
				const prev = controller.gameState;
				if (prev.cards.length === 0) return prev;

				const unmatchedCards = prev.cards.filter((c) => !c.isMatched);
				const currentAllFlipped =
					unmatchedCards.length > 0 && unmatchedCards.every((c) => c.isFlipped);
				const newFlippedState = !currentAllFlipped;

				setAllCardsFlipped(newFlippedState);

				const newCards = prev.cards.map((card) => {
					if (card.isMatched) {
						return card;
					}
					return { ...card, isFlipped: newFlippedState };
				});

				return { ...prev, cards: newCards };
			})(),
		);
	}, [controller]);

	// ============================================
	// Return
	// ============================================

	return {
		// State
		gameState: controller.gameState,
		players,
		showStartModal,
		setShowStartModal,
		isAnimatingCards: controller.isAnimatingCards,

		// Settings
		cardSize,
		autoSizeEnabled,
		useWhiteCardBackground,
		flipDuration,
		emojiSizePercentage,
		ttsEnabled,

		// Game actions
		initializeGame: controller.initializeGame,
		startGame,
		startGameWithFirstPlayer: controller.startGameWithFirstPlayer,
		showStartGameModal,
		flipCard: controller.flipCard,
		endTurn: controller.endTurn,
		resetGame: controller.resetGame,
		setFullGameState: controller.setFullGameState,

		// Settings actions
		updatePlayerName,
		updatePlayerColor,
		increaseCardSize,
		decreaseCardSize,
		toggleWhiteCardBackground,
		toggleAutoSize,
		increaseFlipDuration,
		decreaseFlipDuration,
		increaseEmojiSize,
		decreaseEmojiSize,
		toggleTtsEnabled,

		// Admin controls
		flipAllExceptLastPair,
		endGameEarly,
		toggleAllCardsFlipped,
		allCardsFlipped,

		// Layout
		updateAutoSizeMetrics,
		calculateOptimalCardSizeForCount,

		// Effect manager
		effectManager,
	};
}
