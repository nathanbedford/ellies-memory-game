/**
 * useOpponentDisconnect - Hook for detecting opponent disconnect during online gameplay
 *
 * Provides:
 * - isDisconnected: true when opponent is offline and was previously online
 * - secondsRemaining: countdown from timeout (default 60s)
 * - opponentName: name of the disconnected opponent
 *
 * The hook reads from onlineStore's presence tracking and manages a countdown timer.
 */

import { useState, useEffect, useMemo } from "react";
import { useOnlineStore } from "../stores/onlineStore";

interface UseOpponentDisconnectOptions {
	timeoutSeconds?: number; // Default: 60
}

interface UseOpponentDisconnectResult {
	isDisconnected: boolean;
	secondsRemaining: number;
	opponentName: string;
}

export function useOpponentDisconnect(
	options: UseOpponentDisconnectOptions = {},
): UseOpponentDisconnectResult {
	const { timeoutSeconds = 60 } = options;

	// Get presence state from store
	const opponentConnected = useOnlineStore((s) => s.opponentConnected);
	const opponentDisconnectedAt = useOnlineStore(
		(s) => s.opponentDisconnectedAt,
	);
	const room = useOnlineStore((s) => s.room);
	const odahId = useOnlineStore((s) => s.odahId);

	// Countdown state
	const [secondsRemaining, setSecondsRemaining] = useState(timeoutSeconds);

	// Get opponent name from room
	const opponentName = useMemo(() => {
		if (!room || !odahId) return "Opponent";

		const opponent = Object.entries(room.players).find(([id]) => id !== odahId);
		return opponent?.[1]?.name ?? "Opponent";
	}, [room, odahId]);

	// Countdown timer effect
	useEffect(() => {
		// If opponent is connected or no disconnect timestamp, reset countdown
		if (!opponentDisconnectedAt || opponentConnected) {
			setSecondsRemaining(timeoutSeconds);
			return;
		}

		// Calculate initial remaining time based on when disconnect occurred
		const calculateRemaining = () => {
			const elapsed = Math.floor((Date.now() - opponentDisconnectedAt) / 1000);
			return Math.max(0, timeoutSeconds - elapsed);
		};

		// Set initial value
		setSecondsRemaining(calculateRemaining());

		// Update every second
		const interval = setInterval(() => {
			setSecondsRemaining(calculateRemaining());
		}, 1000);

		return () => clearInterval(interval);
	}, [opponentDisconnectedAt, opponentConnected, timeoutSeconds]);

	// Determine if we should show the disconnect UI
	// Only show if opponent was previously connected and is now disconnected
	const isDisconnected = !opponentConnected && opponentDisconnectedAt !== null;

	return {
		isDisconnected,
		secondsRemaining,
		opponentName,
	};
}
