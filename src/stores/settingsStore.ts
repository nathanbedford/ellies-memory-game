/**
 * settingsStore - Persisted user preferences
 *
 * All settings that persist to localStorage across sessions.
 * Separated from transient UI state and game mechanics.
 */

import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import type { CardPack, Player } from "../types";
import { DEFAULT_PAIR_COUNT } from "../utils/gridLayout";

// ============================================
// Types
// ============================================

export interface GameSettings {
	// Player settings
	player1Name: string;
	player1Color: string;
	player2Name: string;
	player2Color: string;
	firstPlayer: 1 | 2;
	savedPlayerNames: string[]; // Array of previously used names

	// Display settings
	cardSize: number;
	autoSizeEnabled: boolean;
	useWhiteCardBackground: boolean;
	flipDuration: number;
	emojiSizePercentage: number;
	ttsEnabled: boolean;
	backgroundBlurEnabled: boolean;

	// Game settings
	cardPack: CardPack;
	background: string;
	cardBack: string;

	// Pair count settings (separate for local and online modes)
	localPairCount: number;
	onlinePairCount: number;
}

// PlayerSettings is the subset needed for getPlayersFromSettings
export interface PlayerSettings {
	player1Name: string;
	player1Color: string;
	player2Name: string;
	player2Color: string;
}

const DEFAULT_SETTINGS: GameSettings = {
	player1Name: "Player 1",
	player1Color: "#3b82f6",
	player2Name: "Player 2",
	player2Color: "#10b981",
	firstPlayer: 1,
	savedPlayerNames: [],
	cardSize: 100,
	autoSizeEnabled: true,
	useWhiteCardBackground: false,
	flipDuration: 1500,
	emojiSizePercentage: 72,
	ttsEnabled: false,
	backgroundBlurEnabled: true,
	cardPack: "animals",
	background: "default",
	cardBack: "default",
	localPairCount: DEFAULT_PAIR_COUNT,
	onlinePairCount: DEFAULT_PAIR_COUNT,
};

// ============================================
// Store Interface
// ============================================

interface SettingsStoreState {
	settings: GameSettings;
}

interface SettingsStoreActions {
	// Bulk update
	updateSettings: (partial: Partial<GameSettings>) => void;

	// Player settings
	setPlayerName: (playerId: number, name: string) => void;
	setPlayerColor: (playerId: number, color: string) => void;
	setFirstPlayer: (playerId: 1 | 2) => void;
	addSavedPlayerName: (name: string) => void;
	removeSavedPlayerName: (name: string) => void;
	swapPlayers: () => void;

	// Display settings
	setCardSize: (size: number) => void;
	setAutoSizeEnabled: (enabled: boolean) => void;
	setUseWhiteCardBackground: (enabled: boolean) => void;
	setFlipDuration: (duration: number) => void;
	setEmojiSizePercentage: (percentage: number) => void;
	setTtsEnabled: (enabled: boolean) => void;
	setBackgroundBlurEnabled: (enabled: boolean) => void;

	// Game settings
	setCardPack: (pack: CardPack) => void;
	setBackground: (bg: string) => void;
	setCardBack: (cb: string) => void;
	setLocalPairCount: (count: number) => void;
	setOnlinePairCount: (count: number) => void;
}

type SettingsStore = SettingsStoreState & SettingsStoreActions;

// ============================================
// Store Implementation
// ============================================

