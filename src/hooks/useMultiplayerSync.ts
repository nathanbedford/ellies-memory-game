import { useEffect, useRef } from 'react';
import { useMultiplayerStore } from '../stores/useMultiplayerStore';
import { useGameStore } from '../stores/useGameStore';
import {
  subscribeToGameState,
  subscribeToPlayers,
  loadReconnectSession,
  clearReconnectSession,
  updatePlayerConnection,
  startHeartbeat,
  getPlayers,
  validateRoomCode,
} from '../utils/gameSync';

/**
 * Hook to handle multiplayer connection and real-time sync
 */
export function useMultiplayerSync() {
  const {
    gameMode,
    gameId,
    playerId,
    playerNumber,
    setPlayerId,
    setOpponentConnected,
    setConnectionStatus,
    setReconnectSession,
  } = useMultiplayerStore();
  
  const applyRemoteUpdate = useGameStore((state) => state.applyRemoteUpdate);
  const unsubscribeGameStateRef = useRef<(() => void) | null>(null);
  const unsubscribePlayersRef = useRef<(() => void) | null>(null);
  const unsubscribeBroadcastRef = useRef<(() => void) | null>(null);
  const heartbeatRef = useRef<(() => void) | null>(null);
  const lastProcessedStateRef = useRef<string>('');
  const initialSyncCompleteRef = useRef<boolean>(false);

  // Handle reconnection on mount
  useEffect(() => {
    if (gameMode !== 'online' || gameId) return;

    const session = loadReconnectSession();
    if (!session) return;

    const attemptReconnect = async () => {
      setConnectionStatus('connecting');
      
      const game = await validateRoomCode(session.roomCode);
      if (!game || game.status === 'finished') {
        clearReconnectSession();
        setReconnectSession(null);
        setConnectionStatus('disconnected');
        return;
      }

      // Restore session
      useMultiplayerStore.setState({
        gameId: session.gameId,
        roomCode: session.roomCode,
        playerNumber: session.playerNumber,
        isHost: session.playerNumber === 1,
      });

      // Get players and check connection
      const players = await getPlayers(session.gameId);
      const currentPlayer = players.find(p => p.player_number === session.playerNumber);
      
      if (currentPlayer) {
        setPlayerId(currentPlayer.id);
        await updatePlayerConnection(currentPlayer.id, true);
        setConnectionStatus('connected');
        
        const opponent = players.find(p => p.player_number !== session.playerNumber);
        setOpponentConnected(!!opponent?.connected);
      } else {
        // Player record doesn't exist - clear session
        clearReconnectSession();
        setReconnectSession(null);
        setConnectionStatus('disconnected');
      }
    };

      attemptReconnect();
  }, [gameMode, gameId, setConnectionStatus, setReconnectSession, setOpponentConnected, setPlayerId]);

  // Subscribe to game state changes
  useEffect(() => {
    if (gameMode !== 'online' || !gameId) {
      if (unsubscribeGameStateRef.current) {
        unsubscribeGameStateRef.current();
        unsubscribeGameStateRef.current = null;
      }
      lastProcessedStateRef.current = ''; // Reset when unsubscribing
      initialSyncCompleteRef.current = false; // Reset initial sync flag
      return;
    }
    
    // Prevent duplicate subscriptions
    if (unsubscribeGameStateRef.current) {
      console.warn('[REALTIME] Attempted to create duplicate game state subscription, skipping');
      return;
    }
    
    // Reset duplicate check when setting up new subscription
    lastProcessedStateRef.current = '';
    initialSyncCompleteRef.current = false;

    const unsubscribe = subscribeToGameState(gameId, (state) => {
      const gameStore = useGameStore.getState();
      
      // AGGRESSIVE FILTER: After initial sync, completely ignore updates without updateId
      // These are likely noise/heartbeat/polling updates that don't carry meaningful changes
      // Only legitimate updates have proper updateId values
      if (!state.update_id && initialSyncCompleteRef.current) {
        // Completely ignore - don't even process
        if (process.env.NODE_ENV === 'development') {
          console.log('[REALTIME] Blocked update without updateId (after initial sync)');
        }
        return;
      }
      
      // Early exit: Skip updates with undefined/null updateId if they don't actually change anything
      // Only check this BEFORE initial sync completes
      if (!state.update_id && !initialSyncCompleteRef.current && gameStore.cards.length > 0) {
        // Only proceed if we have cards to compare
        if (state.cards && Array.isArray(state.cards)) {
          const currentCards = gameStore.cards;
          const newCards = state.cards as any[];
          
          // Quick comparison: same length
          if (currentCards.length === newCards.length) {
            // Compare selectedCards
            const selectedCardsEqual = JSON.stringify([...gameStore.selectedCards].sort()) === JSON.stringify([...(state.selected_cards || [])].sort());
            
            // Compare other fields (using nullish coalescing to handle undefined)
            const currentPlayerEqual = gameStore.currentPlayer === (state.current_player ?? gameStore.currentPlayer);
            const isAnimatingEqual = gameStore.isAnimatingCards === (state.is_animating ?? gameStore.isAnimatingCards);
            const isCheckingMatchEqual = gameStore.isCheckingMatch === (state.is_checking_match ?? gameStore.isCheckingMatch);
            
            if (selectedCardsEqual && currentPlayerEqual && isAnimatingEqual && isCheckingMatchEqual) {
              // Deep check: are all card states the same? Use a map since order might differ
              const currentCardsMap = new Map(currentCards.map(c => [c.id, c]));
              let cardsUnchanged = true;
              
              for (const newCard of newCards) {
                const currentCard = currentCardsMap.get(newCard.id);
                if (!currentCard ||
                    currentCard.isFlipped !== newCard.isFlipped ||
                    currentCard.isMatched !== newCard.isMatched ||
                    currentCard.isFlyingToPlayer !== newCard.isFlyingToPlayer ||
                    currentCard.flyingToPlayerId !== newCard.flyingToPlayerId) {
                  cardsUnchanged = false;
                  break;
                }
              }
              
              if (cardsUnchanged) {
                // This update doesn't change anything, skip it entirely
                return;
              }
            }
          }
        }
      }
      
      // Create a lightweight key from the state to detect duplicates
      // Only hash the relevant fields, not the entire cards array
      const stateKey = `${state.update_id || 'no-id'}-${state.current_player || 'no-player'}-${state.is_animating ? '1' : '0'}-${state.is_checking_match ? '1' : '0'}-${JSON.stringify(state.selected_cards)}`;
      
      // Skip if we just processed this exact state
      if (lastProcessedStateRef.current === stateKey) {
        console.log('[REALTIME] Skipping duplicate state update');
        return;
      }
      
      console.log('[REALTIME] Received game state update', {
        updateId: state.update_id,
        hasCards: !!state.cards,
        hasSelectedCards: !!state.selected_cards,
        hasCurrentPlayer: state.current_player !== undefined,
        hasIsCheckingMatch: state.is_checking_match !== undefined,
        hasIsAnimating: state.is_animating !== undefined,
        currentCardsCount: gameStore.cards.length,
        updateCardsCount: (state.cards as any[])?.length || 0,
      });
      
      // Check if this is our own update echoing back
      if (state.update_id && gameStore.pendingUpdateIds.has(state.update_id)) {
        console.log('[REALTIME] Skipping own update (echo)', { updateId: state.update_id });
        gameStore.removePendingUpdate(state.update_id);
        lastProcessedStateRef.current = stateKey;
        return;
      }
      
      // Don't update if game is in setup mode (waiting for host)
      if (gameStore.gameStatus === 'setup') {
        console.log('[REALTIME] Game in setup mode, skipping update');
        return;
      }
      
      // Don't update if we don't have cards yet (let the initial sync handle it)
      if (gameStore.cards.length === 0 && state.cards) {
        console.log('[REALTIME] First sync - applying cards');
        // This is the first sync - apply it once
        applyRemoteUpdate({
          cards: state.cards as any,
          selectedCards: (state.selected_cards as any) || [],
          gameStatus: 'playing',
          isAnimatingCards: false,
        }, state.update_id);
        lastProcessedStateRef.current = stateKey;
        initialSyncCompleteRef.current = true;
        return;
      }
      
      // Mark initial sync as complete if we now have cards (handles hot reload case)
      if (!initialSyncCompleteRef.current && gameStore.cards.length > 0) {
        initialSyncCompleteRef.current = true;
      }
      
      // After initial sync, completely ignore updates with undefined updateId
      // These are likely noise/heartbeat updates that don't carry meaningful changes
      if (!state.update_id && initialSyncCompleteRef.current) {
        // Already checked in early exit above, but double-check here as final gate
        return;
      }

      // Don't update animation state if we're currently animating locally
      // This prevents the animation from restarting when receiving state updates
      const updateData: any = {
        cards: state.cards as any,
        selectedCards: state.selected_cards as any,
        isCheckingMatch: state.is_checking_match,
      };
      
      console.log('[REALTIME] Preparing update data', {
        willUpdateCards: !!updateData.cards,
        willUpdateSelectedCards: !!updateData.selectedCards,
        willUpdateIsCheckingMatch: updateData.isCheckingMatch !== undefined,
      });
      
      // Sync currentPlayer if available
      if (state.current_player !== undefined) {
        updateData.currentPlayer = state.current_player;
        console.log('[REALTIME] Including currentPlayer update', { currentPlayer: state.current_player });
      }
      
      // Only update isAnimatingCards if we're not currently animating locally
      // or if the database says animation is done (false)
      if (!gameStore.isAnimatingCards || !state.is_animating) {
        updateData.isAnimatingCards = state.is_animating;
        console.log('[REALTIME] Including isAnimatingCards update', { isAnimatingCards: state.is_animating });
      }
      
      applyRemoteUpdate(updateData, state.update_id);
      
      // Update the last processed state after processing
      lastProcessedStateRef.current = stateKey;

      // Update scores if available
      if (state.scores) {
        const scores = state.scores as { player1: number; player2: number };
        const currentPlayers = useGameStore.getState().players;
        console.log('[REALTIME] Updating scores', { scores });
        applyRemoteUpdate({
          players: currentPlayers.map((p, index) => ({
            ...p,
            score: index === 0 ? scores.player1 : scores.player2,
          })),
        }, state.update_id);
      }
    });

    unsubscribeGameStateRef.current = unsubscribe;

    return () => {
      unsubscribe();
    };
  }, [gameMode, gameId, applyRemoteUpdate]);

  // Subscribe to player connection changes
  useEffect(() => {
    if (gameMode !== 'online' || !gameId) {
      if (unsubscribePlayersRef.current) {
        unsubscribePlayersRef.current();
        unsubscribePlayersRef.current = null;
      }
      return;
    }
    
    // Prevent duplicate subscriptions
    if (unsubscribePlayersRef.current) {
      console.warn('[REALTIME] Attempted to create duplicate players subscription, skipping');
      return;
    }

    const unsubscribe = subscribeToPlayers(gameId, (players) => {
      const opponent = players.find(p => p.player_number !== playerNumber);
      setOpponentConnected(!!opponent?.connected);
      
      // Update connection status based on opponent
      if (opponent) {
        setConnectionStatus(opponent.connected ? 'connected' : 'disconnected');
      }
      
      // Sync player names and colors from database
      const gameStore = useGameStore.getState();
      const updatedPlayers = gameStore.players.map((localPlayer) => {
        const dbPlayer = players.find(p => p.player_number === localPlayer.id);
        if (dbPlayer) {
          return {
            ...localPlayer,
            name: dbPlayer.name,
            color: dbPlayer.color,
          };
        }
        return localPlayer;
      });
      
      // Only update if something changed
      const hasChanges = updatedPlayers.some((p, idx) => 
        p.name !== gameStore.players[idx]?.name || 
        p.color !== gameStore.players[idx]?.color
      );
      
      if (hasChanges) {
        applyRemoteUpdate({ players: updatedPlayers });
      }
    });

    unsubscribePlayersRef.current = unsubscribe;

    return () => {
      unsubscribe();
    };
  }, [gameMode, gameId, playerNumber, setOpponentConnected, setConnectionStatus, applyRemoteUpdate]);

  // Start heartbeat to keep connection alive
  useEffect(() => {
    if (gameMode !== 'online' || !playerId) {
      if (heartbeatRef.current) {
        heartbeatRef.current();
        heartbeatRef.current = null;
      }
      return;
    }

    // Only start heartbeat if we have a valid playerId
    if (!playerId) return;

    const cleanup = startHeartbeat(playerId);
    heartbeatRef.current = cleanup;

    return () => {
      cleanup();
    };
  }, [gameMode, playerId]);

  // Handle beforeunload to mark player as disconnected
  useEffect(() => {
    if (gameMode !== 'online' || !playerId) return;

    const handleBeforeUnload = async () => {
      await updatePlayerConnection(playerId, false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [gameMode, playerId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeGameStateRef.current) {
        unsubscribeGameStateRef.current();
      }
      if (unsubscribePlayersRef.current) {
        unsubscribePlayersRef.current();
      }
      if (unsubscribeBroadcastRef.current) {
        unsubscribeBroadcastRef.current();
      }
      if (heartbeatRef.current) {
        heartbeatRef.current();
      }
      if (playerId) {
        updatePlayerConnection(playerId, false);
      }
    };
  }, [playerId]);
}


