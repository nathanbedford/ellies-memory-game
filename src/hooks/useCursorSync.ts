/**
 * useCursorSync - Hook for syncing cursor positions in online mode
 *
 * Handles:
 * - Broadcasting local cursor position to Firebase RTDB
 * - Subscribing to opponent's cursor position
 * - Converting between pixel and normalized coordinates
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { CursorService } from "../services/sync/CursorService";
import type { CursorPosition } from "../types";

interface UseCursorSyncOptions {
	roomCode: string;
	localOdahId: string;
	opponentOdahId: string | null;
	enabled: boolean;
}

interface UseCursorSyncResult {
	/** Opponent's cursor position (normalized 0-1) */
	opponentCursor: CursorPosition | null;
	/** Handler for mouse move events on the game board */
	handleMouseMove: (
		event: React.MouseEvent<HTMLDivElement>,
		boardRect: DOMRect,
	) => void;
	/** Handler for when mouse leaves the game board */
	handleMouseLeave: () => void;
}

export function useCursorSync(
	options: UseCursorSyncOptions,
): UseCursorSyncResult {
	const { roomCode, localOdahId, opponentOdahId, enabled } = options;

	const [opponentCursor, setOpponentCursor] = useState<CursorPosition | null>(
		null,
	);
	const cursorServiceRef = useRef<CursorService | null>(null);

	// Initialize cursor service for local player
	useEffect(() => {
		if (!enabled || !roomCode || !localOdahId) {
			return;
		}

		const service = new CursorService(roomCode, localOdahId);
		cursorServiceRef.current = service;

		service.start().catch((error) => {
			console.error("[useCursorSync] Failed to start cursor service:", error);
		});

		return () => {
			service.stop().catch((error) => {
				console.error("[useCursorSync] Failed to stop cursor service:", error);
			});
			cursorServiceRef.current = null;
		};
	}, [enabled, roomCode, localOdahId]);

	// Subscribe to opponent's cursor
	useEffect(() => {
		if (!enabled || !roomCode || !opponentOdahId) {
			setOpponentCursor(null);
			return;
		}

		const unsubscribe = CursorService.subscribeToCursor(
			roomCode,
			opponentOdahId,
			(position) => {
				setOpponentCursor(position);
			},
		);

		return () => {
			unsubscribe();
			setOpponentCursor(null);
		};
	}, [enabled, roomCode, opponentOdahId]);

	// Handle mouse move - convert pixel position to normalized coordinates
	const handleMouseMove = useCallback(
		(event: React.MouseEvent<HTMLDivElement>, boardRect: DOMRect) => {
			if (!cursorServiceRef.current || !enabled) return;

			// Calculate position relative to the board
			const x = (event.clientX - boardRect.left) / boardRect.width;
			const y = (event.clientY - boardRect.top) / boardRect.height;

			// Clamp to 0-1 range
			const clampedX = Math.max(0, Math.min(1, x));
			const clampedY = Math.max(0, Math.min(1, y));

			cursorServiceRef.current.updatePosition(clampedX, clampedY);
		},
		[enabled],
	);

	// Handle mouse leave - clear cursor position
	const handleMouseLeave = useCallback(() => {
		if (!cursorServiceRef.current || !enabled) return;
		cursorServiceRef.current.clearPosition();
	}, [enabled]);

	return {
		opponentCursor,
		handleMouseMove,
		handleMouseLeave,
	};
}
