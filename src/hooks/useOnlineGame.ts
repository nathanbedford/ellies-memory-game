/**
 * useOnlineGame - Hook for online multiplayer game logic
 *
 * Key principles:
 * 1. Current turn player is "authoritative" - runs game logic, syncs results
 * 2. Non-authoritative player is render-only - just displays Firestore updates
 * 3. Optimistic updates - authoritative player sees instant feedback
 * 4. Single source of truth - Firestore state is canonical
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getFirestoreSyncAdapter } from '../services/sync/FirestoreSyncAdapter';
import type { GameState, OnlineGameState } from '../types';
import {
  getPlayerById,
  canFlipCard,
  flipCard as engineFlipCard,
  checkMatch,
  startMatchAnimation,
  completeMatchAnimation,
  applyNoMatchWithReset,
  checkAndFinishGame,
  endTurn as engineEndTurn,
  updatePlayerName as engineUpdatePlayerName,
} from '../services/game/GameEngine';

interface UseOnlineGameOptions {
  roomCode: string;
  localPlayerSlot: number;
  flipDuration: number;
  initialGameState: GameState;
}

export function useOnlineGame(options: UseOnlineGameOptions) {
  const { roomCode, localPlayerSlot, flipDuration, initialGameState } = options;

  // Game state - starts with initial state from room
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  // Match check timer and guard
  const matchCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCheckingMatchRef = useRef(false);

  // Stuck game detection - track when cards were flipped
  const cardsFlippedAtRef = useRef<number | null>(null);
  const stuckCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const STUCK_THRESHOLD_MS = 60000; // Only recover after a full minute with no progress

  // Sync version tracking to prevent processing our own updates
  const lastSyncedVersionRef = useRef(0);
  const localVersionRef = useRef((initialGameState as OnlineGameState).syncVersion || 0);

  // Track if this client is authoritative (it's our turn)
  const isAuthoritative = localPlayerSlot === gameState.currentPlayer;

  // Sync function - sends state to Firestore
  const syncToFirestore = useCallback(async (state: GameState, context?: string) => {
    const syncId = Date.now().toString(36); // Unique ID for this sync operation
    try {
      const adapter = getFirestoreSyncAdapter();
      const adapterRoomCode = adapter.getRoomCode();

      const flippedUnmatched = state.cards.filter(c => c.isFlipped && !c.isMatched);

      console.log(`[SYNC ${syncId}] Starting sync`, {
        context: context || 'unknown',
        roomCode,
        adapterRoomCode,
        localPlayerSlot,
        currentPlayer: state.currentPlayer,
        selectedCards: state.selectedCards,
        flippedUnmatchedCount: flippedUnmatched.length,
        flippedUnmatchedIds: flippedUnmatched.map(c => c.id),
      });

      // Increment version and mark who updated
      const newVersion = localVersionRef.current + 1;
      localVersionRef.current = newVersion;

      const onlineState: OnlineGameState = {
        ...state,
        syncVersion: newVersion,
        lastUpdatedBy: localPlayerSlot,
      };

      await adapter.setState(onlineState);

      console.log(`[SYNC ${syncId}] SUCCESS`, {
        version: newVersion,
        currentPlayer: state.currentPlayer,
        selectedCards: state.selectedCards.length,
        matchedCards: state.cards.filter(c => c.isMatched).length,
      });
    } catch (error) {
      console.error(`[SYNC ${syncId}] FAILED`, {
        context: context || 'unknown',
        error,
        roomCode,
        localPlayerSlot,
        currentPlayer: state.currentPlayer,
        selectedCards: state.selectedCards,
      });
    }
  }, [roomCode, localPlayerSlot]);

  // Subscribe to Firestore updates (for receiving opponent's moves)
  useEffect(() => {
    if (!roomCode) {
      console.log('[ONLINE GAME] No roomCode, skipping subscription');
      return;
    }

    const adapter = getFirestoreSyncAdapter();
    const adapterRoomCode = adapter.getRoomCode();

    console.log('[ONLINE GAME] Setting up subscription', {
      roomCode,
      adapterRoomCode,
      localPlayerSlot,
    });

    // Verify adapter is connected to the right room
    if (adapterRoomCode !== roomCode) {
      console.warn('[ONLINE GAME] Adapter roomCode mismatch!', {
        expected: roomCode,
        actual: adapterRoomCode,
      });
    }

    const unsubscribe = adapter.subscribeToState((remoteState) => {
      const onlineState = remoteState as OnlineGameState;
      const remoteVersion = onlineState.syncVersion || 0;
      const lastUpdatedBy = onlineState.lastUpdatedBy;

      // Skip if this update came from us
      if (lastUpdatedBy === localPlayerSlot) {
        console.log('[ONLINE GAME] Skipping self-update', {
          lastUpdatedBy,
          localPlayerSlot,
          version: remoteVersion,
        });
        // Still track version
        lastSyncedVersionRef.current = Math.max(lastSyncedVersionRef.current, remoteVersion);
        localVersionRef.current = Math.max(localVersionRef.current, remoteVersion);
        return;
      }

      // Only apply if remote is newer
      if (remoteVersion > lastSyncedVersionRef.current) {
        const flippedUnmatched = onlineState.cards.filter((c: { isFlipped: boolean; isMatched: boolean }) => c.isFlipped && !c.isMatched);
        const matchedCards = onlineState.cards.filter((c: { isMatched: boolean }) => c.isMatched);

        console.log('[ONLINE GAME] Applying remote state', {
          remoteVersion,
          localVersion: lastSyncedVersionRef.current,
          lastUpdatedBy,
          currentPlayer: onlineState.currentPlayer,
          selectedCards: onlineState.selectedCards,
          flippedUnmatchedCount: flippedUnmatched.length,
          flippedUnmatchedIds: flippedUnmatched.map((c: { id: string }) => c.id),
          matchedCount: matchedCards.length,
          timestamp: new Date().toISOString(),
        });

        lastSyncedVersionRef.current = remoteVersion;
        localVersionRef.current = remoteVersion;

        // Cancel any pending match check (opponent's turn now)
        if (matchCheckTimeoutRef.current) {
          console.log('[ONLINE GAME] Cancelling pending match check due to remote update');
          clearTimeout(matchCheckTimeoutRef.current);
          matchCheckTimeoutRef.current = null;
        }
        isCheckingMatchRef.current = false;

        setGameState(remoteState);
      } else {
        console.log('[ONLINE GAME] Ignoring stale remote state', {
          remoteVersion,
          localVersion: lastSyncedVersionRef.current,
        });
      }
    });

    return () => {
      console.log('[ONLINE GAME] Cleaning up subscription');
      unsubscribe();
    };
  }, [roomCode, localPlayerSlot]);

  // Flip card - only works if authoritative
  const flipCard = useCallback((cardId: string) => {
    // Strict turn enforcement
    if (localPlayerSlot !== gameState.currentPlayer) {
      console.log('[ONLINE GAME] Not your turn, ignoring flip');
      return;
    }

    // Prevent during match check
    if (isCheckingMatchRef.current) {
      console.log('[ONLINE GAME] Match check in progress, ignoring flip');
      return;
    }

    // Use GameEngine to validate if card can be flipped
    if (!canFlipCard(gameState, cardId)) {
      console.log('[ONLINE GAME] Card cannot be flipped (validated by GameEngine)');
      return;
    }

    // Use GameEngine to flip the card
    const newState = engineFlipCard(gameState, cardId);

    setGameState(newState);

    // Sync to Firestore immediately
    syncToFirestore(newState, `flipCard:${cardId}`);

    console.log('[FLIP] Card flipped', {
      cardId,
      selectedCards: newState.selectedCards,
      isSecondCard: newState.selectedCards.length === 2,
    });

    // Schedule match check if 2 cards selected
    if (newState.selectedCards.length === 2) {
      // Cancel any existing timeout
      if (matchCheckTimeoutRef.current) {
        console.log('[FLIP] Cancelling existing match check timeout');
        clearTimeout(matchCheckTimeoutRef.current);
      }

      console.log('[FLIP] Scheduling match check', {
        selectedCards: newState.selectedCards,
        flipDuration,
        scheduledAt: new Date().toISOString(),
      });

      matchCheckTimeoutRef.current = setTimeout(() => {
        console.log('[MATCH CHECK] Timeout fired', {
          selectedCards: newState.selectedCards,
          firedAt: new Date().toISOString(),
        });
        matchCheckTimeoutRef.current = null;
        checkForMatch(newState.selectedCards, newState);
      }, flipDuration);
    }
  }, [gameState, localPlayerSlot, flipDuration, syncToFirestore]);

  // Check for match - only authoritative client runs this
  const checkForMatch = useCallback((selectedIds: string[], currentState: GameState) => {
    const checkId = Date.now().toString(36);

    // Log the full state for debugging
    const flippedCards = currentState.cards.filter(c => c.isFlipped && !c.isMatched);
    console.log(`[MATCH CHECK ${checkId}] Starting`, {
      selectedIds,
      currentStateSelectedCards: currentState.selectedCards,
      currentPlayer: currentState.currentPlayer,
      localPlayerSlot,
      isAuthoritative: localPlayerSlot === currentState.currentPlayer,
      flippedCardIds: flippedCards.map(c => c.id),
      flippedCardCount: flippedCards.length,
    });

    // Double-check we're still authoritative
    if (localPlayerSlot !== currentState.currentPlayer) {
      console.warn(`[MATCH CHECK ${checkId}] ABORTED - Lost authority`, {
        localPlayerSlot,
        currentPlayer: currentState.currentPlayer,
      });
      return;
    }

    isCheckingMatchRef.current = true;

    // Use GameEngine to check for match
    const matchResult = checkMatch(currentState);

    if (!matchResult) {
      console.error(`[MATCH CHECK ${checkId}] ABORTED - Cards not found`, {
        selectedCards: currentState.selectedCards,
        selectedIds,
      });
      isCheckingMatchRef.current = false;
      return;
    }

    const { isMatch, firstCard, secondCard } = matchResult;
    const cardIds: [string, string] = [firstCard.id, secondCard.id];

    console.log(`[MATCH CHECK ${checkId}] Comparing cards`, {
      isMatch,
      firstCard: { id: firstCard.id, imageId: firstCard.imageId },
      secondCard: { id: secondCard.id, imageId: secondCard.imageId },
    });

    if (isMatch) {
      const currentPlayerId = currentState.currentPlayer;

      // Use GameEngine for Phase 1: flying animation
      const flyingState = startMatchAnimation(currentState, cardIds, currentPlayerId);

      console.log(`[MATCH CHECK ${checkId}] MATCH FOUND - Starting flying animation`, {
        cardIds,
        playerId: currentPlayerId,
        newScore: getPlayerById(flyingState.players, currentPlayerId)?.score,
      });

      setGameState(flyingState);
      syncToFirestore(flyingState, `match:flying:${cardIds[0]}+${cardIds[1]}`);

      // PHASE 2: After animation completes, mark cards as matched using GameEngine
      setTimeout(() => {
        console.log(`[MATCH CHECK ${checkId}] Phase 2 - Animation complete, marking cards as matched`, {
          cardIds,
          timestamp: new Date().toISOString(),
        });

        setGameState(prevState => {
          // Use GameEngine for Phase 2: complete match
          const matchedState = completeMatchAnimation(prevState, cardIds, currentPlayerId);

          // Use GameEngine to check if game is finished
          const finalState = checkAndFinishGame(matchedState);

          console.log(`[MATCH CHECK ${checkId}] Phase 2 - Syncing matched state`, {
            gameStatus: finalState.gameStatus,
            matchedCount: finalState.cards.filter(c => c.isMatched).length,
          });
          syncToFirestore(finalState, `match:complete:${cardIds[0]}+${cardIds[1]}`);

          return finalState;
        });
      }, 3000); // Match animation duration (matches CSS)

      isCheckingMatchRef.current = false;
      return; // Exit early - the setTimeout will handle the rest
    } else {
      // Use GameEngine for no match: flip back and switch turns
      const beforeFlippedCards = currentState.cards.filter(c => c.isFlipped && !c.isMatched);
      console.log(`[MATCH CHECK ${checkId}] NO MATCH - Flipping cards back`, {
        cardIds,
        currentPlayer: currentState.currentPlayer,
        beforeFlippedCount: beforeFlippedCards.length,
        beforeFlippedIds: beforeFlippedCards.map(c => c.id),
        timestamp: new Date().toISOString(),
      });

      const noMatchState = applyNoMatchWithReset(currentState, cardIds);

      const afterFlippedCards = noMatchState.cards.filter(c => c.isFlipped && !c.isMatched);
      console.log(`[MATCH CHECK ${checkId}] Switching turn`, {
        fromPlayer: currentState.currentPlayer,
        toPlayer: noMatchState.currentPlayer,
        afterFlippedCount: afterFlippedCards.length,
        afterFlippedIds: afterFlippedCards.map(c => c.id),
        card0State: noMatchState.cards.find(c => c.id === cardIds[0]),
        card1State: noMatchState.cards.find(c => c.id === cardIds[1]),
      });

      setGameState(noMatchState);
      syncToFirestore(noMatchState, `noMatch:flipBack:${cardIds[0]}+${cardIds[1]}`);

      console.log(`[MATCH CHECK ${checkId}] COMPLETE - State synced`, {
        timestamp: new Date().toISOString(),
      });

      isCheckingMatchRef.current = false;
    }
  }, [localPlayerSlot, syncToFirestore]);

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
    const version = (newState as OnlineGameState).syncVersion || 0;
    lastSyncedVersionRef.current = version;
    localVersionRef.current = version;
  }, []);

  // End turn manually (emergency button)
  const endTurn = useCallback(() => {
    const flippedUnmatched = gameState.cards.filter(c => c.isFlipped && !c.isMatched);

    console.log('[END TURN] Manual end turn triggered', {
      currentPlayer: gameState.currentPlayer,
      localPlayerSlot,
      selectedCards: gameState.selectedCards,
      flippedUnmatchedCount: flippedUnmatched.length,
      hadPendingMatchCheck: !!matchCheckTimeoutRef.current,
      timestamp: new Date().toISOString(),
    });

    if (matchCheckTimeoutRef.current) {
      clearTimeout(matchCheckTimeoutRef.current);
      matchCheckTimeoutRef.current = null;
    }
    isCheckingMatchRef.current = false;

    // Use GameEngine to end the turn
    const newState = engineEndTurn(gameState);

    console.log('[END TURN] Switching turn and flipping cards back', {
      fromPlayer: gameState.currentPlayer,
      toPlayer: newState.currentPlayer,
      cardsFlippedBack: flippedUnmatched.length,
    });

    setGameState(newState);
    syncToFirestore(newState, 'endTurn:manual');
  }, [gameState, localPlayerSlot, syncToFirestore]);

  // Update player name - syncs to Firestore
  const updatePlayerName = useCallback((playerId: 1 | 2, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    // Use GameEngine to update player name
    const newState = engineUpdatePlayerName(gameState, playerId, trimmedName);

    console.log('[ONLINE GAME] Updating player name', {
      playerId,
      newName: trimmedName,
      localPlayerSlot,
    });

    setGameState(newState);
    syncToFirestore(newState, `updatePlayerName:${playerId}`);
  }, [gameState, localPlayerSlot, syncToFirestore]);

  const toggleAllCardsFlipped = useCallback(() => {
    if (gameState.cards.length === 0) return;

    const unmatchedCards = gameState.cards.filter(c => !c.isMatched && !c.isFlyingToPlayer);
    if (unmatchedCards.length === 0) {
      return;
    }

    const allFlipped = unmatchedCards.every(c => c.isFlipped);
    const newFlippedState = !allFlipped;

    const newCards = gameState.cards.map(card => {
      if (card.isMatched || card.isFlyingToPlayer) {
        return card;
      }
      return { ...card, isFlipped: newFlippedState };
    });

    const newState: GameState = {
      ...gameState,
      cards: newCards,
      selectedCards: [],
    };

    setGameState(newState);
    syncToFirestore(newState, newFlippedState ? 'admin:revealAll' : 'admin:hideAll');
  }, [gameState, syncToFirestore]);

  // Stuck game detection - monitors for cards stuck in flipped state
  useEffect(() => {
    const flippedUnmatched = gameState.cards.filter(c => c.isFlipped && !c.isMatched);
    const authoritativeTurn = localPlayerSlot === gameState.currentPlayer;
    const resolutionInFlight = isCheckingMatchRef.current || !!matchCheckTimeoutRef.current;
    const hasTwoUnmatched = flippedUnmatched.length >= 2;
    const shouldMonitor = authoritativeTurn && hasTwoUnmatched && !resolutionInFlight;

    if (shouldMonitor && cardsFlippedAtRef.current === null) {
      cardsFlippedAtRef.current = Date.now();
      console.log('[STUCK DETECTION] Monitoring potential stuck cards', {
        flippedCards: flippedUnmatched.map(c => c.id),
        currentPlayer: gameState.currentPlayer,
        localPlayerSlot,
        selectedCards: gameState.selectedCards,
        resolutionInFlight,
      });
    } else if (!shouldMonitor && cardsFlippedAtRef.current !== null) {
      const duration = Date.now() - cardsFlippedAtRef.current;
      console.log('[STUCK DETECTION] Monitoring cleared', { durationMs: duration });
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
          console.warn('[STUCK DETECTION] STUCK GAME DETECTED!', {
            elapsedMs: elapsed,
            flippedCards: gameState.cards.filter(c => c.isFlipped && !c.isMatched).map(c => c.id),
            selectedCards: gameState.selectedCards,
            currentPlayer: gameState.currentPlayer,
            localPlayerSlot,
            isCheckingMatch: isCheckingMatchRef.current,
            hasPendingMatchCheck: !!matchCheckTimeoutRef.current,
            timestamp: new Date().toISOString(),
          });

          if (authoritativeTurn) {
            console.log('[STUCK DETECTION] Triggering auto-recovery via endTurn');
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
  }, [gameState.cards, gameState.currentPlayer, gameState.selectedCards, localPlayerSlot, endTurn]);

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
    updatePlayerName,
    toggleAllCardsFlipped,
  };
}
