/**
 * onlineStore - Zustand store for online multiplayer state
 *
 * Manages connection status, room state, and player presence.
 * Does NOT persist to localStorage since online state is transient.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  GameMode,
  ConnectionStatus,
  Room,
  PresenceData,
  CardPack,
} from '../types';
import {
  getFirestoreSyncAdapter,
  resetFirestoreSyncAdapter,
} from '../services/sync/FirestoreSyncAdapter';
import { PresenceService } from '../services/sync/PresenceService';

// ============================================
// Store State
// ============================================

interface OnlineStoreState {
  // Mode
  gameMode: GameMode | null;

  // Connection
  connectionStatus: ConnectionStatus;
  odahId: string | null;

  // Room
  room: Room | null;
  roomCode: string | null;
  isHost: boolean;

  // Presence
  presenceData: Record<string, PresenceData>;
  opponentConnected: boolean;
  opponentDisconnectedAt: number | null; // Timestamp when opponent disconnect was detected

  // Error handling
  error: string | null;
}

interface OnlineStoreActions {
  // Mode actions
  setGameMode: (mode: GameMode | null) => void;

  // Connection actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;

  // Room actions
  createRoom: (options: {
    hostName: string;
    hostColor: string;
    cardPack: CardPack;
    background: string;
    cardBack: string;
  }) => Promise<string>;
  joinRoom: (roomCode: string, playerName: string, playerColor: string) => Promise<Room>;
  leaveRoom: () => Promise<void>;
  subscribeToRoom: (roomCode: string) => () => void;

  // Room config (host only)
  updateRoomConfig: (config: { cardPack?: CardPack; background?: string; cardBack?: string }) => Promise<void>;

  // Player actions
  updatePlayerName: (name: string) => Promise<void>;
  updatePlayerColor: (color: string) => Promise<void>;

  // Presence actions
  subscribeToPresence: (roomCode: string) => () => void;
  setPresenceData: (data: Record<string, PresenceData>) => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;

  // Reset
  reset: () => void;
}

type OnlineStore = OnlineStoreState & OnlineStoreActions;

const initialState: OnlineStoreState = {
  gameMode: null,
  connectionStatus: 'disconnected',
  odahId: null,
  room: null,
  roomCode: null,
  isHost: false,
  presenceData: {},
  opponentConnected: false,
  opponentDisconnectedAt: null,
  error: null,
};

// ============================================
// Store Implementation
// ============================================

export const useOnlineStore = create<OnlineStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Mode actions
    setGameMode: (mode: GameMode | null) => {
      set({ gameMode: mode });
    },

    // Connection actions
    connect: async () => {
      const { connectionStatus } = get();
      if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
        return;
      }

      set({ connectionStatus: 'connecting', error: null });

      try {
        const adapter = getFirestoreSyncAdapter();
        await adapter.connect();

        set({
          connectionStatus: 'connected',
          odahId: adapter.getOdahId(),
        });
      } catch (error) {
        set({
          connectionStatus: 'disconnected',
          error: error instanceof Error ? error.message : 'Connection failed',
        });
        throw error;
      }
    },

    disconnect: async () => {
      try {
        const adapter = getFirestoreSyncAdapter();
        await adapter.disconnect();
        resetFirestoreSyncAdapter();
      } catch (error) {
        console.error('Disconnect error:', error);
      }

      set({
        connectionStatus: 'disconnected',
        odahId: null,
        room: null,
        roomCode: null,
        isHost: false,
        presenceData: {},
        opponentConnected: false,
        opponentDisconnectedAt: null,
      });
    },

    // Room actions
    createRoom: async (options) => {
      const { odahId } = get();
      if (!odahId) {
        throw new Error('Not connected');
      }

      set({ error: null });

      try {
        const adapter = getFirestoreSyncAdapter();
        const roomCode = await adapter.createRoom({
          hostId: odahId,
          hostName: options.hostName,
          hostColor: options.hostColor,
          cardPack: options.cardPack,
          background: options.background,
          cardBack: options.cardBack,
        });

        set({
          roomCode,
          isHost: true,
        });

        return roomCode;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to create room',
        });
        throw error;
      }
    },

    joinRoom: async (roomCode: string, playerName: string, playerColor: string) => {
      const { odahId } = get();
      if (!odahId) {
        throw new Error('Not connected');
      }

      set({ error: null });

      try {
        const adapter = getFirestoreSyncAdapter();
        const room = await adapter.joinRoom(roomCode, {
          odahId,
          name: playerName,
          color: playerColor,
        });

        set({
          room,
          roomCode: roomCode.toUpperCase(),
          isHost: false,
        });

        return room;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to join room',
        });
        throw error;
      }
    },

    leaveRoom: async () => {
      set({ error: null });

      try {
        const adapter = getFirestoreSyncAdapter();
        await adapter.leaveRoom();

        set({
          room: null,
          roomCode: null,
          isHost: false,
          presenceData: {},
          opponentConnected: false,
          opponentDisconnectedAt: null,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to leave room',
        });
        throw error;
      }
    },

    subscribeToRoom: (roomCode: string) => {
      const adapter = getFirestoreSyncAdapter();

      return adapter.subscribeToRoom(roomCode, (room) => {
        set({ room });
      });
    },

    // Room config (host only)
    updateRoomConfig: async (config) => {
      const { roomCode, isHost } = get();
      if (!roomCode || !isHost) {
        throw new Error('Only host can update room config');
      }

      set({ error: null });

      try {
        const adapter = getFirestoreSyncAdapter();
        await adapter.updateRoomConfig(roomCode, config);
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update room config',
        });
        throw error;
      }
    },

    // Player actions
    updatePlayerName: async (name: string) => {
      set({ error: null });

      try {
        const adapter = getFirestoreSyncAdapter();
        await adapter.updatePlayerName(name);
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update name',
        });
        throw error;
      }
    },

    updatePlayerColor: async (color: string) => {
      set({ error: null });

      try {
        const adapter = getFirestoreSyncAdapter();
        await adapter.updatePlayerColor(color);
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update color',
        });
        throw error;
      }
    },

    // Presence actions
    subscribeToPresence: (roomCode: string) => {
      return PresenceService.subscribeToRoomPresence(roomCode, (presenceData) => {
        // Convert internal presence data to external format
        const converted: Record<string, PresenceData> = {};
        for (const [id, data] of Object.entries(presenceData)) {
          converted[id] = {
            odahId: data.odahId,
            name: data.name,
            online: data.online,
            lastSeen: typeof data.lastSeen === 'number' ? data.lastSeen : Date.now(),
          };
        }

        // Check if opponent is connected
        const { odahId, opponentConnected: prevOpponentConnected } = get();
        const opponentConnected = Object.values(converted).some(
          (p) => p.odahId !== odahId && p.online
        );

        // Track disconnect timing for overlay countdown
        let opponentDisconnectedAt = get().opponentDisconnectedAt;
        if (!opponentConnected && prevOpponentConnected) {
          // Opponent just disconnected - record timestamp
          opponentDisconnectedAt = Date.now();
          console.log('[PRESENCE] Opponent disconnected at:', opponentDisconnectedAt);
        } else if (opponentConnected && !prevOpponentConnected) {
          // Opponent reconnected - clear timestamp
          opponentDisconnectedAt = null;
          console.log('[PRESENCE] Opponent reconnected');
        }

        set({ presenceData: converted, opponentConnected, opponentDisconnectedAt });
      });
    },

    setPresenceData: (data: Record<string, PresenceData>) => {
      const { odahId } = get();
      const opponentConnected = Object.values(data).some(
        (p) => p.odahId !== odahId && p.online
      );
      set({ presenceData: data, opponentConnected });
    },

    // Error handling
    setError: (error: string | null) => {
      set({ error });
    },

    clearError: () => {
      set({ error: null });
    },

    // Reset
    reset: () => {
      resetFirestoreSyncAdapter();
      set(initialState);
    },
  }))
);

// ============================================
// Selectors
// ============================================

export const selectIsOnline = (state: OnlineStore) =>
  state.gameMode === 'online';

export const selectIsConnected = (state: OnlineStore) =>
  state.connectionStatus === 'connected';

export const selectIsInRoom = (state: OnlineStore) =>
  state.roomCode !== null;

export const selectCanStartGame = (state: OnlineStore) =>
  state.isHost &&
  state.room !== null &&
  Object.keys(state.room.players).length === 2 &&
  state.opponentConnected;

export const selectOpponent = (state: OnlineStore) => {
  if (!state.room || !state.odahId) return null;

  const opponentEntry = Object.entries(state.room.players).find(
    ([id]) => id !== state.odahId
  );

  if (!opponentEntry) return null;

  const [id, player] = opponentEntry;
  const presence = state.presenceData[id];

  return {
    odahId: id,
    name: player.name,
    color: player.color,
    slot: player.slot,
    online: presence?.online ?? false,
  };
};

export const selectSelf = (state: OnlineStore) => {
  if (!state.room || !state.odahId) return null;

  const player = state.room.players[state.odahId];
  if (!player) return null;

  return {
    odahId: state.odahId,
    name: player.name,
    color: player.color,
    slot: player.slot,
  };
};
