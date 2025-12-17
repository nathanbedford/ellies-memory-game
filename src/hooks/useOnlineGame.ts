/**
 * useOnlineGame - Hook for online multiplayer game logic
 *
 * This hook wraps useGameController for online mode, providing:
 * - Firestore sync adapter integration
 * - Authority pattern (only current turn player runs game logic)
 * - Game state synchronization across devices
 *
 * Key principles:
 * 1. Current turn player is "authoritative" - runs game logic, syncs results
 * 2. Non-authoritative player is render-only - just displays Firestore updates
 * 3. Optimistic updates - authoritative player sees instant feedback
 * 4. Single source of truth - Firestore state is canonical
 */

import { useEffect, useMemo } from "react";
import { getFirestoreSyncAdapter } from "../services/sync/FirestoreSyncAdapter";
import { logger } from "../services/logging/LogService";
import type { GameState, Player } from "../types";
import { useGameController, type GameSettings } from "./useGameController";
import type { EffectManager } from "../services/effects";

interface UseOnlineGameOptions {
	roomCode: string;
	localPlayerSlot: number;
	flipDuration: number;
	initialGameState: GameState;
	players: Player[];
	effectManager?: EffectManager;
}

export function useOnlineGame(options: UseOnlineGameOptions) {
	const { roomCode, localPlayerSlot, flipDuration, initialGameState, players, effectManager } = options;

	// Set logger context for this room/player
	useEffect(() => {
		logger.setContext(roomCode, localPlayerSlot as 1 | 2);
		return () => logger.setContext(null, null);
	}, [roomCode, localPlayerSlot]);

	// Get the Firestore sync adapter
	const syncAdapter = useMemo(() => {
		if (!roomCode) return undefined;
		try {
			return getFirestoreSyncAdapter();
		} catch {
			console.warn("[useOnlineGame] Firestore adapter not available");
			return undefined;
		}
	}, [roomCode]);

	// Default settings for online mode (settings are managed by the host)
	const initialSettings: GameSettings = useMemo(() => ({
		flipDuration,
		cardSize: 100, // Default - not used in online mode
		autoSizeEnabled: true,
		useWhiteCardBackground: false,
		emojiSizePercentage: 100,
		ttsEnabled: false,
	}), [flipDuration]);

	// Use the game controller with online mode configuration
	const controller = useGameController({
		mode: "online",
		initialGameState,
		initialSettings,
		players,
		effectManager,
		syncAdapter,
		localPlayerSlot,
		roomCode,
	});

	// Update flipDuration when it changes from the host settings
	useEffect(() => {
		if (controller.settings.flipDuration !== flipDuration) {
			controller.updateSettings({ flipDuration });
		}
	}, [flipDuration, controller.settings.flipDuration, controller.updateSettings]);

	return {
		gameState: controller.gameState,
		setFullGameState: controller.setFullGameState,
		flipCard: controller.flipCard,
		endTurn: controller.endTurn,
		resetGame: controller.resetGame,
		isAuthoritative: controller.isAuthoritative,
		toggleAllCardsFlipped: controller.toggleAllCardsFlipped,
		endGameEarly: controller.endGameEarly,
		triggerGameFinish: controller.triggerGameFinish,
	};
}
