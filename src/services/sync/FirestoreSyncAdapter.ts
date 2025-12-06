/**
 * FirestoreSyncAdapter - Sync adapter for online multiplayer
 *
 * Uses Firestore for game state and room management.
 * Presence is handled separately by PresenceService using RTDB.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, getOrCreateUserId } from '../../lib/firebase';
import { BaseSyncAdapter, CreateRoomOptions, JoinRoomOptions } from './ISyncAdapter';
import { PresenceService } from './PresenceService';
import { generateRoomCode } from '../game/GameEngine';
import type { GameState, Room, RoomConfig, OnlineGameState } from '../../types';

export class FirestoreSyncAdapter extends BaseSyncAdapter {
  private connected = false;
  private roomCode: string | null = null;
  private odahId: string | null = null;
  private isHost = false;
  private presenceService: PresenceService | null = null;
  private stateUnsubscribe: (() => void) | null = null;
  private roomUnsubscribe: (() => void) | null = null;

  async connect(): Promise<void> {
    if (this.connected) return;

    // Get or create anonymous user ID
    this.odahId = await getOrCreateUserId();
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    // Clean up subscriptions
    if (this.stateUnsubscribe) {
      this.stateUnsubscribe();
      this.stateUnsubscribe = null;
    }
    if (this.roomUnsubscribe) {
      this.roomUnsubscribe();
      this.roomUnsubscribe = null;
    }

    // Stop presence tracking
    if (this.presenceService) {
      await this.presenceService.stop();
      this.presenceService = null;
    }

    this.connected = false;
    this.roomCode = null;
    this.isHost = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getOdahId(): string | null {
    return this.odahId;
  }

  getRoomCode(): string | null {
    return this.roomCode;
  }

  getIsHost(): boolean {
    return this.isHost;
  }

  // ============================================
  // Room Operations
  // ============================================

  async createRoom(options: CreateRoomOptions): Promise<string> {
    if (!this.connected || !this.odahId) {
      throw new Error('Not connected');
    }

    // Generate unique room code (retry if collision)
    let roomCode: string;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      roomCode = generateRoomCode();
      const existingRoom = await getDoc(doc(db, 'rooms', roomCode));
      if (!existingRoom.exists()) {
        break;
      }
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique room code');
    }

    // Create room document
    const room: Room = {
      roomCode,
      hostId: options.hostId,
      status: 'waiting',
      config: {
        cardPack: options.cardPack,
        background: options.background,
        cardBack: options.cardBack,
      },
      players: {
        [this.odahId]: {
          slot: 1,
          name: options.hostName,
          color: options.hostColor,
        },
      },
      gameState: null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    await setDoc(doc(db, 'rooms', roomCode), {
      ...room,
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
    });

    // Start presence tracking
    this.presenceService = new PresenceService(roomCode, this.odahId, options.hostName);
    await this.presenceService.start();

    this.roomCode = roomCode;
    this.isHost = true;

    return roomCode;
  }

  async joinRoom(roomCode: string, options: JoinRoomOptions): Promise<Room> {
    if (!this.connected || !this.odahId) {
      throw new Error('Not connected');
    }

    const roomRef = doc(db, 'rooms', roomCode.toUpperCase());
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }

    const room = roomSnap.data() as Room;

    // Check if player is already in the room (rejoining)
    const isExistingPlayer = options.odahId in room.players;

    if (!isExistingPlayer) {
      // New player trying to join
      if (room.status !== 'waiting') {
        throw new Error('Game already in progress');
      }

      const playerCount = Object.keys(room.players).length;
      if (playerCount >= 2) {
        throw new Error('Room is full');
      }
    }

    // Add/update player in room
    await updateDoc(roomRef, {
      [`players.${options.odahId}`]: {
        slot: isExistingPlayer ? room.players[options.odahId].slot : 2,
        name: options.name,
        color: options.color,
      },
      lastActivity: serverTimestamp(),
    });

    // Start presence tracking
    this.presenceService = new PresenceService(roomCode.toUpperCase(), options.odahId, options.name);
    await this.presenceService.start();

    this.roomCode = roomCode.toUpperCase();
    this.isHost = false;

    // Fetch updated room
    const updatedRoomSnap = await getDoc(roomRef);
    return updatedRoomSnap.data() as Room;
  }

  async leaveRoom(): Promise<void> {
    if (!this.roomCode || !this.odahId) return;

    const roomRef = doc(db, 'rooms', this.roomCode);

    if (this.isHost) {
      // Host leaving ends the game
      await updateDoc(roomRef, {
        status: 'finished',
        lastActivity: serverTimestamp(),
      });
    } else {
      // Guest leaving removes them from the room
      await updateDoc(roomRef, {
        [`players.${this.odahId}`]: null,
        lastActivity: serverTimestamp(),
      });
    }

    // Stop presence tracking
    if (this.presenceService) {
      await this.presenceService.stop();
      this.presenceService = null;
    }

    this.roomCode = null;
    this.isHost = false;
  }

  async getRoom(roomCode: string): Promise<Room | null> {
    const roomRef = doc(db, 'rooms', roomCode.toUpperCase());
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      return null;
    }

    return roomSnap.data() as Room;
  }

  subscribeToRoom(roomCode: string, callback: (room: Room | null) => void): () => void {
    const roomRef = doc(db, 'rooms', roomCode.toUpperCase());

    const unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as Room);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Room subscription error:', error);
        callback(null);
      }
    );

    this.roomUnsubscribe = unsubscribe;
    return unsubscribe;
  }

  async updateRoomConfig(roomCode: string, config: Partial<RoomConfig>): Promise<void> {
    if (!this.isHost) {
      throw new Error('Only host can update room config');
    }

    const roomRef = doc(db, 'rooms', roomCode);

    const updates: Record<string, unknown> = {
      lastActivity: serverTimestamp(),
    };

    if (config.cardPack !== undefined) {
      updates['config.cardPack'] = config.cardPack;
    }
    if (config.background !== undefined) {
      updates['config.background'] = config.background;
    }
    if (config.cardBack !== undefined) {
      updates['config.cardBack'] = config.cardBack;
    }

    await updateDoc(roomRef, updates);
  }

  async startGame(roomCode: string, initialState: GameState): Promise<void> {
    if (!this.isHost) {
      throw new Error('Only host can start game');
    }

    const roomRef = doc(db, 'rooms', roomCode);

    const onlineState: OnlineGameState = {
      ...initialState,
      syncVersion: 1,
    };

    await updateDoc(roomRef, {
      status: 'playing',
      gameState: onlineState,
      lastActivity: serverTimestamp(),
    });
  }

  // ============================================
  // Game State Operations
  // ============================================

  async getState(): Promise<GameState | null> {
    if (!this.roomCode) return null;

    const room = await this.getRoom(this.roomCode);
    return room?.gameState || null;
  }

  async setState(state: GameState): Promise<void> {
    if (!this.roomCode) {
      throw new Error('Not in a room');
    }

    const roomRef = doc(db, 'rooms', this.roomCode);

    // Increment sync version for optimistic concurrency
    const onlineState: OnlineGameState = {
      ...state,
      syncVersion: ((state as OnlineGameState).syncVersion || 0) + 1,
    };

    await updateDoc(roomRef, {
      gameState: onlineState,
      lastActivity: serverTimestamp(),
    });
  }

  subscribeToState(callback: (state: GameState) => void): () => void {
    if (!this.roomCode) {
      return () => {};
    }

    const roomRef = doc(db, 'rooms', this.roomCode);

    const unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const room = snapshot.data() as Room;
          if (room.gameState) {
            callback(room.gameState);
          }
        }
      },
      (error) => {
        console.error('State subscription error:', error);
      }
    );

    this.stateUnsubscribe = unsubscribe;
    return unsubscribe;
  }

  // ============================================
  // Player Operations
  // ============================================

  async updatePlayerName(name: string): Promise<void> {
    if (!this.roomCode || !this.odahId) return;

    const roomRef = doc(db, 'rooms', this.roomCode);

    await updateDoc(roomRef, {
      [`players.${this.odahId}.name`]: name,
      lastActivity: serverTimestamp(),
    });

    // Update presence
    if (this.presenceService) {
      await this.presenceService.updateName(name);
    }
  }

  async updatePlayerColor(color: string): Promise<void> {
    if (!this.roomCode || !this.odahId) return;

    const roomRef = doc(db, 'rooms', this.roomCode);

    await updateDoc(roomRef, {
      [`players.${this.odahId}.color`]: color,
      lastActivity: serverTimestamp(),
    });
  }
}

// Singleton instance
let firestoreAdapterInstance: FirestoreSyncAdapter | null = null;

export function getFirestoreSyncAdapter(): FirestoreSyncAdapter {
  if (!firestoreAdapterInstance) {
    firestoreAdapterInstance = new FirestoreSyncAdapter();
  }
  return firestoreAdapterInstance;
}

export function resetFirestoreSyncAdapter(): void {
  if (firestoreAdapterInstance) {
    firestoreAdapterInstance.disconnect();
    firestoreAdapterInstance = null;
  }
}
