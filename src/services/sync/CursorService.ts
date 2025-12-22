/**
 * CursorService - Realtime Database cursor position sharing
 *
 * Uses Firebase RTDB for cursor sync because:
 * 1. Lower latency than Firestore (~10ms vs ~100ms)
 * 2. Ideal for high-frequency updates like cursor positions
 * 3. Native onDisconnect() to clean up cursor when player leaves
 */

import {
	type DatabaseReference,
	off,
	onDisconnect,
	onValue,
	ref,
	set,
} from "firebase/database";
import { rtdb } from "../../lib/firebase";
import type { CursorPosition } from "../../types";

// Throttle interval in ms (20 updates/sec max)
const THROTTLE_MS = 50;

export class CursorService {
	private roomCode: string;
	private odahId: string;
	private cursorRef: DatabaseReference | null = null;
	private lastUpdateTime = 0;
	private pendingUpdate: CursorPosition | null = null;
	private throttleTimeout: ReturnType<typeof setTimeout> | null = null;

	constructor(roomCode: string, odahId: string) {
		this.roomCode = roomCode;
		this.odahId = odahId;
	}

	/**
	 * Start cursor tracking
	 * Sets up onDisconnect hook to remove cursor when player leaves
	 */
	async start(): Promise<void> {
		this.cursorRef = ref(rtdb, `cursors/${this.roomCode}/${this.odahId}`);

		// Set up onDisconnect to remove cursor data when player disconnects
		await onDisconnect(this.cursorRef).remove();
	}

	/**
	 * Stop cursor tracking and clean up
	 */
	async stop(): Promise<void> {
		// Clear any pending throttled update
		if (this.throttleTimeout) {
			clearTimeout(this.throttleTimeout);
			this.throttleTimeout = null;
		}

		if (this.cursorRef) {
			// Cancel the onDisconnect hook
			await onDisconnect(this.cursorRef).cancel();

			// Remove cursor data
			await set(this.cursorRef, null);
		}

		this.cursorRef = null;
		this.pendingUpdate = null;
	}

	/**
	 * Update cursor position (throttled to THROTTLE_MS interval)
	 * @param x - Normalized x position (0-1)
	 * @param y - Normalized y position (0-1)
	 */
	updatePosition(x: number, y: number): void {
		if (!this.cursorRef) return;

		const position: CursorPosition = {
			x,
			y,
			timestamp: Date.now(),
		};

		const now = Date.now();
		const timeSinceLastUpdate = now - this.lastUpdateTime;

		if (timeSinceLastUpdate >= THROTTLE_MS) {
			// Enough time has passed, update immediately
			this.lastUpdateTime = now;
			set(this.cursorRef, position).catch((error) => {
				console.error("[CursorService] Failed to update position:", error);
			});
		} else {
			// Store pending update and schedule it
			this.pendingUpdate = position;

			if (!this.throttleTimeout) {
				const delay = THROTTLE_MS - timeSinceLastUpdate;
				this.throttleTimeout = setTimeout(() => {
					this.throttleTimeout = null;
					if (this.pendingUpdate && this.cursorRef) {
						this.lastUpdateTime = Date.now();
						set(this.cursorRef, this.pendingUpdate).catch((error) => {
							console.error(
								"[CursorService] Failed to update position:",
								error,
							);
						});
						this.pendingUpdate = null;
					}
				}, delay);
			}
		}
	}

	/**
	 * Clear cursor position (e.g., when mouse leaves the board)
	 */
	clearPosition(): void {
		if (!this.cursorRef) return;

		// Clear any pending update
		if (this.throttleTimeout) {
			clearTimeout(this.throttleTimeout);
			this.throttleTimeout = null;
		}
		this.pendingUpdate = null;

		set(this.cursorRef, null).catch((error) => {
			console.error("[CursorService] Failed to clear position:", error);
		});
	}

	/**
	 * Subscribe to a specific player's cursor position
	 */
	static subscribeToCursor(
		roomCode: string,
		odahId: string,
		callback: (position: CursorPosition | null) => void,
	): () => void {
		const cursorRef = ref(rtdb, `cursors/${roomCode}/${odahId}`);

		onValue(cursorRef, (snapshot) => {
			const data = snapshot.val() as CursorPosition | null;
			callback(data);
		});

		return () => {
			off(cursorRef);
		};
	}

	/**
	 * Subscribe to all cursors in a room
	 */
	static subscribeToRoomCursors(
		roomCode: string,
		callback: (cursors: Record<string, CursorPosition>) => void,
	): () => void {
		const roomCursorsRef = ref(rtdb, `cursors/${roomCode}`);

		onValue(roomCursorsRef, (snapshot) => {
			const data = snapshot.val() as Record<string, CursorPosition> | null;
			callback(data || {});
		});

		return () => {
			off(roomCursorsRef);
		};
	}

	/**
	 * Clean up all cursors in a room (called when room is deleted)
	 */
	static async cleanupRoomCursors(roomCode: string): Promise<void> {
		const roomCursorsRef = ref(rtdb, `cursors/${roomCode}`);
		await set(roomCursorsRef, null);
	}
}
