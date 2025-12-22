/**
 * GameplayHeader - Displays player scores and turn indicator during gameplay
 */

import { getPlayerScore } from "../../services/game/GameEngine";
import type { Card, GameMode, Player } from "../../types";
import { hexToRgb } from "../../utils/colorUtils";

interface GameplayHeaderProps {
	players: Player[];
	currentPlayer: number;
	cards: Card[];
	glowingPlayer: number | null;
	gameMode: GameMode | null;
	localPlayerSlot: number | null;
	roomCode: string | null;
	isOnlineMode: boolean;
	onOpenPlayerMatches: (playerId: number) => void;
}

export const GameplayHeader = ({
	players,
	currentPlayer,
	cards,
	glowingPlayer,
	gameMode,
	localPlayerSlot,
	roomCode,
	isOnlineMode,
	onOpenPlayerMatches,
}: GameplayHeaderProps) => {
	const getPlayerStyle = (playerId: 1 | 2) => {
		const player = players.find((p) => p.id === playerId);
		const playerColor =
			player?.color || (playerId === 1 ? "#3b82f6" : "#10b981");
		const rgb = hexToRgb(playerColor);
		const baseStyle: React.CSSProperties & {
			"--tw-ring-color"?: string;
			"--glow-color-start"?: string;
			"--glow-color-mid"?: string;
			"--glow-color-outer"?: string;
			"--glow-color-end"?: string;
		} = {};

		if (currentPlayer === playerId) {
			baseStyle.backgroundColor = `${playerColor}20`;
			baseStyle["--tw-ring-color"] = playerColor;
		}

		// Set glow color RGB strings for CSS variables with different opacities
		baseStyle["--glow-color-start"] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
		baseStyle["--glow-color-mid"] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)`;
		baseStyle["--glow-color-outer"] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
		baseStyle["--glow-color-end"] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`;

		return { playerColor, baseStyle };
	};

	const renderPlayerSection = (playerId: 1 | 2) => {
		const player = players.find((p) => p.id === playerId);
		const { playerColor, baseStyle } = getPlayerStyle(playerId);
		const isCurrentPlayer = currentPlayer === playerId;
		const isGlowing = glowingPlayer === playerId;

		return (
			<div
				className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
					isCurrentPlayer ? "bg-opacity-90 ring-2" : "bg-gray-50 bg-opacity-50"
				} ${isGlowing ? "player-turn-glow" : ""}`}
				style={baseStyle}
			>
				<div className="flex items-baseline gap-2">
					<button
						type="button"
						onClick={() => onOpenPlayerMatches(playerId)}
						className="text-3xl text-gray-600 font-medium cursor-pointer hover:opacity-75 transition-opacity"
						title="Click to view matches"
					>
						{player?.name || `Player ${playerId}`}:
					</button>
					<button
						type="button"
						onClick={() => onOpenPlayerMatches(playerId)}
						className={`text-3xl font-bold cursor-pointer hover:opacity-75 transition-opacity leading-none ${
							isCurrentPlayer ? "" : "text-gray-400"
						}`}
						style={isCurrentPlayer ? { color: playerColor } : {}}
						title="Click to view matches"
					>
						{getPlayerScore(cards, playerId)}
					</button>
				</div>
				{isCurrentPlayer && (
					<div
						className="font-semibold flex flex-col items-center justify-center gap-1"
						style={{ color: playerColor }}
					>
						<svg
							className="animate-pulse"
							fill="currentColor"
							viewBox="0 0 20 20"
							style={{ width: "30px", height: "30px" }}
							aria-hidden="true"
						>
							<title>Clock</title>
							<path
								fillRule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
								clipRule="evenodd"
							/>
						</svg>
						<span className="text-xs">
							{gameMode === "online"
								? localPlayerSlot === playerId
									? "Your Turn!"
									: "Waiting..."
								: "Turn"}
						</span>
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="w-full max-w-2xl mx-auto">
			<div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-lg shadow-lg p-3 overflow-visible">
				<div className="flex items-center justify-between overflow-visible">
					{/* Player 1 */}
					{renderPlayerSection(1)}

					{/* VS Divider with Room Code (online mode) */}
					<div className="flex flex-col items-center px-3">
						{isOnlineMode && roomCode && (
							<button
								type="button"
								onClick={() => {
									navigator.clipboard.writeText(roomCode);
								}}
								className="text-xs text-blue-500 hover:text-blue-600 font-mono mb-1 cursor-pointer transition-colors"
								title="Click to copy room code"
							>
								{roomCode}
							</button>
						)}
						<div className="text-gray-400 font-semibold text-sm">VS</div>
					</div>

					{/* Player 2 */}
					{renderPlayerSection(2)}
				</div>
			</div>
		</div>
	);
};
