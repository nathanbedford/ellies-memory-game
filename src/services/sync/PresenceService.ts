/**
 * PresenceService - Realtime Database presence tracking
 *
 * Uses Firebase RTDB for presence because:
 * 1. Native onDisconnect() hooks that fire even on browser crash
 * 2. Lower latency than Firestore (~10ms vs ~100ms)
 * 3. Firebase's recommended pattern for presence systems
 */

import {
	type DatabaseReference,
	off,
	onDisconnect,
	onValue,
	ref,
	serverTimestamp,
	set,
} from "firebase/database";
import { rtdb } from "../../lib/firebase";

// Type that allows serverTimestamp() placeholder for writes
// When read back, lastSeen will be a number
export interface PresenceDataInternal {
	odahId: string;
	name: string;
	color: string;
	slot: 1 | 2;
	online: boolean;
	lastSeen: object | number; // serverTimestamp() returns object, stored as number
}

export class PresenceService {
	private roomCode: string;
	private odahId: string;
	private playerName: string;
	private playerColor: string;
	private playerSlot: 1 | 2;
	private presenceRef: DatabaseReference | null = null;
	private connectedRef: DatabaseReference | null = null;
	private unsubscribeConnected: (() => void) | null = null;

	constructor(
		roomCode: string,
		odahId: string,
		playerName: string,
		playerColor: string,
		playerSlot: 1 | 2,
	) {
		this.roomCode = roomCode;
		this.odahId = odahId;
		this.playerName = playerName;
		this.playerColor = playerColor;
		this.playerSlot = playerSlot;
	}

	/**
	 * Start presence tracking
	 * Sets up onDisconnect hook before marking as online
	 */
	async start(): Promise<void> {
		this.presenceRef = ref(rtdb, `presence/${this.roomCode}/${this.odahId}`);
		this.connectedRef = ref(rtdb, ".info/connected");

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error("Presence connection timeout"));
			}, 10000);

			this.unsubscribeConnected = onValue(this.connectedRef!, (snapshot) => {
				if (snapshot.val() === true) {
					clearTimeout(timeout);

					// Set up onDisconnect BEFORE marking as online
					// This ensures the cleanup runs even if browser crashes
					onDisconnect(this.presenceRef!).set({
						odahId: this.odahId,
						name: this.playerName,
						color: this.playerColor,
						slot: this.playerSlot,
						online: false,
						lastSeen: serverTimestamp(),
					} as PresenceDataInternal);

					// Now mark as online
					set(this.presenceRef!, {
						odahId: this.odahId,
						name: this.playerName,
						color: this.playerColor,
						slot: this.playerSlot,
						online: true,
						lastSeen: serverTimestamp(),
					} as PresenceDataInternal)
						.then(() => resolve())
						.catch(reject);
				}
			});
		});
	}

	/**
	 * Stop presence tracking
	 */
	async stop(): Promise<void> {
		if (this.unsubscribeConnected) {
			// Remove the listener by calling off() on the reference
			if (this.connectedRef) {
				off(this.connectedRef);
			}
			this.unsubscribeConnected = null;
		}

		if (this.presenceRef) {
			// Cancel the onDisconnect hook
			await onDisconnect(this.presenceRef).cancel();

			// Mark as offline
			await set(this.presenceRef, {
				odahId: this.odahId,
				name: this.playerName,
				color: this.playerColor,
				slot: this.playerSlot,
				online: false,
				lastSeen: serverTimestamp(),
			} as PresenceDataInternal);
		}

		this.presenceRef = null;
		this.connectedRef = null;
	}

	/**
	 * Update player name in presence
	 */
	async updateName(newName: string): Promise<void> {
		this.playerName = newName;
		if (this.presenceRef) {
			await set(this.presenceRef, {
				odahId: this.odahId,
				name: newName,
				color: this.playerColor,
				slot: this.playerSlot,
				online: true,
				lastSeen: serverTimestamp(),
			} as PresenceDataInternal);
		}
	}

	/**
	 * Update player color in presence
	 */
	async updateColor(newColor: string): Promise<void> {
		this.playerColor = newColor;
		if (this.presenceRef) {
			await set(this.presenceRef, {
				odahId: this.odahId,
				name: this.playerName,
				color: newColor,
				slot: this.playerSlot,
				online: true,
				lastSeen: serverTimestamp(),
			} as PresenceDataInternal);
		}
	}

	/**
	 * Subscribe to all players' presence in a room
	 */
	static subscribeToRoomPresence(
		roomCode: string,
		callback: (players: Record<string, PresenceDataInternal>) => void,
	): () => void {
		const roomPresenceRef = ref(rtdb, `presence/${roomCode}`);

		// Store the callback function so we can unsubscribe just THIS listener
		const listenerCallback = (
			snapshot: import("firebase/database").DataSnapshot,
		) => {
			const data = snapshot.val() as Record<
				string,
				PresenceDataInternal
			> | null;
			callback(data || {});
		};

		onValue(roomPresenceRef, listenerCallback);

		// Return unsubscribe function that removes ONLY this specific listener
		return () => {
			off(roomPresenceRef, "value", listenerCallback);
		};
	}

	/**
	 * Subscribe to a specific player's presence
	 */
	static subscribeToPlayerPresence(
		roomCode: string,
		odahId: string,
		callback: (presence: PresenceDataInternal | null) => void,
	): () => void {
		const playerPresenceRef = ref(rtdb, `presence/${roomCode}/${odahId}`);

		onValue(playerPresenceRef, (snapshot) => {
			const data = snapshot.val() as PresenceDataInternal | null;
			callback(data);
		});

		return () => {
			off(playerPresenceRef);
		};
	}

	/**
	 * Clean up room presence (called when room is deleted)
	 */
	static async cleanupRoomPresence(roomCode: string): Promise<void> {
		const roomPresenceRef = ref(rtdb, `presence/${roomCode}`);
		await set(roomPresenceRef, null);
	}
}
