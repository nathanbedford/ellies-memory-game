/**
 * onlineStore - Zustand store for online multiplayer state
 *
 * Manages connection status, room state, and player presence.
 * Does NOT persist to localStorage since online state is transient.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
	GameMode,
	ConnectionStatus,
	Room,
	PresenceData,
	CardPack,
} from "../types";
import {
	getFirestoreSyncAdapter,
	resetFirestoreSyncAdapter,
} from "../services/sync/FirestoreSyncAdapter";
import { PresenceService } from "../services/sync/PresenceService";

// ============================================
// Module-level subscription management
// ============================================

// Store the unsubscribe function outside of Zustand state
let roomUnsubscribe: (() => void) | null = null;

// Helper to start room subscription
const startRoomSubscription = (
	roomCode: string,
	set: (partial: Partial<OnlineStoreState>) => void,
) => {
	// Clean up any existing subscription first
	if (roomUnsubscribe) {
		roomUnsubscribe();
		roomUnsubscribe = null;
	}

	const adapter = getFirestoreSyncAdapter();
	roomUnsubscribe = adapter.subscribeToRoom(roomCode, (room) => {
		set({ room });
	});
};

// Helper to stop room subscription
const stopRoomSubscription = () => {
	if (roomUnsubscribe) {
		roomUnsubscribe();
		roomUnsubscribe = null;
	}
};

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
	playerName: string;

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
	joinRoom: (
		roomCode: string,
		playerName: string,
		playerColor: string,
	) => Promise<Room>;
	leaveRoom: () => Promise<void>;

	// Room config (host only)
	updateRoomConfig: (config: {
		cardPack?: CardPack;
		background?: string;
		cardBack?: string;
		pairCount?: number;
	}) => Promise<void>;

	// Player actions
	updatePlayerName: (name: string) => Promise<void>;
	updatePlayerColor: (color: string) => Promise<void>;
	setPlayerNamePreference: (name: string) => void;

	// Preference actions
	setLastOnlinePreferences: (
		cardPack: CardPack,
		background: string,
		cardBack: string,
	) => void;
	getLastOnlinePreferences: () => {
		cardPack: CardPack | null;
		background: string | null;
		cardBack: string | null;
	};

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
	connectionStatus: "disconnected",
	odahId: null,
	room: null,
	roomCode: null,
	isHost: false,
	playerName: "Player",
	presenceData: {},
	opponentConnected: false,
	opponentDisconnectedAt: null,
	error: null,
};

const ONLINE_NAME_STORAGE_KEY = "onlinePlayerName";
const ONLINE_CARD_PACK_KEY = "onlineCardPack";
const ONLINE_BACKGROUND_KEY = "onlineBackground";
const ONLINE_CARD_BACK_KEY = "onlineCardBack";

const getStoredOnlinePlayerName = (): string => {
	if (typeof window === "undefined") {
		return "Player";
	}
	const stored = localStorage.getItem(ONLINE_NAME_STORAGE_KEY);
	if (stored && stored.trim().length > 0) {
		return stored.trim();
	}
	const fallback = localStorage.getItem("player1Name");
	return fallback && fallback.trim().length > 0 ? fallback.trim() : "Player";
};

const getStoredOnlineCardPack = (): CardPack | null => {
	if (typeof window === "undefined") {
		return null;
	}
	const stored = localStorage.getItem(ONLINE_CARD_PACK_KEY);
	return (stored as CardPack) || null;
};

const getStoredOnlineBackground = (): string | null => {
	if (typeof window === "undefined") {
		return null;
	}
	return localStorage.getItem(ONLINE_BACKGROUND_KEY);
};

const getStoredOnlineCardBack = (): string | null => {
	if (typeof window === "undefined") {
		return null;
	}
	return localStorage.getItem(ONLINE_CARD_BACK_KEY);
};

// ============================================
// Store Implementation
// ============================================

export const useOnlineStore = create<OnlineStore>()(
	subscribeWithSelector((set, get) => ({
		...initialState,
		playerName: getStoredOnlinePlayerName(),

		// Mode actions
		setGameMode: (mode: GameMode | null) => {
			set({ gameMode: mode });
		},

		// Connection actions
		connect: async () => {
			const { connectionStatus } = get();
			if (
				connectionStatus === "connected" ||
				connectionStatus === "connecting"
			) {
				return;
			}

			set({ connectionStatus: "connecting", error: null });

			try {
				const adapter = getFirestoreSyncAdapter();
				await adapter.connect();

				set({
					connectionStatus: "connected",
					odahId: adapter.getOdahId(),
				});
			} catch (error) {
				set({
					connectionStatus: "disconnected",
					error: error instanceof Error ? error.message : "Connection failed",
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
				console.error("Disconnect error:", error);
			}

			set({
				connectionStatus: "disconnected",
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
			const { odahId, setLastOnlinePreferences } = get();
			if (!odahId) {
				throw new Error("Not connected");
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

				// Save preferences after creating room
				setLastOnlinePreferences(
					options.cardPack,
					options.background,
					options.cardBack,
				);

				set({
					roomCode,
					isHost: true,
				});

				// Start room subscription automatically
				startRoomSubscription(roomCode, set);

				return roomCode;
			} catch (error) {
				set({
					error:
						error instanceof Error ? error.message : "Failed to create room",
				});
				throw error;
			}
		},

		joinRoom: async (
			roomCode: string,
			playerName: string,
			playerColor: string,
		) => {
			const { odahId } = get();
			if (!odahId) {
				throw new Error("Not connected");
			}

			set({ error: null });

			try {
				const adapter = getFirestoreSyncAdapter();
				const room = await adapter.joinRoom(roomCode, {
					odahId,
					name: playerName,
					color: playerColor,
				});

				const normalizedRoomCode = roomCode.toUpperCase();

				set({
					room,
					roomCode: normalizedRoomCode,
					isHost: false,
				});

				// Start room subscription automatically
				startRoomSubscription(normalizedRoomCode, set);

				return room;
			} catch (error) {
				set({
					error: error instanceof Error ? error.message : "Failed to join room",
				});
				throw error;
			}
		},

		leaveRoom: async () => {
			set({ error: null });

			// Stop room subscription before leaving
			stopRoomSubscription();

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
					error:
						error instanceof Error ? error.message : "Failed to leave room",
				});
				throw error;
			}
		},

		// Room config (host only)
		updateRoomConfig: async (config) => {
			const { roomCode, isHost, setLastOnlinePreferences } = get();
			if (!roomCode || !isHost) {
				throw new Error("Only host can update room config");
			}

			set({ error: null });

			try {
				const adapter = getFirestoreSyncAdapter();
				await adapter.updateRoomConfig(roomCode, config);

				// Save preferences when config is updated
				if (config.cardPack || config.background || config.cardBack) {
					const { room } = get();
					if (room?.config) {
						const finalCardPack = config.cardPack || room.config.cardPack;
						const finalBackground = config.background || room.config.background;
						const finalCardBack = config.cardBack || room.config.cardBack;
						if (finalCardPack && finalBackground && finalCardBack) {
							setLastOnlinePreferences(
								finalCardPack,
								finalBackground,
								finalCardBack,
							);
						}
					}
				}
			} catch (error) {
				set({
					error:
						error instanceof Error
							? error.message
							: "Failed to update room config",
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
					error:
						error instanceof Error ? error.message : "Failed to update name",
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
					error:
						error instanceof Error ? error.message : "Failed to update color",
				});
				throw error;
			}
		},

		setPlayerNamePreference: (name: string) => {
			const trimmed = name.trim() || "Player";
			if (typeof window !== "undefined") {
				localStorage.setItem(ONLINE_NAME_STORAGE_KEY, trimmed);
			}
			set({ playerName: trimmed });
		},

		// Preference actions
		setLastOnlinePreferences: (
			cardPack: CardPack,
			background: string,
			cardBack: string,
		) => {
			if (typeof window !== "undefined") {
				localStorage.setItem(ONLINE_CARD_PACK_KEY, cardPack);
				localStorage.setItem(ONLINE_BACKGROUND_KEY, background);
				localStorage.setItem(ONLINE_CARD_BACK_KEY, cardBack);
			}
		},

		getLastOnlinePreferences: () => {
			return {
				cardPack: getStoredOnlineCardPack(),
				background: getStoredOnlineBackground(),
				cardBack: getStoredOnlineCardBack(),
			};
		},

		// Presence actions
		subscribeToPresence: (roomCode: string) => {
			return PresenceService.subscribeToRoomPresence(
				roomCode,
				(presenceData) => {
					// Convert internal presence data to external format
					const converted: Record<string, PresenceData> = {};
					for (const [id, data] of Object.entries(presenceData)) {
						converted[id] = {
							odahId: data.odahId,
							name: data.name,
							color: data.color,
							slot: data.slot,
							online: data.online,
							lastSeen:
								typeof data.lastSeen === "number" ? data.lastSeen : Date.now(),
						};
					}

					// Check if opponent is connected
					const { odahId, opponentConnected: prevOpponentConnected } = get();
					const opponentConnected = Object.values(converted).some(
						(p) => p.odahId !== odahId && p.online,
					);

					// Track disconnect timing for overlay countdown
					let opponentDisconnectedAt = get().opponentDisconnectedAt;
					if (!opponentConnected && prevOpponentConnected) {
						// Opponent just disconnected - record timestamp
						opponentDisconnectedAt = Date.now();
						console.log(
							"[PRESENCE] Opponent disconnected at:",
							opponentDisconnectedAt,
						);
					} else if (opponentConnected && !prevOpponentConnected) {
						// Opponent reconnected - clear timestamp
						opponentDisconnectedAt = null;
						console.log("[PRESENCE] Opponent reconnected");
					}

					set({
						presenceData: converted,
						opponentConnected,
						opponentDisconnectedAt,
					});
				},
			);
		},

		setPresenceData: (data: Record<string, PresenceData>) => {
			const { odahId } = get();
			const opponentConnected = Object.values(data).some(
				(p) => p.odahId !== odahId && p.online,
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
			// Stop room subscription before resetting
			stopRoomSubscription();
			resetFirestoreSyncAdapter();
			set((state) => ({
				...initialState,
				playerName: state.playerName,
			}));
		},
	})),
);

// ============================================
// Selectors
// ============================================

export const selectIsOnline = (state: OnlineStore) =>
	state.gameMode === "online";

export const selectIsConnected = (state: OnlineStore) =>
	state.connectionStatus === "connected";

export const selectIsInRoom = (state: OnlineStore) => state.roomCode !== null;

export const selectCanStartGame = (state: OnlineStore) =>
	state.isHost &&
	state.room !== null &&
	Object.keys(state.presenceData).length === 2 &&
	state.opponentConnected;

export const selectOpponent = (state: OnlineStore) => {
	if (!state.odahId) return null;

	// Find opponent in presence data
	const opponentEntry = Object.entries(state.presenceData).find(
		([id]) => id !== state.odahId,
	);

	if (!opponentEntry) return null;

	const [id, presence] = opponentEntry;

	return {
		odahId: id,
		name: presence.name,
		color: presence.color,
		slot: presence.slot,
		online: presence.online,
	};
};

export const selectSelf = (state: OnlineStore) => {
	if (!state.odahId) return null;

	// Get self from presence data
	const presence = state.presenceData[state.odahId];
	if (!presence) return null;

	return {
		odahId: state.odahId,
		name: presence.name,
		color: presence.color,
		slot: presence.slot,
	};
};
