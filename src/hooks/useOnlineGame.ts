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
import type { Player, GameState, OnlineGameState } from '../types';

// Helper to sort players by ID
const sortPlayersByID = (players: Player[]): Player[] => {
  return [...players].sort((a, b) => a.id - b.id);
};

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
  const STUCK_THRESHOLD_MS = 15000; // 15 seconds without resolution is considered stuck

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

    // Don't allow more than 2 cards
    if (gameState.selectedCards.length >= 2) {
      console.log('[ONLINE GAME] Already have 2 cards selected');
      return;
    }

    const card = gameState.cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) {
      return;
    }

    // Apply flip optimistically
    const newCards = gameState.cards.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    const newSelectedCards = [...gameState.selectedCards, cardId];

    const newState: GameState = {
      ...gameState,
      cards: newCards,
      selectedCards: newSelectedCards,
    };

    setGameState(newState);

    // Sync to Firestore immediately
    syncToFirestore(newState, `flipCard:${cardId}`);

    console.log('[FLIP] Card flipped', {
      cardId,
      selectedCards: newSelectedCards,
      isSecondCard: newSelectedCards.length === 2,
    });

    // Schedule match check if 2 cards selected
    if (newSelectedCards.length === 2) {
      // Cancel any existing timeout
      if (matchCheckTimeoutRef.current) {
        console.log('[FLIP] Cancelling existing match check timeout');
        clearTimeout(matchCheckTimeoutRef.current);
      }

      console.log('[FLIP] Scheduling match check', {
        selectedCards: newSelectedCards,
        flipDuration,
        scheduledAt: new Date().toISOString(),
      });

      matchCheckTimeoutRef.current = setTimeout(() => {
        console.log('[MATCH CHECK] Timeout fired', {
          selectedCards: newSelectedCards,
          firedAt: new Date().toISOString(),
        });
        matchCheckTimeoutRef.current = null;
        checkForMatch(newSelectedCards, newState);
      }, flipDuration);
    }
  }, [gameState, localPlayerSlot, flipDuration, syncToFirestore]);

  // Check for match - only authoritative client runs this
  const checkForMatch = useCallback((selectedIds: string[], currentState: GameState) => {
    const checkId = Date.now().toString(36);
    console.log(`[MATCH CHECK ${checkId}] Starting`, {
      selectedIds,
      currentPlayer: currentState.currentPlayer,
      localPlayerSlot,
      isAuthoritative: localPlayerSlot === currentState.currentPlayer,
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

    const [firstId, secondId] = selectedIds;
    const firstCard = currentState.cards.find(c => c.id === firstId);
    const secondCard = currentState.cards.find(c => c.id === secondId);

    if (!firstCard || !secondCard) {
      console.error(`[MATCH CHECK ${checkId}] ABORTED - Cards not found`, {
        firstId,
        secondId,
        firstCardFound: !!firstCard,
        secondCardFound: !!secondCard,
      });
      isCheckingMatchRef.current = false;
      return;
    }

    const isMatch = firstCard.imageId === secondCard.imageId;

    console.log(`[MATCH CHECK ${checkId}] Comparing cards`, {
      isMatch,
      firstCard: { id: firstId, imageId: firstCard.imageId },
      secondCard: { id: secondId, imageId: secondCard.imageId },
    });

    let newState: GameState;

    if (isMatch) {
      // PHASE 1: Mark cards as flying to player (triggers animation)
      const flyingCards = currentState.cards.map(c => {
        if (c.id === firstId || c.id === secondId) {
          return {
            ...c,
            isFlipped: true,
            isFlyingToPlayer: true,
            flyingToPlayerId: currentState.currentPlayer,
          };
        }
        return c;
      });

      // Update score immediately
      const newPlayers = sortPlayersByID(
        currentState.players.map(p =>
          p.id === currentState.currentPlayer
            ? { ...p, score: p.score + 1 }
            : p
        )
      );

      // Capture values for the timeout closure
      const matchedByPlayerId = currentState.currentPlayer;

      const flyingState: GameState = {
        ...currentState,
        cards: flyingCards,
        players: newPlayers,
        selectedCards: [],
      };

      console.log(`[MATCH CHECK ${checkId}] MATCH FOUND - Starting flying animation`, {
        cardIds: [firstId, secondId],
        playerId: matchedByPlayerId,
        newScore: newPlayers.find(p => p.id === matchedByPlayerId)?.score,
      });

      setGameState(flyingState);
      syncToFirestore(flyingState, `match:flying:${firstId}+${secondId}`);

      // PHASE 2: After animation completes, mark cards as matched
      setTimeout(() => {
        console.log(`[MATCH CHECK ${checkId}] Phase 2 - Animation complete, marking cards as matched`, {
          cardIds: [firstId, secondId],
          timestamp: new Date().toISOString(),
        });

        setGameState(prevState => {
          const matchedCards = prevState.cards.map(c => {
            if (c.id === firstId || c.id === secondId) {
              return {
                ...c,
                isMatched: true,
                isFlyingToPlayer: false,
                matchedByPlayerId,
              };
            }
            return c;
          });

          // Check for game over
          const allMatched = matchedCards.every(c => c.isMatched);

          let finalState: GameState;

          if (allMatched) {
            // Game finished
            const winner = prevState.players.reduce((prev, curr) =>
              curr.score > prev.score ? curr : prev
            );
            const isTie = prevState.players.every(p => p.score === winner.score);

            finalState = {
              ...prevState,
              cards: matchedCards,
              selectedCards: [],
              gameStatus: 'finished',
              winner: isTie ? null : winner,
              isTie,
            };
          } else {
            // Match found but game continues - player keeps turn
            finalState = {
              ...prevState,
              cards: matchedCards,
              selectedCards: [],
            };
          }

          // Sync the final matched state
          console.log(`[MATCH CHECK ${checkId}] Phase 2 - Syncing matched state`, {
            allMatched: matchedCards.every(c => c.isMatched),
            gameStatus: finalState.gameStatus,
            matchedCount: matchedCards.filter(c => c.isMatched).length,
          });
          syncToFirestore(finalState, `match:complete:${firstId}+${secondId}`);

          return finalState;
        });
      }, 3000); // Match animation duration (matches CSS)

      isCheckingMatchRef.current = false;
      return; // Exit early - the setTimeout will handle the rest
    } else {
      // No match - flip cards back and switch turns
      console.log(`[MATCH CHECK ${checkId}] NO MATCH - Flipping cards back`, {
        cardIds: [firstId, secondId],
        currentPlayer: currentState.currentPlayer,
        timestamp: new Date().toISOString(),
      });

      const newCards = currentState.cards.map(c => {
        if (c.id === firstId || c.id === secondId) {
          return { ...c, isFlipped: false };
        }
        return c;
      });

      const nextPlayer = currentState.currentPlayer === 1 ? 2 : 1;

      console.log(`[MATCH CHECK ${checkId}] Switching turn`, {
        fromPlayer: currentState.currentPlayer,
        toPlayer: nextPlayer,
      });

      newState = {
        ...currentState,
        cards: newCards,
        currentPlayer: nextPlayer,
        selectedCards: [],
      };
    }

    console.log(`[MATCH CHECK ${checkId}] Applying no-match state`, {
      currentPlayer: newState.currentPlayer,
      selectedCards: newState.selectedCards,
      flippedCards: newState.cards.filter(c => c.isFlipped && !c.isMatched).map(c => c.id),
    });

    setGameState(newState);
    syncToFirestore(newState, `noMatch:flipBack:${firstId}+${secondId}`);

    console.log(`[MATCH CHECK ${checkId}] COMPLETE - State synced`, {
      timestamp: new Date().toISOString(),
    });

    isCheckingMatchRef.current = false;
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
      flippedUnmatchedIds: flippedUnmatched.map(c => c.id),
      hadPendingMatchCheck: !!matchCheckTimeoutRef.current,
      timestamp: new Date().toISOString(),
    });

    if (matchCheckTimeoutRef.current) {
      clearTimeout(matchCheckTimeoutRef.current);
      matchCheckTimeoutRef.current = null;
    }
    isCheckingMatchRef.current = false;

    // Flip back any face-up unmatched cards and switch turns
    const newCards = gameState.cards.map(c => {
      if (c.isFlipped && !c.isMatched) {
        return { ...c, isFlipped: false };
      }
      return c;
    });

    const nextPlayer = gameState.currentPlayer === 1 ? 2 : 1;

    const newState: GameState = {
      ...gameState,
      cards: newCards,
      currentPlayer: nextPlayer,
      selectedCards: [],
    };

    console.log('[END TURN] Switching turn and flipping cards back', {
      fromPlayer: gameState.currentPlayer,
      toPlayer: nextPlayer,
      cardsFlippedBack: flippedUnmatched.length,
    });

    setGameState(newState);
    syncToFirestore(newState, 'endTurn:manual');
  }, [gameState, localPlayerSlot, syncToFirestore]);

  // Update player name - syncs to Firestore
  const updatePlayerName = useCallback((playerId: 1 | 2, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    const newPlayers = sortPlayersByID(
      gameState.players.map(p =>
        p.id === playerId ? { ...p, name: trimmedName } : p
      )
    );

    const newState: GameState = {
      ...gameState,
      players: newPlayers,
    };

    console.log('[ONLINE GAME] Updating player name', {
      playerId,
      newName: trimmedName,
      localPlayerSlot,
    });

    setGameState(newState);
    syncToFirestore(newState, `updatePlayerName:${playerId}`);
  }, [gameState, localPlayerSlot, syncToFirestore]);

  // Stuck game detection - monitors for cards stuck in flipped state
  useEffect(() => {
    const flippedUnmatched = gameState.cards.filter(c => c.isFlipped && !c.isMatched);
    const hasFlippedCards = flippedUnmatched.length > 0;

    // Track when cards first became flipped
    if (hasFlippedCards && cardsFlippedAtRef.current === null) {
      cardsFlippedAtRef.current = Date.now();
      console.log('[STUCK DETECTION] Cards flipped, starting timer', {
        flippedCards: flippedUnmatched.map(c => c.id),
        currentPlayer: gameState.currentPlayer,
        localPlayerSlot,
      });
    } else if (!hasFlippedCards && cardsFlippedAtRef.current !== null) {
      const duration = Date.now() - cardsFlippedAtRef.current;
      console.log('[STUCK DETECTION] Cards cleared, resetting timer', {
        durationMs: duration,
      });
      cardsFlippedAtRef.current = null;
    }

    // Clear any existing interval
    if (stuckCheckIntervalRef.current) {
      clearInterval(stuckCheckIntervalRef.current);
      stuckCheckIntervalRef.current = null;
    }

    // If we have flipped cards and it's our turn, start monitoring
    if (hasFlippedCards && localPlayerSlot === gameState.currentPlayer) {
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

          // Auto-recovery: if we're authoritative and stuck, trigger endTurn
          if (localPlayerSlot === gameState.currentPlayer) {
            console.log('[STUCK DETECTION] Triggering auto-recovery via endTurn');
            // Clear the timer to prevent repeated triggers
            cardsFlippedAtRef.current = null;
            endTurn();
          }
        }
      }, 5000); // Check every 5 seconds
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
  };
}
