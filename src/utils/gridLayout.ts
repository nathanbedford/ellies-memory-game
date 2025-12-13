/**
 * Grid Layout Utility
 * 
 * Calculates optimal grid dimensions for different pair counts.
 * The goal is to produce layouts that are as square as possible for optimal screen usage.
 */

export interface GridDimensions {
  columns: number;
  rows: number;
}

/**
 * Predefined optimal grid layouts for common pair counts.
 * These are hand-tuned for the best visual appearance.
 */
const OPTIMAL_LAYOUTS: Record<number, GridDimensions> = {
  4:  { columns: 4, rows: 2 },   // 8 cards
  5:  { columns: 5, rows: 2 },   // 10 cards
  6:  { columns: 4, rows: 3 },   // 12 cards
  7:  { columns: 7, rows: 2 },   // 14 cards
  8:  { columns: 4, rows: 4 },   // 16 cards
  9:  { columns: 6, rows: 3 },   // 18 cards
  10: { columns: 5, rows: 4 },   // 20 cards
  11: { columns: 6, rows: 4 },   // 22 cards (with 2 empty spots conceptually, but we fill)
  12: { columns: 6, rows: 4 },   // 24 cards
  13: { columns: 6, rows: 5 },   // 26 cards (with 4 empty spots conceptually)
  14: { columns: 7, rows: 4 },   // 28 cards
  15: { columns: 6, rows: 5 },   // 30 cards
  16: { columns: 8, rows: 4 },   // 32 cards
  17: { columns: 7, rows: 5 },   // 34 cards (with 1 empty spot)
  18: { columns: 8, rows: 5 },   // 36 cards (with 4 empty spots)
  19: { columns: 8, rows: 5 },   // 38 cards (with 2 empty spots conceptually)
  20: { columns: 8, rows: 5 },   // 40 cards
};

/**
 * Calculate optimal grid dimensions for a given pair count.
 * 
 * @param pairCount - Number of pairs (4-20)
 * @returns GridDimensions with columns and rows
 */
export function calculateGridDimensions(pairCount: number): GridDimensions {
  // Clamp to valid range
  const clampedPairCount = Math.max(4, Math.min(20, pairCount));
  
  // Use predefined optimal layout if available
  if (OPTIMAL_LAYOUTS[clampedPairCount]) {
    return OPTIMAL_LAYOUTS[clampedPairCount];
  }
  
  // Fallback: calculate dynamically for any pair count
  const cardCount = clampedPairCount * 2;
  
  // Find the most square-like layout
  let bestColumns = cardCount;
  let bestRows = 1;
  let bestAspectDiff = Infinity;
  
  for (let cols = 2; cols <= Math.ceil(Math.sqrt(cardCount)) + 2; cols++) {
    const rows = Math.ceil(cardCount / cols);
    // Skip if this would leave too many empty cells
    if (cols * rows - cardCount > cols) continue;
    
    // Prefer wider layouts (more columns than rows) for typical screens
    const aspectRatio = cols / rows;
    const targetAspect = 1.5; // Slightly wider than square
    const aspectDiff = Math.abs(aspectRatio - targetAspect);
    
    if (aspectDiff < bestAspectDiff) {
      bestAspectDiff = aspectDiff;
      bestColumns = cols;
      bestRows = rows;
    }
  }
  
  return { columns: bestColumns, rows: bestRows };
}

/**
 * Get CSS grid-template-columns value for a given column count.
 * 
 * @param columns - Number of columns
 * @returns CSS value for grid-template-columns
 */
export function getGridTemplateColumns(columns: number): string {
  return `repeat(${columns}, 1fr)`;
}

/**
 * Calculate the total number of cards for a given pair count.
 * 
 * @param pairCount - Number of pairs
 * @returns Total card count (pairs * 2)
 */
export function getTotalCardCount(pairCount: number): number {
  return pairCount * 2;
}

/**
 * Get a human-readable description of the grid layout.
 * 
 * @param pairCount - Number of pairs
 * @returns String like "8x5 grid (40 cards)"
 */
export function getGridDescription(pairCount: number): string {
  const { columns, rows } = calculateGridDimensions(pairCount);
  const cardCount = getTotalCardCount(pairCount);
  return `${columns}x${rows} grid (${cardCount} cards)`;
}

/**
 * Valid pair count options for the selector UI.
 * These are the recommended pair counts that produce nice layouts.
 */
export const PAIR_COUNT_OPTIONS = [4, 6, 8, 10, 12, 15, 16, 20] as const;

/**
 * Minimum and maximum pair counts.
 */
export const MIN_PAIR_COUNT = 4;
export const MAX_PAIR_COUNT = 20;

/**
 * Default pair count.
 */
export const DEFAULT_PAIR_COUNT = 20;

