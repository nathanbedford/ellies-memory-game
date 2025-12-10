/**
 * RemoteCursor - Visual indicator for opponent's cursor position
 *
 * Displays a cursor icon with the opponent's player color and name label.
 * Position is calculated from grid-relative coordinates (0-8 for x, 0-5 for y).
 */

import type { CursorPosition } from '../../types';

interface RemoteCursorProps {
  /** Opponent's cursor position (grid-relative: 0-8 for x, 0-5 for y) */
  position: CursorPosition;
  /** Size of each card in pixels */
  cardSize: number;
  /** Gap between cards in pixels (default: 8px) */
  gap?: number;
  /** Opponent's display name */
  playerName: string;
  /** Opponent's player color */
  playerColor: string;
}

export function RemoteCursor({
  position,
  cardSize,
  gap = 8,
  playerName,
  playerColor,
}: RemoteCursorProps) {
  // Only render if position is within valid grid bounds
  if (position.x < 0 || position.x > 8 || position.y < 0 || position.y > 5) {
    return null;
  }

  // Convert grid position to pixels
  // Each grid cell is cardSize + gap wide/tall
  const left = position.x * (cardSize + gap);
  const top = position.y * (cardSize + gap);

  return (
    <div
      className="absolute pointer-events-none z-40"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        // Smooth movement transition
        transition: 'left 50ms linear, top 50ms linear',
        // Offset cursor so the tip is at the exact position
        transform: 'translate(-2px, -2px)',
      }}
    >
      {/* Cursor icon - pointer style */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`${playerName}'s cursor`}
        role="img"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
        }}
      >
        {/* Cursor shape with player color fill and white outline */}
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
          fill={playerColor}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* Player name label */}
      <div
        className="absolute left-5 top-4 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
        style={{
          backgroundColor: playerColor,
          color: getContrastColor(playerColor),
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        }}
      >
        {playerName}
      </div>
    </div>
  );
}

/**
 * Get a contrasting text color (black or white) based on background color
 */
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
