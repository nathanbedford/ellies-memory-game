/**
 * useOnlineGame - Hook for online multiplayer game logic
 *
 * Key principles:
 * 1. Current turn player is "authoritative" - runs game logic, syncs results
 * 2. Non-authoritative player is render-only - just displays Firestore updates
 * 3. Optimistic updates - authoritative player sees instant feedback
 * 4. Single source of truth - Firestore state is canonical
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { getFirestoreSyncAdapter } from "../services/sync/FirestoreSyncAdapter";
import { logger } from "../services/logging/LogService";
import type { GameState, OnlineGameState, Player } from "../types";
import {
	getPlayerScore,
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
import type { EffectManager } from "../services/effects";

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

interface UseOnlineGameOptions {
	roomCode: string;
	localPlayerSlot: number;
	flipDuration: number;
	initialGameState: GameState;
	players: Player[];
	effectManager?: EffectManager;
}

export function useOnlineGame(options: UseOnlineGameOptions) {
	const { roomCode, localPlayerSlot, flipDuration, initialGameState, players, effectManager } = options;

	// Game state - starts with initial state from room
	const [gameState, setGameState] = useState<GameState>(initialGameState);

	// Match check timer and guard
	const matchCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const isCheckingMatchRef = useRef(false);
	const checkForMatchRef = useRef<
		((selectedIds: string[], currentState: GameState) => void) | null
	>(null);

	// Stuck game detection - track when cards were flipped
	const cardsFlippedAtRef = useRef<number | null>(null);
	const stuckCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
		null,
	);
	const STUCK_THRESHOLD_MS = 60000; // Only recover after a full minute with no progress

	// Sync version tracking to prevent processing our own updates
	const lastSyncedVersionRef = useRef(0);
	const localVersionRef = useRef(
		(initialGameState as OnlineGameState).syncVersion || 0,
	);
	// Track game round to detect resets
	const lastGameRoundRef = useRef(
		(initialGameState as OnlineGameState).gameRound || 0,
	);

	// Track if this client is authoritative (it's our turn)
	const isAuthoritative = localPlayerSlot === gameState.currentPlayer;

	// Set logger context for this room/player
	useEffect(() => {
		logger.setContext(roomCode, localPlayerSlot as 1 | 2);
		return () => logger.setContext(null, null);
	}, [roomCode, localPlayerSlot]);

	// Sync function - sends state to Firestore
	const syncToFirestore = useCallback(
		async (state: GameState, context?: string) => {
			const syncId = Date.now().toString(36); // Unique ID for this sync operation
			try {
				const adapter = getFirestoreSyncAdapter();
				const adapterRoomCode = adapter.getRoomCode();

				const flippedUnmatched = state.cards.filter(
					(c) => c.isFlipped && !c.isMatched,
				);

				logger.debug(`Sync starting: ${context || "unknown"}`, {
					syncId,
					adapterRoomCode,
					currentPlayer: state.currentPlayer,
					flippedUnmatchedCount: flippedUnmatched.length,
					flippedUnmatchedIds: flippedUnmatched.map((c) => c.id),
				});

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

				await adapter.setState(onlineState);

				logger.debug(`Sync success: ${context || "unknown"}`, {
					syncId,
					version: newVersion,
					currentPlayer: state.currentPlayer,
					flippedUnmatchedCount: flippedUnmatched.length,
					matchedCards: state.cards.filter((c) => c.isMatched).length,
				});
			} catch (error) {
				logger.error(`Sync failed: ${context || "unknown"}`, {
					syncId,
					error: error instanceof Error ? error.message : String(error),
					currentPlayer: state.currentPlayer,
				});
			}
		},
		[roomCode, localPlayerSlot],
	);

	// Subscribe to Firestore updates (for receiving opponent's moves)
	useEffect(() => {
		if (!roomCode) {
			logger.debug("No roomCode, skipping subscription");
			return;
		}

		// Don't subscribe until we have a valid localPlayerSlot
		// This prevents the race condition where guest initially gets slot 1 as fallback
		// and then filters out host's first card flip thinking it's their own update
		if (!localPlayerSlot || localPlayerSlot < 1 || localPlayerSlot > 2) {
			logger.debug("Invalid localPlayerSlot, skipping subscription", { localPlayerSlot });
			return;
		}

		const adapter = getFirestoreSyncAdapter();
		const adapterRoomCode = adapter.getRoomCode();

		logger.info("Setting up Firestore subscription", {
			adapterRoomCode,
		});

		// Verify adapter is connected to the right room
		if (adapterRoomCode !== roomCode) {
			logger.warn("Adapter roomCode mismatch!", {
				expected: roomCode,
				actual: adapterRoomCode,
			});
		}

		const unsubscribe = adapter.subscribeToState((remoteState) => {
			logger.debug("Subscription callback received state", {
				syncVersion: (remoteState as OnlineGameState).syncVersion,
				gameRound: (remoteState as OnlineGameState).gameRound,
				lastUpdatedBy: (remoteState as OnlineGameState).lastUpdatedBy,
			});

			const onlineState = remoteState as OnlineGameState;
			const remoteVersion = onlineState.syncVersion || 0;
			const remoteGameRound = onlineState.gameRound || 0;
			const lastUpdatedBy = onlineState.lastUpdatedBy;

			// Check if this is a new game round (reset detected)
			// Use > instead of !== to reject stale updates from older rounds
			const isNewRound = remoteGameRound > lastGameRoundRef.current;

			// Skip if this update came from us (unless it's a new round)
			if (lastUpdatedBy === localPlayerSlot && !isNewRound) {
				logger.trace("Skipping self-update", {
					lastUpdatedBy,
					version: remoteVersion,
					gameRound: remoteGameRound,
				});
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
				const flippedUnmatched = onlineState.cards.filter(
					(c: { isFlipped: boolean; isMatched: boolean }) =>
						c.isFlipped && !c.isMatched,
				);
				const matchedCards = onlineState.cards.filter(
					(c: { isMatched: boolean }) => c.isMatched,
				);

				if (isNewRound) {
					logger.info("New round detected - resetting version tracking", {
						oldRound: lastGameRoundRef.current,
						newRound: remoteGameRound,
						remoteVersion,
						localVersion: lastSyncedVersionRef.current,
						lastUpdatedBy,
					});
					// Reset version tracking for new round
					lastSyncedVersionRef.current = remoteVersion;
					localVersionRef.current = remoteVersion;
					lastGameRoundRef.current = remoteGameRound;
				} else {
					logger.debug("Applying remote state", {
						remoteVersion,
						localVersion: lastSyncedVersionRef.current,
						lastUpdatedBy,
						currentPlayer: onlineState.currentPlayer,
						flippedUnmatchedCount: flippedUnmatched.length,
						flippedUnmatchedIds: flippedUnmatched.map(
							(c: { id: string }) => c.id,
						),
						matchedCount: matchedCards.length,
					});

					lastSyncedVersionRef.current = remoteVersion;
					localVersionRef.current = remoteVersion;
				}

				// Cancel any pending match check (opponent's turn now or game reset)
				if (matchCheckTimeoutRef.current) {
					logger.debug("Cancelling pending match check due to remote update");
					clearTimeout(matchCheckTimeoutRef.current);
					matchCheckTimeoutRef.current = null;
				}
				isCheckingMatchRef.current = false;

				// Apply the remote state directly
				// Note: winner and isTie are now derived, not stored in state
				setGameState(remoteState);
			} else {
				logger.trace("Ignoring stale remote state", {
					remoteVersion,
					localVersion: lastSyncedVersionRef.current,
					remoteGameRound,
					localGameRound: lastGameRoundRef.current,
				});
			}
		});

		return () => {
			logger.debug("Cleaning up subscription");
			unsubscribe();
		};
	}, [roomCode, localPlayerSlot]);

	// Flip card - only works if authoritative
	const flipCard = useCallback(
		(cardId: string) => {
			// Strict turn enforcement
			if (localPlayerSlot !== gameState.currentPlayer) {
				logger.trace("Not your turn, ignoring flip");
				return;
			}

			// Prevent during match check
			if (isCheckingMatchRef.current) {
				logger.trace("Match check in progress, ignoring flip");
				return;
			}

			// Use GameEngine to validate if card can be flipped
			if (!canFlipCard(gameState, cardId)) {
				logger.trace("Card cannot be flipped (validated by GameEngine)");
				return;
			}

			// Use GameEngine to flip the card
			const newState = engineFlipCard(gameState, cardId);

			setGameState(newState);

			// Sync to Firestore immediately
			syncToFirestore(newState, `flipCard:${cardId}`);

			// Derive selected cards from card state
			const selectedCards = newState.cards.filter(c => c.isFlipped && !c.isMatched);
			const selectedCardIds = selectedCards.map(c => c.id);

			logger.debug("Card flipped", {
				cardId,
				selectedCards: selectedCardIds,
				isSecondCard: selectedCards.length === 2,
			});

			// Schedule match check if 2 cards selected
			if (selectedCards.length === 2) {
				// Cancel any existing timeout
				if (matchCheckTimeoutRef.current) {
					logger.trace("Cancelling existing match check timeout");
					clearTimeout(matchCheckTimeoutRef.current);
				}

				logger.debug("Scheduling match check", {
					selectedCards: selectedCardIds,
					flipDuration,
				});

				matchCheckTimeoutRef.current = setTimeout(() => {
					logger.trace("Match check timeout fired", {
						selectedCards: selectedCardIds,
					});
					matchCheckTimeoutRef.current = null;
					if (checkForMatchRef.current) {
						checkForMatchRef.current(selectedCardIds, newState);
					}
				}, flipDuration);
			}
		},
		[gameState, localPlayerSlot, flipDuration, syncToFirestore],
	);

	// Check for match - only authoritative client runs this
	const checkForMatch = useCallback(
		(selectedIds: string[], currentState: GameState) => {
			const checkId = Date.now().toString(36);

			// Log the full state for debugging
			const flippedCards = currentState.cards.filter(
				(c) => c.isFlipped && !c.isMatched,
			);
			logger.debug(`Match check starting`, {
				checkId,
				selectedIds,
				currentPlayer: currentState.currentPlayer,
				isAuthoritative: localPlayerSlot === currentState.currentPlayer,
				flippedCardIds: flippedCards.map((c) => c.id),
				flippedCardCount: flippedCards.length,
			});

			// Double-check we're still authoritative
			if (localPlayerSlot !== currentState.currentPlayer) {
				logger.warn(`Match check aborted - lost authority`, {
					checkId,
					currentPlayer: currentState.currentPlayer,
				});
				return;
			}

			isCheckingMatchRef.current = true;

			// Use GameEngine to check for match
			const matchResult = checkMatch(currentState);

			if (!matchResult) {
				logger.error(`Match check aborted - cards not found`, {
					checkId,
					flippedCardIds: flippedCards.map((c) => c.id),
					selectedIds,
				});
				isCheckingMatchRef.current = false;
				return;
			}

			const { isMatch, firstCard, secondCard } = matchResult;
			const cardIds: [string, string] = [firstCard.id, secondCard.id];

			logger.debug(`Match check comparing cards`, {
				checkId,
				isMatch,
				firstCard: { id: firstCard.id, imageId: firstCard.imageId },
				secondCard: { id: secondCard.id, imageId: secondCard.imageId },
			});

			if (isMatch) {
				// Apply match directly - animation is handled locally by GameBoard
				const matchedState = applyMatch(currentState, matchResult);

				// Check if game is finished
				const finalState = checkAndFinishGame(matchedState);

				logger.info(`Match found - applying match directly`, {
					checkId,
					cardIds,
					playerId: currentState.currentPlayer,
					newScore: getPlayerScore(finalState.cards, currentState.currentPlayer),
					gameStatus: finalState.gameStatus,
				});

				setGameState(finalState);
				syncToFirestore(
					finalState,
					`match:${cardIds[0]}+${cardIds[1]}`,
				);

				// Notify effects (TTS will announce match with card name)
				const currentPlayerId = currentState.currentPlayer;
				const matchedPlayerName = getPlayerById(players, currentPlayerId)?.name || `Player ${currentPlayerId}`;
				const matchedCardName = formatCardNameForSpeech(firstCard.imageId);
				effectManager?.notifyMatchFound(matchedPlayerName, currentPlayerId, matchedCardName);

				// Check if game ended and notify
				if (finalState.gameStatus === "finished") {
					const { winner, isTie } = calculateWinner(finalState.cards, players);
					effectManager?.notifyGameOver(winner, isTie);
				}

				isCheckingMatchRef.current = false;
			} else {
				// No match: flip back and switch turns
				const beforeFlippedCards = currentState.cards.filter(
					(c) => c.isFlipped && !c.isMatched,
				);
				logger.debug(`No match - flipping cards back`, {
					checkId,
					cardIds,
					currentPlayer: currentState.currentPlayer,
					beforeFlippedCount: beforeFlippedCards.length,
					beforeFlippedIds: beforeFlippedCards.map((c) => c.id),
				});

				const noMatchState = applyNoMatchWithReset(currentState, cardIds);

				const afterFlippedCards = noMatchState.cards.filter(
					(c) => c.isFlipped && !c.isMatched,
				);
				logger.debug(`Switching turn`, {
					checkId,
					fromPlayer: currentState.currentPlayer,
					toPlayer: noMatchState.currentPlayer,
					afterFlippedCount: afterFlippedCards.length,
					afterFlippedIds: afterFlippedCards.map((c) => c.id),
				});

				setGameState(noMatchState);
				syncToFirestore(
					noMatchState,
					`noMatch:flipBack:${cardIds[0]}+${cardIds[1]}`,
				);

				logger.debug(`Match check complete - state synced`, { checkId });

				// Notify effects of turn change
				const nextPlayer = noMatchState.currentPlayer;
				const nextPlayerName = getPlayerById(players, nextPlayer)?.name || `Player ${nextPlayer}`;
				effectManager?.notifyNoMatch();
				effectManager?.notifyTurnChange(nextPlayerName, nextPlayer);

				isCheckingMatchRef.current = false;
			}
		},
		[localPlayerSlot, syncToFirestore, players, effectManager],
	);

	// Update ref whenever checkForMatch changes
	useEffect(() => {
		checkForMatchRef.current = checkForMatch;
	}, [checkForMatch]);

	// Reset game (for when leaving online mode)
	const resetGame = useCallback(() => {
		if (matchCheckTimeoutRef.current) {
			clearTimeout(matchCheckTimeoutRef.current);
			matchCheckTimeoutRef.current = null;
		}
		isCheckingMatchRef.current = false;
	}, []);

	// Set full game state - used when receiving initial state
	const setFullGameState = useCallback((newState: GameState) => {
		setGameState(newState);
		const onlineState = newState as OnlineGameState;
		const version = onlineState.syncVersion || 0;
		const gameRound = onlineState.gameRound || 0;
		lastSyncedVersionRef.current = version;
		localVersionRef.current = version;
		lastGameRoundRef.current = gameRound;
	}, []);

	// End turn manually (emergency button)
	const endTurn = useCallback(() => {
		const flippedUnmatched = gameState.cards.filter(
			(c) => c.isFlipped && !c.isMatched,
		);

		logger.info("Manual end turn triggered", {
			currentPlayer: gameState.currentPlayer,
			flippedUnmatchedCount: flippedUnmatched.length,
			hadPendingMatchCheck: !!matchCheckTimeoutRef.current,
		});

		if (matchCheckTimeoutRef.current) {
			clearTimeout(matchCheckTimeoutRef.current);
			matchCheckTimeoutRef.current = null;
		}
		isCheckingMatchRef.current = false;

		// Use GameEngine to end the turn
		const newState = engineEndTurn(gameState);

		logger.debug("Switching turn and flipping cards back", {
			fromPlayer: gameState.currentPlayer,
			toPlayer: newState.currentPlayer,
			cardsFlippedBack: flippedUnmatched.length,
		});

		setGameState(newState);
		syncToFirestore(newState, "endTurn:manual");
	}, [gameState, syncToFirestore]);

	// Note: Player names are managed via presence data (RTDB) in online mode,
	// not via game state. See OnlineLobby for presence-based player info.

	const toggleAllCardsFlipped = useCallback(() => {
		if (gameState.cards.length === 0) return;

		const unmatchedCards = gameState.cards.filter(
			(c) => !c.isMatched,
		);
		if (unmatchedCards.length === 0) {
			return;
		}

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
		syncToFirestore(
			newState,
			newFlippedState ? "admin:revealAll" : "admin:hideAll",
		);
	}, [gameState, syncToFirestore]);

	const endGameEarly = useCallback(() => {
		if (gameState.gameStatus !== "playing" || gameState.cards.length === 0) {
			return;
		}

		// Set up test state: Player 1 gets 10 matches, Player 2 gets 9 matches
		// This leaves 1 pair (2 cards) unmatched for easy testing

		// Get all unmatched cards
		const unmatchedCards = gameState.cards.filter((c) => !c.isMatched);

		// Group unmatched cards by imageId to get pairs
		const cardPairs: {
			[imageId: string]: Array<(typeof gameState.cards)[number]>;
		} = {};
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
			// Assign both cards in the pair to the same player
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
			// gameStatus stays "playing" - don't finish the game yet
		};

		setGameState(newState);
		syncToFirestore(newState, "admin:endGameEarly");
	}, [gameState, syncToFirestore]);

	// Stuck game detection - monitors for cards stuck in flipped state
	useEffect(() => {
		const flippedUnmatched = gameState.cards.filter(
			(c) => c.isFlipped && !c.isMatched,
		);
		const authoritativeTurn = localPlayerSlot === gameState.currentPlayer;
		const resolutionInFlight =
			isCheckingMatchRef.current || !!matchCheckTimeoutRef.current;
		const hasTwoUnmatched = flippedUnmatched.length >= 2;
		const shouldMonitor =
			authoritativeTurn && hasTwoUnmatched && !resolutionInFlight;

		if (shouldMonitor && cardsFlippedAtRef.current === null) {
			cardsFlippedAtRef.current = Date.now();
			logger.trace("Monitoring potential stuck cards", {
				flippedCards: flippedUnmatched.map((c) => c.id),
				currentPlayer: gameState.currentPlayer,
				resolutionInFlight,
			});
		} else if (!shouldMonitor && cardsFlippedAtRef.current !== null) {
			const duration = Date.now() - cardsFlippedAtRef.current;
			logger.trace("Stuck monitoring cleared", { durationMs: duration });
			cardsFlippedAtRef.current = null;
		}

		if (stuckCheckIntervalRef.current) {
			clearInterval(stuckCheckIntervalRef.current);
			stuckCheckIntervalRef.current = null;
		}

		if (shouldMonitor) {
			stuckCheckIntervalRef.current = setInterval(() => {
				if (cardsFlippedAtRef.current === null) return;

				const elapsed = Date.now() - cardsFlippedAtRef.current;
				if (elapsed > STUCK_THRESHOLD_MS) {
					logger.warn("Stuck game detected!", {
						elapsedMs: elapsed,
						flippedCards: gameState.cards
							.filter((c) => c.isFlipped && !c.isMatched)
							.map((c) => c.id),
						currentPlayer: gameState.currentPlayer,
						isCheckingMatch: isCheckingMatchRef.current,
						hasPendingMatchCheck: !!matchCheckTimeoutRef.current,
					});

					if (authoritativeTurn) {
						logger.info("Triggering auto-recovery via endTurn");
						cardsFlippedAtRef.current = null;
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
	}, [
		gameState.cards,
		gameState.currentPlayer,
		localPlayerSlot,
		endTurn,
	]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (matchCheckTimeoutRef.current) {
				clearTimeout(matchCheckTimeoutRef.current);
			}
			if (stuckCheckIntervalRef.current) {
				clearInterval(stuckCheckIntervalRef.current);
			}
		};
	}, []);

	return {
		gameState,
		setFullGameState,
		flipCard,
		endTurn,
		resetGame,
		isAuthoritative,
		toggleAllCardsFlipped,
		endGameEarly,
	};
}