export const useSettingsStore = create<SettingsStore>()(
	subscribeWithSelector(
		persist(
			(set, get) => ({
				settings: DEFAULT_SETTINGS,

				// Bulk update
				updateSettings: (partial: Partial<GameSettings>) => {
					const { settings } = get();
					set({ settings: { ...settings, ...partial } });
				},

			// Player settings
			setPlayerName: (playerId: number, name: string) => {
				const { settings, addSavedPlayerName } = get();
				const settingsUpdate =
					playerId === 1 ? { player1Name: name } : { player2Name: name };
				set({ settings: { ...settings, ...settingsUpdate } });
				// Automatically add to saved names
				addSavedPlayerName(name);
			},

				setPlayerColor: (playerId: number, color: string) => {
					const { settings } = get();
					const settingsUpdate =
						playerId === 1 ? { player1Color: color } : { player2Color: color };
					set({ settings: { ...settings, ...settingsUpdate } });
				},

			setFirstPlayer: (playerId: 1 | 2) => {
				const { settings } = get();
				set({ settings: { ...settings, firstPlayer: playerId } });
			},

			addSavedPlayerName: (name: string) => {
				const trimmedName = name.trim();
				if (!trimmedName) return;

				const { settings } = get();
				const existingNames = settings.savedPlayerNames;

				// Check if name already exists (case-insensitive)
				const existingIndex = existingNames.findIndex(
					(n) => n.toLowerCase() === trimmedName.toLowerCase(),
				);

				let newNames: string[];
				if (existingIndex !== -1) {
					// Move to front (most recent), preserve original casing of existing
					newNames = [
						existingNames[existingIndex],
						...existingNames.filter((_, i) => i !== existingIndex),
					];
				} else {
					// Add to front
					newNames = [trimmedName, ...existingNames];
				}

				// Keep max 20 names
				if (newNames.length > 20) {
					newNames = newNames.slice(0, 20);
				}

				set({ settings: { ...settings, savedPlayerNames: newNames } });
			},

			removeSavedPlayerName: (name: string) => {
				const { settings } = get();
				const newNames = settings.savedPlayerNames.filter(
					(n) => n.toLowerCase() !== name.toLowerCase(),
				);
				set({ settings: { ...settings, savedPlayerNames: newNames } });
			},

			swapPlayers: () => {
				const { settings } = get();
				set({
					settings: {
						...settings,
						player1Name: settings.player2Name,
						player1Color: settings.player2Color,
						player2Name: settings.player1Name,
						player2Color: settings.player1Color,
					},
				});
			},

			// Display settings
				setCardSize: (size: number) => {
					const { settings } = get();
					set({ settings: { ...settings, cardSize: size } });
				},

				setAutoSizeEnabled: (enabled: boolean) => {
					const { settings } = get();
					set({ settings: { ...settings, autoSizeEnabled: enabled } });
				},

				setUseWhiteCardBackground: (enabled: boolean) => {
					const { settings } = get();
					set({ settings: { ...settings, useWhiteCardBackground: enabled } });
				},

				setFlipDuration: (duration: number) => {
					const { settings } = get();
					set({ settings: { ...settings, flipDuration: duration } });
				},

				setEmojiSizePercentage: (percentage: number) => {
					const { settings } = get();
					set({ settings: { ...settings, emojiSizePercentage: percentage } });
				},

				setTtsEnabled: (enabled: boolean) => {
					const { settings } = get();
					set({ settings: { ...settings, ttsEnabled: enabled } });
				},

				setBackgroundBlurEnabled: (enabled: boolean) => {
					const { settings } = get();
					set({ settings: { ...settings, backgroundBlurEnabled: enabled } });
				},

				// Game settings
				setCardPack: (pack: CardPack) => {
					const { settings } = get();
					set({ settings: { ...settings, cardPack: pack } });
				},

				setBackground: (bg: string) => {
					const { settings } = get();
					set({ settings: { ...settings, background: bg } });
				},

				setCardBack: (cb: string) => {
					const { settings } = get();
					set({ settings: { ...settings, cardBack: cb } });
				},

				setLocalPairCount: (count: number) => {
					const { settings } = get();
					set({ settings: { ...settings, localPairCount: count } });
				},

				setOnlinePairCount: (count: number) => {
					const { settings } = get();
					set({ settings: { ...settings, onlinePairCount: count } });
				},
			}),
			{
				name: "matchimus-settings",
				// Merge function to handle migration for new fields
				merge: (persistedState, currentState) => {
					const persisted = persistedState as Partial<SettingsStoreState>;

					// Get existing saved names or empty array
					let savedNames = persisted?.settings?.savedPlayerNames ?? [];

					// If empty, seed with existing player names (excluding defaults)
					if (savedNames.length === 0) {
						const p1 = persisted?.settings?.player1Name;
						const p2 = persisted?.settings?.player2Name;
						const defaults = ["Player 1", "Player 2"];

						if (p1 && !defaults.includes(p1)) {
							savedNames = [...savedNames, p1];
						}
						if (
							p2 &&
							!defaults.includes(p2) &&
							p2.toLowerCase() !== p1?.toLowerCase()
						) {
							savedNames = [...savedNames, p2];
						}
					}

					return {
						...currentState,
						settings: {
							...currentState.settings,
							...persisted?.settings,
							savedPlayerNames: savedNames,
						},
					};
				},
			},
		),
	),
);

// ============================================
// Selectors
// ============================================

export const selectSettings = (state: SettingsStore) => state.settings;

// Derive players from settings
export const selectPlayers = (state: SettingsStore): Player[] => [
	{
		id: 1,
		name: state.settings.player1Name,
		color: state.settings.player1Color,
	},
	{
		id: 2,
		name: state.settings.player2Name,
		color: state.settings.player2Color,
	},
];

export const selectFirstPlayer = (state: SettingsStore) =>
	state.settings.firstPlayer;
export const selectCardSize = (state: SettingsStore) => state.settings.cardSize;
export const selectAutoSizeEnabled = (state: SettingsStore) =>
	state.settings.autoSizeEnabled;
export const selectFlipDuration = (state: SettingsStore) =>
	state.settings.flipDuration;
export const selectCardPack = (state: SettingsStore) => state.settings.cardPack;
export const selectBackground = (state: SettingsStore) =>
	state.settings.background;
export const selectCardBack = (state: SettingsStore) => state.settings.cardBack;
export const selectLocalPairCount = (state: SettingsStore) =>
	state.settings.localPairCount;
export const selectOnlinePairCount = (state: SettingsStore) =>
	state.settings.onlinePairCount;
export const selectBackgroundBlurEnabled = (state: SettingsStore) =>
	state.settings.backgroundBlurEnabled;
export const selectSavedPlayerNames = (state: SettingsStore) =>
	state.settings.savedPlayerNames;
