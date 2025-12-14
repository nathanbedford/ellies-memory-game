import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { Card, GameState } from "../types";
import { useTextToSpeech } from "./useTextToSpeech";
import {
	getPlayerById,
	canFlipCard,
	flipCard as engineFlipCard,
	checkMatch,
	applyMatch,
	applyNoMatchWithReset,
	checkAndFinishGame,
	endTurn as engineEndTurn,
	getPlayersFromSettings,
	calculateWinner,
	type PlayerSettings,
} from "../services/game/GameEngine";
import { calculateGridDimensions } from "../utils/gridLayout";
import { EffectManager, createTTSEffect } from "../services/effects";

// Helper function to format imageId into a readable name for TTS
const formatCardNameForSpeech = (imageId: string): string => {
	return imageId
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

export const useMemoryGame = () => {
	// Load player settings from localStorage
	const [playerSettings, setPlayerSettings] = useState<PlayerSettings>(() => ({
		player1Name: localStorage.getItem("player1Name") || "Player 1",
		player1Color: localStorage.getItem("player1Color") || "#3b82f6",
		player2Name: localStorage.getItem("player2Name") || "Player 2",
		player2Color: localStorage.getItem("player2Color") || "#10b981",
	}));

	// Derive players from settings
	const players = getPlayersFromSettings(playerSettings);

	const [gameState, setGameState] = useState<GameState>(() => {
		const savedFirstPlayer = parseInt(
			localStorage.getItem("firstPlayer") || "1",
		) as 1 | 2;

		return {
			cards: [],
			currentPlayer: savedFirstPlayer,
			gameStatus: "setup",
		};
	});

	const [showStartModal, setShowStartModal] = useState(false);
	const [cardSize, setCardSize] = useState(() => {
		// Load card size from localStorage
		const savedCardSize = localStorage.getItem("cardSize");
		return savedCardSize ? parseInt(savedCardSize, 10) : 100;
	});
	const [autoSizeEnabled, setAutoSizeEnabled] = useState(() => {
		// Load auto-size preference from localStorage, default to true
		const saved = localStorage.getItem("autoSizeEnabled");
		return saved === null ? true : saved === "true";
	});
	const [layoutMetrics, setLayoutMetrics] = useState({
		boardWidth: 0,
		boardAvailableHeight: 0,
		scoreboardHeight: 0,
	});
	const [useWhiteCardBackground, setUseWhiteCardBackground] = useState(() => {
		// Load white card background preference from localStorage
		const saved = localStorage.getItem("useWhiteCardBackground");
		return saved === "true"; // Default to false (use colorized backgrounds)
	});
	const [isAnimatingCards, setIsAnimatingCards] = useState(false);
	const isInitialLoadRef = useRef(true);
	const matchCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const isCheckingMatchRef = useRef(false);
	const ttsDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [flipDuration, setFlipDuration] = useState(() => {
		// Load flip duration from localStorage, default to 1500ms (1.5 seconds)
		const saved = localStorage.getItem("flipDuration");
		return saved ? parseInt(saved, 10) : 1500;
	});
	const [emojiSizePercentage, setEmojiSizePercentage] = useState(() => {
		// Load emoji size percentage from localStorage, default to 72 (matches current default: 0.4 * 1.8 = 0.72)
		const saved = localStorage.getItem("emojiSizePercentage");
		return saved ? parseInt(saved, 10) : 72;
	});

	const [ttsEnabled, setTtsEnabled] = useState(() => {
		// Load TTS enabled preference from localStorage, default to true
		const saved = localStorage.getItem("ttsEnabled");
		return saved === null ? true : saved === "true";
	});

	const [allCardsFlipped, setAllCardsFlipped] = useState(false);

	// Initialize text-to-speech
	const tts = useTextToSpeech();
	const { cancel: cancelTTS } = tts;

	// Create EffectManager singleton
	const effectManager = useMemo(() => new EffectManager(), []);

	// Register TTS effect when enabled
	useEffect(() => {
		const ttsEffect = createTTSEffect(tts, () => ttsEnabled);
		const unregister = effectManager.register(ttsEffect);
		return unregister;
	}, [effectManager, tts, ttsEnabled]);

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
					roundedPrev.boardAvailableHeight ===
						roundedNext.boardAvailableHeight &&
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

			// Calculate grid dimensions based on pair count
			const pairCount = Math.floor(cardCount / 2);
			const { columns, rows: gridRows } = calculateGridDimensions(pairCount);

			const horizontalPadding = 80;
			const gapSize = 8;
			const totalHorizontalGaps = (columns - 1) * gapSize;

			// Use provided metrics override, or fall back to state layoutMetrics
			const metrics = metricsOverride || layoutMetrics;

			// Use measured width if available, otherwise calculate from viewport
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

			// Use measured metrics if available, otherwise use viewport-based fallback
			// Scoreboard is typically ~90px + padding + gap, so reserve ~150px to be safe
			const scoreboardReserve =
				metrics.scoreboardHeight > 0 ? metrics.scoreboardHeight + 50 : 150;

			// Calculate available height: use measured if available, otherwise viewport minus reserve
			// When measured metrics aren't available, be more conservative with the reserve
			const measuredAvailableHeight =
				metrics.boardAvailableHeight > 0
					? metrics.boardAvailableHeight
					: Math.max(viewportHeight - scoreboardReserve - 20, actualRows); // Extra 20px buffer when using fallback

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

			console.log("[AUTO-SIZE] Calculated optimal size", {
				cardCount,
				pairCount,
				columns,
				actualRows,
				viewportWidth,
				viewportHeight,
				availableWidth: effectiveBoardWidth,
				availableHeight: effectiveAvailableHeight,
				totalVerticalGaps,
				maxWidthBasedSize,
				maxHeightBasedSize,
				optimalSize,
				verticalReserved: scoreboardReserve,
				usingMeasuredMetrics:
					metrics.boardWidth > 0 || metrics.boardAvailableHeight > 0,
				metricsOverrideProvided: !!metricsOverride,
			});

			return optimalSize;
		},
		[autoSizeEnabled, cardSize, layoutMetrics],
	);

	// Exported function for calculating card size based on card count
	// Can be called externally (e.g., when pack is selected) before cards are created
	// Optional metricsOverride allows passing measured metrics directly to bypass state timing issues
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

	useEffect(() => {
		if (!autoSizeEnabled || gameState.cards.length === 0) return;

		const optimalSize = calculateOptimalCardSize(gameState.cards.length);
		if (optimalSize !== cardSize) {
			setCardSize(optimalSize);
			localStorage.setItem("cardSize", optimalSize.toString());
		}
	}, [
		autoSizeEnabled,
		calculateOptimalCardSize,
		cardSize,
		gameState.cards.length,
	]);

	// Game state is no longer persisted - always starts fresh on refresh

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

			const cards: Card[] = [];

			// Note: Card size is calculated in handleStartGame before initializeGame is called
			// with measured metrics passed directly to avoid state timing issues

			// Create pairs of cards
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

	const startGame = useCallback(
		(player1Name: string, player2Name: string, firstPlayer: number) => {
			// Load player colors from localStorage (preferences)
			const savedPlayer1Color =
				localStorage.getItem("player1Color") || "#3b82f6";
			const savedPlayer2Color =
				localStorage.getItem("player2Color") || "#10b981";
			// Update player settings
			setPlayerSettings({
				player1Name,
				player1Color: savedPlayer1Color,
				player2Name,
				player2Color: savedPlayer2Color,
			});
			setGameState({
				cards: [],
				currentPlayer: firstPlayer,
				gameStatus: "setup",
			});
			// Don't show modal yet - wait for cards to be initialized
		},
		[],
	);

	const startGameWithFirstPlayer = useCallback(
		(firstPlayer: number) => {
			const firstPlayerName =
				players.find((p) => p.id === firstPlayer)?.name ||
				`Player ${firstPlayer}`;

			// Notify effects (TTS will announce first player's turn)
			effectManager.notifyGameStart(firstPlayerName, firstPlayer);

			setGameState((prev) => ({
				...prev,
				currentPlayer: firstPlayer,
				gameStatus: "playing" as const,
			}));
			setShowStartModal(false);
			localStorage.setItem("firstPlayer", firstPlayer.toString());
			isInitialLoadRef.current = false;
		},
		[effectManager, players],
	);

	const showStartGameModal = useCallback(() => {
		console.log("showStartGameModal called"); // Debug log
		setShowStartModal(true);
	}, []);

	const increaseCardSize = useCallback(() => {
		setCardSize((prev) => {
			const newSize = Math.min(prev + 10, 300); // Max 300px
			localStorage.setItem("cardSize", newSize.toString());
			return newSize;
		});
	}, []);

	const decreaseCardSize = useCallback(() => {
		setCardSize((prev) => {
			const newSize = Math.max(prev - 10, 60); // Min 60px
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

	const updatePlayerName = useCallback((playerId: 1 | 2, newName: string) => {
		const trimmedName = newName.trim();
		// Save to localStorage (preference, not game state)
		localStorage.setItem(`player${playerId}Name`, trimmedName);
		// Update player settings (players derived from settings)
		setPlayerSettings((prev) =>
			playerId === 1
				? { ...prev, player1Name: trimmedName }
				: { ...prev, player2Name: trimmedName }
		);
	}, []);

	const updatePlayerColor = useCallback((playerId: 1 | 2, newColor: string) => {
		// Save to localStorage (preference, not game state)
		localStorage.setItem(`player${playerId}Color`, newColor);
		// Update player settings (players derived from settings)
		setPlayerSettings((prev) =>
			playerId === 1
				? { ...prev, player1Color: newColor }
				: { ...prev, player2Color: newColor }
		);
	}, []);

	const resetGame = useCallback(() => {
		// Cancel any pending match check
		if (matchCheckTimeoutRef.current) {
			clearTimeout(matchCheckTimeoutRef.current);
			matchCheckTimeoutRef.current = null;
		}
		// Cancel any pending TTS
		if (ttsDelayTimeoutRef.current) {
			clearTimeout(ttsDelayTimeoutRef.current);
			ttsDelayTimeoutRef.current = null;
		}
		cancelTTS();
		isCheckingMatchRef.current = false;
		setAllCardsFlipped(false);

		// Clear saved game state from sessionStorage
		sessionStorage.removeItem("gameState");

		// Reset clears cards and goes back to setup mode
		// Player settings are preserved
		setGameState((prev) => ({
			...prev,
			cards: [],
			gameStatus: "setup",
		}));
	}, [cancelTTS]);

	const checkForMatch = useCallback(
		(selectedIds: string[]) => {
			// Prevent duplicate match checks
			if (isCheckingMatchRef.current) {
				console.log(
					"[MATCH CHECK] Match check already in progress, ignoring duplicate call",
					JSON.stringify({ selectedIds }),
				);
				return;
			}

			isCheckingMatchRef.current = true;
			matchCheckTimeoutRef.current = null;

			console.log(
				"[MATCH CHECK] Starting match check",
				JSON.stringify({ selectedIds, timestamp: new Date().toISOString() }),
			);

			setGameState((prev) => {
				const [firstId, secondId] = selectedIds;

				// Derive selected cards from card state
				const currentSelectedCards = prev.cards.filter(c => c.isFlipped && !c.isMatched);
				const currentSelectedIds = currentSelectedCards.map(c => c.id);

				// Verify the cards are still selected (prevent race conditions)
				if (
					currentSelectedCards.length !== 2 ||
					!currentSelectedIds.includes(firstId) ||
					!currentSelectedIds.includes(secondId)
				) {
					console.log(
						"[MATCH CHECK] Cards no longer selected, ignoring",
						JSON.stringify({
							selectedIds,
							currentSelectedCards: currentSelectedIds,
						}),
					);
					isCheckingMatchRef.current = false;
					return prev;
				}

				// Use GameEngine to check for match
				const matchResult = checkMatch(prev);

				if (!matchResult) {
					console.warn("[MATCH CHECK] Cards not found!");
					isCheckingMatchRef.current = false;
					return prev;
				}

				const { isMatch, firstCard, secondCard } = matchResult;
				const cardIds: [string, string] = [firstCard.id, secondCard.id];

				console.log(
					"[MATCH CHECK] Match result",
					JSON.stringify({
						isMatch,
						imageId1: firstCard.imageId,
						imageId2: secondCard.imageId,
					}),
				);

				if (isMatch) {
					const currentPlayerId = prev.currentPlayer;
					const matchedPlayerName =
						getPlayerById(players, currentPlayerId)?.name ||
						`Player ${currentPlayerId}`;
					const matchedCardName = formatCardNameForSpeech(firstCard.imageId);

					console.log(
						"[MATCH CHECK] ✓ MATCH FOUND! Applying match directly",
						JSON.stringify({
							cardIds,
							playerId: currentPlayerId,
							playerName: matchedPlayerName,
							cardName: matchedCardName,
						}),
					);

					// Apply match directly - animation is handled locally by GameBoard
					const matchedState = applyMatch(prev, matchResult);

					// Check if game is finished
					const finalState = checkAndFinishGame(matchedState);

					console.log(
						"[MATCH CHECK] Cards marked as matched",
						JSON.stringify({
							matchedCount: finalState.cards.filter((c) => c.isMatched).length,
							gameStatus: finalState.gameStatus,
						}),
					);

					// Notify effects (TTS will announce match with card name)
					effectManager.notifyMatchFound(matchedPlayerName, currentPlayerId, matchedCardName);

					// Check if game ended and notify
					if (finalState.gameStatus === "finished") {
						const { winner, isTie } = calculateWinner(finalState.cards, players);
						effectManager.notifyGameOver(winner, isTie);
					}

					// Reset checking flag
					requestAnimationFrame(() => {
						requestAnimationFrame(() => {
							isCheckingMatchRef.current = false;
						});
					});

					return finalState;
				} else {
					// Use GameEngine for no match: flip back and switch player
					console.log(
						"[MATCH CHECK] ✗ NO MATCH - Flipping cards back",
						JSON.stringify({
							cardIds,
							currentPlayer: prev.currentPlayer,
						}),
					);

					const noMatchState = applyNoMatchWithReset(prev, cardIds);
					const nextPlayer = noMatchState.currentPlayer;

					console.log(
						"[MATCH CHECK] State update complete",
						JSON.stringify({
							cardsCount: noMatchState.cards.length,
							currentPlayer: nextPlayer,
						}),
					);

					// Notify effects (TTS will announce turn change)
					const nextPlayerName =
						getPlayerById(players, nextPlayer)?.name ||
						`Player ${nextPlayer}`;
					effectManager.notifyTurnChange(nextPlayerName, nextPlayer);

					// Reset the checking flag
					requestAnimationFrame(() => {
						requestAnimationFrame(() => {
							isCheckingMatchRef.current = false;
						});
					});

					return noMatchState;
				}
			});
		},
		[effectManager, players],
	);

	const endTurn = useCallback(() => {
		// Cancel any pending match check
		if (matchCheckTimeoutRef.current) {
			clearTimeout(matchCheckTimeoutRef.current);
			matchCheckTimeoutRef.current = null;
		}
		// Cancel any pending TTS
		if (ttsDelayTimeoutRef.current) {
			clearTimeout(ttsDelayTimeoutRef.current);
			ttsDelayTimeoutRef.current = null;
		}
		cancelTTS();
		isCheckingMatchRef.current = false;

		setGameState((prev) => {
			// Use GameEngine to end the turn
			const newState = engineEndTurn(prev);

			console.log(
				"[END TURN] Manually ending turn",
				JSON.stringify({
					previousPlayer: prev.currentPlayer,
					nextPlayer: newState.currentPlayer,
					flippedCardsCount: prev.cards.filter(
						(c) => c.isFlipped && !c.isMatched,
					).length,
					timestamp: new Date().toISOString(),
				}),
			);

			return newState;
		});
	}, [cancelTTS]);

	const increaseFlipDuration = useCallback(() => {
		setFlipDuration((prev) => {
			const newDuration = Math.min(prev + 500, 10000); // Max 10 seconds
			localStorage.setItem("flipDuration", newDuration.toString());
			return newDuration;
		});
	}, []);

	const decreaseFlipDuration = useCallback(() => {
		setFlipDuration((prev) => {
			const newDuration = Math.max(prev - 500, 500); // Min 0.5 seconds
			localStorage.setItem("flipDuration", newDuration.toString());
			return newDuration;
		});
	}, []);

	const increaseEmojiSize = useCallback(() => {
		setEmojiSizePercentage((prev) => {
			const newPercentage = Math.min(prev + 5, 150); // Max 150%
			localStorage.setItem("emojiSizePercentage", newPercentage.toString());
			return newPercentage;
		});
	}, []);

	const decreaseEmojiSize = useCallback(() => {
		setEmojiSizePercentage((prev) => {
			const newPercentage = Math.max(prev - 5, 20); // Min 20%
			localStorage.setItem("emojiSizePercentage", newPercentage.toString());
			return newPercentage;
		});
	}, []);

	const toggleTtsEnabled = useCallback(() => {
		setTtsEnabled((prev) => {
			const newValue = !prev;
			localStorage.setItem("ttsEnabled", newValue.toString());
			// Cancel any ongoing TTS when disabling
			if (!newValue) {
				cancelTTS();
				if (ttsDelayTimeoutRef.current) {
					clearTimeout(ttsDelayTimeoutRef.current);
					ttsDelayTimeoutRef.current = null;
				}
			}
			return newValue;
		});
	}, [cancelTTS]);

	const flipCard = useCallback(
		(cardId: string) => {
			// Prevent card flips during match checks to avoid race conditions
			if (isCheckingMatchRef.current) {
				console.log(
					"[FLIP CARD] Match check in progress, ignoring card click",
					JSON.stringify({
						cardId,
						timestamp: new Date().toISOString(),
					}),
				);
				return;
			}

			setGameState((prev) => {
				// Derive selected cards from card state
				const prevSelectedCards = prev.cards.filter(c => c.isFlipped && !c.isMatched);
				const prevSelectedIds = prevSelectedCards.map(c => c.id);

				console.log(
					"[FLIP CARD] Card clicked",
					JSON.stringify({
						cardId,
						gameStatus: prev.gameStatus,
						selectedCardsCount: prevSelectedCards.length,
						selectedCards: prevSelectedIds,
						timestamp: new Date().toISOString(),
					}),
				);

				// Use GameEngine to validate if card can be flipped
				if (!canFlipCard(prev, cardId)) {
					console.log(
						"[FLIP CARD] Card cannot be flipped (validated by GameEngine)",
					);
					return prev;
				}

				// Use GameEngine to flip the card
				const newState = engineFlipCard(prev, cardId);

				// Derive new selected cards from new state
				const newSelectedCards = newState.cards.filter(c => c.isFlipped && !c.isMatched);
				const newSelectedIds = newSelectedCards.map(c => c.id);

				console.log(
					"[FLIP CARD] Card flipped, new selected cards",
					JSON.stringify({
						newSelectedCards: newSelectedIds,
						willCheckMatch: newSelectedCards.length === 2,
					}),
				);

				// Check for match when two cards are selected
				if (newSelectedCards.length === 2) {
					// Cancel any existing match check timeout
					if (matchCheckTimeoutRef.current) {
						console.log("[FLIP CARD] Cancelling existing match check timeout");
						clearTimeout(matchCheckTimeoutRef.current);
						matchCheckTimeoutRef.current = null;
					}

					console.log(
						"[FLIP CARD] Scheduling match check",
						JSON.stringify({
							selectedCards: newSelectedIds,
							duration: flipDuration,
						}),
					);
					matchCheckTimeoutRef.current = setTimeout(() => {
						console.log(
							"[FLIP CARD] Match check timeout fired, calling checkForMatch",
						);
						matchCheckTimeoutRef.current = null;
						checkForMatch(newSelectedIds);
					}, flipDuration);
				}

				return newState;
			});
		},
		[checkForMatch, flipDuration],
	);

	const endGameEarly = useCallback(() => {
		setGameState((prev) => {
			if (prev.gameStatus !== "playing" || prev.cards.length === 0) {
				return prev;
			}

			// Set up test state: Player 1 gets 10 matches, Player 2 gets 9 matches
			// This leaves 1 pair (2 cards) unmatched for easy testing

			// Get all unmatched cards
			const unmatchedCards = prev.cards.filter((c) => !c.isMatched);

			// Group unmatched cards by imageId to get pairs
			const cardPairs: { [imageId: string]: Card[] } = {};
			unmatchedCards.forEach((card) => {
				if (!cardPairs[card.imageId]) {
					cardPairs[card.imageId] = [];
				}
				cardPairs[card.imageId].push(card);
			});

			// Get complete pairs only (should be exactly 2 cards each)
			const pairs = Object.values(cardPairs).filter(
				(pair) => pair.length === 2,
			);

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
				// Assign both cards in the pair to the same player
				pair.forEach((card) => {
					cardToPlayerMap.set(card.id, assignedPlayer);
				});
			});

			// Update cards
			const newCards = prev.cards.map((card) => {
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
			return {
				...prev,
				cards: newCards,
				// gameStatus stays "playing" - don't finish the game yet
			};
		});
	}, []);

	const toggleAllCardsFlipped = useCallback(() => {
		setGameState((prev) => {
			if (prev.cards.length === 0) return prev;

			// Check if all unmatched cards are currently flipped
			const unmatchedCards = prev.cards.filter(
				(c) => !c.isMatched,
			);
			const allFlipped =
				unmatchedCards.length > 0 && unmatchedCards.every((c) => c.isFlipped);
			const newFlippedState = !allFlipped;

			setAllCardsFlipped(newFlippedState);

			const newCards = prev.cards.map((card) => {
				// Don't flip matched cards
				if (card.isMatched) {
					return card;
				}
				return { ...card, isFlipped: newFlippedState };
			});

			return {
				...prev,
				cards: newCards,
			};
		});
	}, []);

	// Test function: Advance game to end state - flip all cards except last pair, mark them as matched, and distribute evenly between players
	const flipAllExceptLastPair = useCallback(() => {
		setGameState((prev) => {
			if (prev.cards.length === 0) return prev;

			// Find the last pair (cards with the same imageId that appear last)
			const lastPairImageId = prev.cards[prev.cards.length - 1]?.imageId;
			if (!lastPairImageId) return prev;

			// Get all cards that should be matched (all except the last pair)
			const cardsToMatch: Card[] = [];

			prev.cards.forEach((card) => {
				if (card.imageId !== lastPairImageId && !card.isMatched) {
					cardsToMatch.push(card);
				}
			});

			// Group cards by imageId to get pairs
			const cardPairs: { [imageId: string]: Card[] } = {};
			cardsToMatch.forEach((card) => {
				if (!cardPairs[card.imageId]) {
					cardPairs[card.imageId] = [];
				}
				cardPairs[card.imageId].push(card);
			});

			// Get complete pairs only (should be exactly 2 cards each)
			const pairs = Object.values(cardPairs).filter(
				(pair) => pair.length === 2,
			);

			// Create a map of card ID to assigned player ID
			const cardToPlayerMap = new Map<string, number>();

			// Distribute pairs evenly between players
			pairs.forEach((pair, index) => {
				const assignedPlayer = index % 2 === 0 ? 1 : 2;
				// Assign both cards in the pair to the same player
				pair.forEach((card) => {
					cardToPlayerMap.set(card.id, assignedPlayer);
				});
			});

			// Update cards
			const newCards = prev.cards.map((card) => {
				// Keep the last pair unflipped and unmatched
				if (card.imageId === lastPairImageId) {
					return { ...card, isFlipped: false, isMatched: false };
				}

				// If already matched, keep as is
				if (card.isMatched) {
					return card;
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

			// Score is now derived from cards - no need to update player.score

			return {
				...prev,
				cards: newCards,
			};
		});
	}, []);

	// Set full game state (for online multiplayer sync)
	const setFullGameState = useCallback((newState: GameState) => {
		setGameState(newState);
	}, []);

	return {
		gameState,
		players, // Derived from settings
		setFullGameState,
		showStartModal,
		setShowStartModal,
		cardSize,
		autoSizeEnabled,
		useWhiteCardBackground,
		flipDuration,
		emojiSizePercentage,
		ttsEnabled,
		initializeGame,
		startGame,
		startGameWithFirstPlayer,
		showStartGameModal,
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
		flipCard,
		endTurn,
		resetGame,
		isAnimatingCards,
		flipAllExceptLastPair,
		endGameEarly,
		toggleAllCardsFlipped,
		allCardsFlipped,
		updateAutoSizeMetrics,
		calculateOptimalCardSizeForCount,
		effectManager, // Exposed so it can be shared with useOnlineGame
	};
};
