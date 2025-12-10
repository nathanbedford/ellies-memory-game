/**
 * RemoteCursor - Visual indicator for opponent's cursor position
 *
 * Displays a cursor icon with the opponent's player color and name label.
 * Position is calculated from normalized coordinates (0-1) relative to the board.
 */

import type { CursorPosition } from '../../types';

interface RemoteCursorProps {
  /** Opponent's cursor position (normalized 0-1) */
  position: CursorPosition;
  /** Board dimensions for converting normalized to pixel position */
  boardWidth: number;
  boardHeight: number;
  /** Opponent's display name */
  playerName: string;
  /** Opponent's player color */
  playerColor: string;
}

export function RemoteCursor({
  position,
  boardWidth,
  boardHeight,
  playerName,
  playerColor,
}: RemoteCursorProps) {
  // Convert normalized position to pixels
  const left = position.x * boardWidth;
  const top = position.y * boardHeight;

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
