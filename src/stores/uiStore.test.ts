/**
 * uiStore Tests
 *
 * Tests for transient UI state including modal visibility,
 * animation flags, and layout metrics.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
	useUIStore,
	selectShowStartModal,
	selectIsAnimatingCards,
	selectAllCardsFlipped,
	selectLayoutMetrics,
} from "./uiStore";
import { createTestLayoutMetrics } from "../test/testUtils";

describe("uiStore", () => {
	beforeEach(() => {
		// Reset store to initial state before each test
		useUIStore.getState().resetUIState();
	});

	// ============================================
	// Initial State Tests
	// ============================================

	describe("initial state", () => {
		it("should start with showStartModal false", () => {
			expect(useUIStore.getState().showStartModal).toBe(false);
		});

		it("should start with isAnimatingCards false", () => {
			expect(useUIStore.getState().isAnimatingCards).toBe(false);
		});

		it("should start with allCardsFlipped false", () => {
			expect(useUIStore.getState().allCardsFlipped).toBe(false);
		});

		it("should start with zero layout metrics", () => {
			const { layoutMetrics } = useUIStore.getState();
			expect(layoutMetrics.boardWidth).toBe(0);
			expect(layoutMetrics.boardAvailableHeight).toBe(0);
			expect(layoutMetrics.scoreboardHeight).toBe(0);
		});
	});

	// ============================================
	// Modal Actions Tests
	// ============================================

	describe("modal actions", () => {
		it("should show start modal", () => {
			const { setShowStartModal } = useUIStore.getState();

			setShowStartModal(true);
			expect(useUIStore.getState().showStartModal).toBe(true);
		});

		it("should hide start modal", () => {
			const { setShowStartModal } = useUIStore.getState();

			setShowStartModal(true);
			setShowStartModal(false);
			expect(useUIStore.getState().showStartModal).toBe(false);
		});

		it("should toggle start modal", () => {
			const { setShowStartModal } = useUIStore.getState();

			setShowStartModal(true);
			expect(useUIStore.getState().showStartModal).toBe(true);

			setShowStartModal(false);
			expect(useUIStore.getState().showStartModal).toBe(false);

			setShowStartModal(true);
			expect(useUIStore.getState().showStartModal).toBe(true);
		});
	});

	// ============================================
	// Animation Actions Tests
	// ============================================

	describe("animation actions", () => {
		it("should set isAnimatingCards to true", () => {
			const { setIsAnimatingCards } = useUIStore.getState();

			setIsAnimatingCards(true);
			expect(useUIStore.getState().isAnimatingCards).toBe(true);
		});

		it("should set isAnimatingCards to false", () => {
			const { setIsAnimatingCards } = useUIStore.getState();

			setIsAnimatingCards(true);
			setIsAnimatingCards(false);
			expect(useUIStore.getState().isAnimatingCards).toBe(false);
		});

		it("should set allCardsFlipped to true", () => {
			const { setAllCardsFlipped } = useUIStore.getState();

			setAllCardsFlipped(true);
			expect(useUIStore.getState().allCardsFlipped).toBe(true);
		});

		it("should set allCardsFlipped to false", () => {
			const { setAllCardsFlipped } = useUIStore.getState();

			setAllCardsFlipped(true);
			setAllCardsFlipped(false);
			expect(useUIStore.getState().allCardsFlipped).toBe(false);
		});

		it("should handle animation states independently", () => {
			const { setIsAnimatingCards, setAllCardsFlipped } = useUIStore.getState();

			setIsAnimatingCards(true);
			setAllCardsFlipped(true);

			expect(useUIStore.getState().isAnimatingCards).toBe(true);
			expect(useUIStore.getState().allCardsFlipped).toBe(true);

			setIsAnimatingCards(false);
			expect(useUIStore.getState().isAnimatingCards).toBe(false);
			expect(useUIStore.getState().allCardsFlipped).toBe(true); // unchanged
		});
	});

	// ============================================
	// Layout Metrics Tests
	// ============================================

	describe("layout metrics", () => {
		it("should update layout metrics", () => {
			const { updateLayoutMetrics } = useUIStore.getState();
			const metrics = createTestLayoutMetrics({
				boardWidth: 800,
				boardAvailableHeight: 600,
				scoreboardHeight: 80,
			});

			updateLayoutMetrics(metrics);

			const { layoutMetrics } = useUIStore.getState();
			expect(layoutMetrics.boardWidth).toBe(800);
			expect(layoutMetrics.boardAvailableHeight).toBe(600);
			expect(layoutMetrics.scoreboardHeight).toBe(80);
		});

		it("should replace all metrics when updating", () => {
			const { updateLayoutMetrics } = useUIStore.getState();

			updateLayoutMetrics({
				boardWidth: 100,
				boardAvailableHeight: 200,
				scoreboardHeight: 30,
			});

			updateLayoutMetrics({
				boardWidth: 500,
				boardAvailableHeight: 400,
				scoreboardHeight: 50,
			});

			const { layoutMetrics } = useUIStore.getState();
			expect(layoutMetrics.boardWidth).toBe(500);
			expect(layoutMetrics.boardAvailableHeight).toBe(400);
			expect(layoutMetrics.scoreboardHeight).toBe(50);
		});

		it("should handle zero values", () => {
			const { updateLayoutMetrics } = useUIStore.getState();

			updateLayoutMetrics({
				boardWidth: 0,
				boardAvailableHeight: 0,
				scoreboardHeight: 0,
			});

			const { layoutMetrics } = useUIStore.getState();
			expect(layoutMetrics.boardWidth).toBe(0);
			expect(layoutMetrics.boardAvailableHeight).toBe(0);
			expect(layoutMetrics.scoreboardHeight).toBe(0);
		});

		it("should handle large values", () => {
			const { updateLayoutMetrics } = useUIStore.getState();

			updateLayoutMetrics({
				boardWidth: 10000,
				boardAvailableHeight: 8000,
				scoreboardHeight: 500,
			});

			const { layoutMetrics } = useUIStore.getState();
			expect(layoutMetrics.boardWidth).toBe(10000);
			expect(layoutMetrics.boardAvailableHeight).toBe(8000);
			expect(layoutMetrics.scoreboardHeight).toBe(500);
		});
	});

	// ============================================
	// Reset Tests
	// ============================================

	describe("reset", () => {
		it("should reset all state to initial values", () => {
			const {
				setShowStartModal,
				setIsAnimatingCards,
				setAllCardsFlipped,
				updateLayoutMetrics,
				resetUIState,
			} = useUIStore.getState();

			// Change all values
			setShowStartModal(true);
			setIsAnimatingCards(true);
			setAllCardsFlipped(true);
			updateLayoutMetrics({
				boardWidth: 800,
				boardAvailableHeight: 600,
				scoreboardHeight: 80,
			});

			// Verify changed
			expect(useUIStore.getState().showStartModal).toBe(true);
			expect(useUIStore.getState().isAnimatingCards).toBe(true);
			expect(useUIStore.getState().allCardsFlipped).toBe(true);
			expect(useUIStore.getState().layoutMetrics.boardWidth).toBe(800);

			// Reset
			resetUIState();

			// Verify reset
			expect(useUIStore.getState().showStartModal).toBe(false);
			expect(useUIStore.getState().isAnimatingCards).toBe(false);
			expect(useUIStore.getState().allCardsFlipped).toBe(false);
			expect(useUIStore.getState().layoutMetrics.boardWidth).toBe(0);
			expect(useUIStore.getState().layoutMetrics.boardAvailableHeight).toBe(0);
			expect(useUIStore.getState().layoutMetrics.scoreboardHeight).toBe(0);
		});
	});

	// ============================================
	// Selector Tests
	// ============================================

	describe("selectors", () => {
		it("selectShowStartModal should return showStartModal", () => {
			const { setShowStartModal } = useUIStore.getState();

			setShowStartModal(true);
			expect(selectShowStartModal(useUIStore.getState())).toBe(true);

			setShowStartModal(false);
			expect(selectShowStartModal(useUIStore.getState())).toBe(false);
		});

		it("selectIsAnimatingCards should return isAnimatingCards", () => {
			const { setIsAnimatingCards } = useUIStore.getState();

			setIsAnimatingCards(true);
			expect(selectIsAnimatingCards(useUIStore.getState())).toBe(true);

			setIsAnimatingCards(false);
			expect(selectIsAnimatingCards(useUIStore.getState())).toBe(false);
		});

		it("selectAllCardsFlipped should return allCardsFlipped", () => {
			const { setAllCardsFlipped } = useUIStore.getState();

			setAllCardsFlipped(true);
			expect(selectAllCardsFlipped(useUIStore.getState())).toBe(true);

			setAllCardsFlipped(false);
			expect(selectAllCardsFlipped(useUIStore.getState())).toBe(false);
		});

		it("selectLayoutMetrics should return layoutMetrics", () => {
			const { updateLayoutMetrics } = useUIStore.getState();

			const metrics = {
				boardWidth: 1024,
				boardAvailableHeight: 768,
				scoreboardHeight: 100,
			};
			updateLayoutMetrics(metrics);

			const selected = selectLayoutMetrics(useUIStore.getState());
			expect(selected).toEqual(metrics);
		});
	});

	// ============================================
	// Subscription Tests
	// ============================================

	describe("subscriptions", () => {
		it("should notify subscribers when state changes", () => {
			const changes: boolean[] = [];

			const unsubscribe = useUIStore.subscribe(
				(state) => state.showStartModal,
				(showStartModal) => {
					changes.push(showStartModal);
				},
			);

			const { setShowStartModal } = useUIStore.getState();
			setShowStartModal(true);
			setShowStartModal(false);
			setShowStartModal(true);

			unsubscribe();

			expect(changes).toEqual([true, false, true]);
		});

		it("should not notify after unsubscribe", () => {
			const changes: boolean[] = [];

			const unsubscribe = useUIStore.subscribe(
				(state) => state.isAnimatingCards,
				(isAnimating) => {
					changes.push(isAnimating);
				},
			);

			const { setIsAnimatingCards } = useUIStore.getState();
			setIsAnimatingCards(true);
			unsubscribe();
			setIsAnimatingCards(false);

			expect(changes).toEqual([true]);
		});
	});
});
