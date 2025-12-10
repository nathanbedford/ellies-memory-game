/**
 * useOnlineGameSync - Bidirectional state sync for online multiplayer
 *
 * Handles:
 * 1. Subscribing to remote state changes from Firestore
 * 2. Syncing local state changes to Firestore
 * 3. Using lastUpdatedBy to prevent sync loops (skip updates we made ourselves)
 */

import { useEffect, useCallback, useRef } from "react";
import { getFirestoreSyncAdapter } from "../services/sync/FirestoreSyncAdapter";
import type { GameState, OnlineGameState } from "../types";

interface UseOnlineGameSyncOptions {
	isOnline: boolean;
	roomCode: string | null;
	localPlayerSlot: number | null;
	setFullGameState: (state: GameState) => void;
}

export function useOnlineGameSync(options: UseOnlineGameSyncOptions) {
	const { isOnline, roomCode, localPlayerSlot, setFullGameState } = options;
	const lastSyncedVersionRef = useRef(0);
	// Track when we're processing a remote update (to prevent App.tsx from syncing it back)
	const isProcessingRemoteUpdateRef = useRef(false);

	// Subscribe to remote state changes
	useEffect(() => {
		if (!isOnline || !roomCode) return;

		const adapter = getFirestoreSyncAdapter();
		const unsub = adapter.subscribeToState((remoteState) => {
			const onlineState = remoteState as OnlineGameState;
			const remoteVersion = onlineState.syncVersion || 0;
			const lastUpdatedBy = onlineState.lastUpdatedBy;

			// Skip if this update came from us (prevents infinite loop)
			if (lastUpdatedBy === localPlayerSlot) {
				console.log("[SYNC] Skipping self-update", {
					lastUpdatedBy,
					localPlayerSlot,
					version: remoteVersion,
				});
				// Still update version tracking
				lastSyncedVersionRef.current = Math.max(
					lastSyncedVersionRef.current,
					remoteVersion,
				);
				return;
			}

			// Only apply if remote is newer
			if (remoteVersion > lastSyncedVersionRef.current) {
				console.log("[SYNC] Applying remote state update", {
					remoteVersion,
					localVersion: lastSyncedVersionRef.current,
					lastUpdatedBy,
					localPlayerSlot,
				});
				lastSyncedVersionRef.current = remoteVersion;

				// Mark that we're processing a remote update
				isProcessingRemoteUpdateRef.current = true;
				setFullGameState(remoteState);

				// Reset the flag after React has processed the update
				// Using setTimeout to ensure it happens after the effect in App.tsx runs
				setTimeout(() => {
					isProcessingRemoteUpdateRef.current = false;
				}, 0);
			}
		});

		return unsub;
	}, [isOnline, roomCode, localPlayerSlot, setFullGameState]);

	// Sync local changes to Firestore
	const syncToFirestore = useCallback(
		async (state: GameState) => {
			if (!isOnline || !roomCode || localPlayerSlot === null) {
				console.log("[SYNC] Skipping sync - not ready", {
					isOnline,
					roomCode,
					localPlayerSlot,
				});
				return;
			}

			try {
				const adapter = getFirestoreSyncAdapter();

				// Add lastUpdatedBy to track who made this update
				const currentVersion =
					(state as OnlineGameState).syncVersion ||
					lastSyncedVersionRef.current ||
					0;
				const newVersion = currentVersion + 1;

				const onlineState: OnlineGameState = {
					...state,
					syncVersion: newVersion,
					lastUpdatedBy: localPlayerSlot,
					gameRound: (state as OnlineGameState).gameRound || 0,
				};

				await adapter.setState(onlineState);

				// Update our version tracking
				lastSyncedVersionRef.current = newVersion;

				console.log("[SYNC] Synced local state to Firestore", {
					version: newVersion,
					lastUpdatedBy: localPlayerSlot,
					gameStatus: state.gameStatus,
					currentPlayer: state.currentPlayer,
				});
			} catch (error) {
				console.error("[SYNC] Failed to sync state:", error);
			}
		},
		[isOnline, roomCode, localPlayerSlot],
	);

	// Function to check if we're currently processing a remote update
	// Used by App.tsx to avoid syncing state it just received
	const isProcessingRemoteUpdate = useCallback(() => {
		return isProcessingRemoteUpdateRef.current;
	}, []);

	return { syncToFirestore, isProcessingRemoteUpdate };
}
