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
} from "firebase/firestore";
import { db, getOrCreateUserId } from "../../lib/firebase";
import {
	BaseSyncAdapter,
	CreateRoomOptions,
	JoinRoomOptions,
} from "./ISyncAdapter";
import { PresenceService } from "./PresenceService";
import { generateRoomCode } from "../game/GameEngine";
import type { GameState, Room, RoomConfig, OnlineGameState } from "../../types";

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
			throw new Error("Not connected");
		}

		// Generate unique room code (retry if collision)
		let roomCode: string;
		let attempts = 0;
		const maxAttempts = 5;

		do {
			roomCode = generateRoomCode();
			const existingRoom = await getDoc(doc(db, "rooms", roomCode));
			if (!existingRoom.exists()) {
				break;
			}
			attempts++;
		} while (attempts < maxAttempts);

		if (attempts >= maxAttempts) {
			throw new Error("Failed to generate unique room code");
		}

		// Create room document (game state stored separately in /games/{roomCode})
		// Note: Name/color are stored in RTDB presence only (single source of truth)
		// playerSlots just tracks which odahId has which slot (1 or 2)
		const room: Room = {
			roomCode,
			hostId: options.hostId,
			status: "waiting",
			config: {
				cardPack: options.cardPack,
				background: options.background,
				cardBack: options.cardBack,
				pairCount: options.pairCount,
			},
			playerSlots: {
				[this.odahId]: 1, // Host is always slot 1
			},
			createdAt: Date.now(),
			lastActivity: Date.now(),
		};

		await setDoc(doc(db, "rooms", roomCode), {
			...room,
			createdAt: serverTimestamp(),
			lastActivity: serverTimestamp(),
		});

		// Start presence tracking (host is always slot 1)
		this.presenceService = new PresenceService(
			roomCode,
			this.odahId,
			options.hostName,
			options.hostColor,
			1,
		);
		await this.presenceService.start();

		this.roomCode = roomCode;
		this.isHost = true;

		return roomCode;
	}

	async joinRoom(roomCode: string, options: JoinRoomOptions): Promise<Room> {
		if (!this.connected || !this.odahId) {
			throw new Error("Not connected");
		}

		const roomRef = doc(db, "rooms", roomCode.toUpperCase());
		const roomSnap = await getDoc(roomRef);

		if (!roomSnap.exists()) {
			throw new Error("Room not found");
		}

		const room = roomSnap.data() as Room;

		// Support both new playerSlots format and legacy players format
		// New format: playerSlots = { [odahId]: 1 | 2 }
		// Legacy format: players = { [odahId]: { slot, name, color } }
		const playerSlots: Record<string, 1 | 2> = room.playerSlots ||
			(room.players
				? Object.fromEntries(Object.entries(room.players).map(([k, v]) => [k, v.slot]))
				: {});

		// Check if player is already in the room (rejoining)
		const isExistingPlayer = options.odahId in playerSlots;

		if (!isExistingPlayer) {
			// New player trying to join
			if (room.status !== "waiting") {
				throw new Error("Game already in progress");
			}

			const playerCount = Object.keys(playerSlots).length;
			if (playerCount >= 2) {
				throw new Error("Room is full");
			}
		}

		// Determine player slot (host is always 1, guest is always 2)
		const playerSlot: 1 | 2 = isExistingPlayer ? playerSlots[options.odahId] : 2;

		// Add/update player slot in room (just the slot number, not name/color)
		// Name/color come from RTDB presence only
		await updateDoc(roomRef, {
			[`playerSlots.${options.odahId}`]: playerSlot,
			lastActivity: serverTimestamp(),
		});

		// Start presence tracking
		this.presenceService = new PresenceService(
			roomCode.toUpperCase(),
			options.odahId,
			options.name,
			options.color,
			playerSlot,
		);
		await this.presenceService.start();

		this.roomCode = roomCode.toUpperCase();
		this.isHost = false;

		// Fetch updated room
		const updatedRoomSnap = await getDoc(roomRef);
		return updatedRoomSnap.data() as Room;
	}

	async leaveRoom(): Promise<void> {
		if (!this.roomCode || !this.odahId) return;

		const roomRef = doc(db, "rooms", this.roomCode);

		if (this.isHost) {
			// Host leaving ends the game
			await updateDoc(roomRef, {
				status: "finished",
				lastActivity: serverTimestamp(),
			});
		} else {
			// Guest leaving removes them from the room (slot assignment only)
			await updateDoc(roomRef, {
				[`playerSlots.${this.odahId}`]: null,
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
		const roomRef = doc(db, "rooms", roomCode.toUpperCase());
		const roomSnap = await getDoc(roomRef);

		if (!roomSnap.exists()) {
			return null;
		}

		return roomSnap.data() as Room;
	}

	subscribeToRoom(
		roomCode: string,
		callback: (room: Room | null) => void,
	): () => void {
		const roomRef = doc(db, "rooms", roomCode.toUpperCase());

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
				console.error("Room subscription error:", error);
				callback(null);
			},
		);

		this.roomUnsubscribe = unsubscribe;
		return unsubscribe;
	}

	async updateRoomConfig(
		roomCode: string,
		config: Partial<RoomConfig>,
	): Promise<void> {
		if (!this.isHost) {
			throw new Error("Only host can update room config");
		}

		const roomRef = doc(db, "rooms", roomCode);

		const updates: Record<string, unknown> = {
			lastActivity: serverTimestamp(),
		};

		if (config.cardPack !== undefined) {
			updates["config.cardPack"] = config.cardPack;
		}
		if (config.background !== undefined) {
			updates["config.background"] = config.background;
		}
		if (config.cardBack !== undefined) {
			updates["config.cardBack"] = config.cardBack;
		}
		if (config.pairCount !== undefined) {
			updates["config.pairCount"] = config.pairCount;
		}

		await updateDoc(roomRef, updates);
	}

	async resetRoomToWaiting(roomCode: string): Promise<void> {
		if (!this.isHost) {
			throw new Error("Only host can reset room status");
		}

		const roomRef = doc(db, "rooms", roomCode);
		await updateDoc(roomRef, {
			status: "waiting",
			lastActivity: serverTimestamp(),
		});
	}

	async startGame(roomCode: string, initialState: GameState): Promise<void> {
		if (!this.isHost) {
			throw new Error("Only host can start game");
		}

		const roomRef = doc(db, "rooms", roomCode);
		const gameRef = doc(db, "games", roomCode);

		// Get current game to check for existing gameRound
		const gameSnap = await getDoc(gameRef);
		const existingGameRound = gameSnap.exists()
			? (gameSnap.data() as OnlineGameState).gameRound || 0
			: 0;
		const newGameRound = existingGameRound + 1;

		const onlineState: OnlineGameState = {
			...initialState,
			syncVersion: 1,
			gameRound: newGameRound,
		};

		// Create/update game document separately from room
		await setDoc(gameRef, onlineState);

		// Update room status only
		await updateDoc(roomRef, {
			status: "playing",
			lastActivity: serverTimestamp(),
		});
	}

	// ============================================
	// Game State Operations
	// ============================================

	async getState(): Promise<GameState | null> {
		if (!this.roomCode) return null;

		const gameRef = doc(db, "games", this.roomCode);
		const gameSnap = await getDoc(gameRef);

		if (!gameSnap.exists()) {
			return null;
		}

		return gameSnap.data() as OnlineGameState;
	}

	async setState(state: GameState): Promise<void> {
		if (!this.roomCode) {
			throw new Error("Not in a room");
		}

		const gameRef = doc(db, "games", this.roomCode);
		const roomRef = doc(db, "rooms", this.roomCode);

		// Preserve sync version and gameRound (version is managed by useOnlineGame hook)
		const existingState = state as OnlineGameState;

		// Clean undefined values from cards (Firestore doesn't accept undefined)
		// Note: isFlyingToPlayer and flyingToPlayerId are no longer synced - animation is local UI state
		const cleanedCards = state.cards.map((card) => {
			const cleaned: any = {
				id: card.id,
				imageId: card.imageId,
				imageUrl: card.imageUrl,
				isFlipped: card.isFlipped,
				isMatched: card.isMatched,
			};
			// Only include optional fields if they have values
			if (card.gradient !== undefined) cleaned.gradient = card.gradient;
			if (card.matchedByPlayerId !== undefined) cleaned.matchedByPlayerId = card.matchedByPlayerId;
			return cleaned;
		});

		const onlineState: OnlineGameState = {
			...state,
			cards: cleanedCards,
			// winner and isTie are now derived from cards and players, not stored
			syncVersion: existingState.syncVersion || 0,
			gameRound: existingState.gameRound ?? 0, // Preserve gameRound if present
		};
		// Only include lastUpdatedBy if it exists
		if (onlineState.lastUpdatedBy === undefined) {
			delete (onlineState as any).lastUpdatedBy;
		}

		// Write game state to separate document
		await setDoc(gameRef, onlineState);

		// Update room's lastActivity timestamp
		await updateDoc(roomRef, {
			lastActivity: serverTimestamp(),
		});
	}

	subscribeToState(callback: (state: GameState) => void): () => void {
		if (!this.roomCode) {
			console.warn("[Adapter] subscribeToState called with no roomCode");
			return () => {};
		}

		const roomCode = this.roomCode;
		console.log(`[Adapter] Setting up state subscription for /games/${roomCode}`);
		const gameRef = doc(db, "games", roomCode);

		const unsubscribe = onSnapshot(
			gameRef,
			(snapshot) => {
				console.log(`[Adapter] onSnapshot callback fired for /games/${roomCode}`, {
					exists: snapshot.exists(),
					fromCache: snapshot.metadata.fromCache,
					hasPendingWrites: snapshot.metadata.hasPendingWrites,
				});
				if (snapshot.exists()) {
					const gameState = snapshot.data() as OnlineGameState;
					console.log(`[Adapter] Calling callback with syncVersion=${(gameState as any).syncVersion}`);
					callback(gameState);
				} else {
					console.warn(`[Adapter] Game document does not exist: /games/${roomCode}`);
				}
			},
			(error) => {
				console.error("[Adapter] State subscription error:", error);
			},
		);

		this.stateUnsubscribe = unsubscribe;
		return unsubscribe;
	}

	// ============================================
	// Player Operations
	// ============================================

	async updatePlayerName(name: string): Promise<void> {
		if (!this.roomCode || !this.odahId) return;

		// Name is stored in RTDB presence only (single source of truth)
		// No Firestore update needed - playerSlots only stores slot assignment
		if (this.presenceService) {
			await this.presenceService.updateName(name);
		}
	}

	async updatePlayerColor(color: string): Promise<void> {
		if (!this.roomCode || !this.odahId) return;

		// Color is stored in RTDB presence only (single source of truth)
		// No Firestore update needed - playerSlots only stores slot assignment
		if (this.presenceService) {
			await this.presenceService.updateColor(color);
		}
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
