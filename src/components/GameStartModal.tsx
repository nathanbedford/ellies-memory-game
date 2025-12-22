import { useEffect, useState } from "react";
import type { Player } from "../types";

const ENABLE_SETUP_DEBUG_LOGS = true;

const logWizardInteraction = (...args: unknown[]) => {
	if (!ENABLE_SETUP_DEBUG_LOGS) return;
	console.log("[Setup Wizard Interaction]", ...args);
};

interface GameStartModalProps {
	players: Player[];
	currentPlayer: number;
	onStartGame: (firstPlayer: number) => void;
	onPlayerNameChange?: (playerId: 1 | 2, newName: string) => void;
	onPlayerColorChange?: (playerId: 1 | 2, newColor: string) => void;
	onBack?: () => void;
	isResetting?: boolean;
}

export const GameStartModal = ({
	players,
	currentPlayer,
	onStartGame,
	onPlayerNameChange,
	onPlayerColorChange,
}: GameStartModalProps) => {
	const [selectedPlayer, setSelectedPlayer] = useState<1 | 2>(
		currentPlayer as 1 | 2,
	);
	const [editingPlayer, setEditingPlayer] = useState<1 | 2 | null>(null);
	const player1 = players.find((p) => p.id === 1);
	const player2 = players.find((p) => p.id === 2);
	const [tempNames, setTempNames] = useState({
		1: player1?.name || "Player 1",
		2: player2?.name || "Player 2",
	});
	const [tempColors, setTempColors] = useState({
		1: player1?.color || "#3b82f6",
		2: player2?.color || "#10b981",
	});

	// Sync local state with players prop when it changes (e.g., after Zustand hydration)
	useEffect(() => {
		const p1 = players.find((p) => p.id === 1);
		const p2 = players.find((p) => p.id === 2);
		setTempNames({
			1: p1?.name || "Player 1",
			2: p2?.name || "Player 2",
		});
		setTempColors({
			1: p1?.color || "#3b82f6",
			2: p2?.color || "#10b981",
		});
	}, [players]);

	// Predefined color options
	const colorOptions = [
		"#3b82f6", // Blue
		"#10b981", // Green
		"#f59e0b", // Amber
		"#ef4444", // Red
		"#8b5cf6", // Purple
		"#ec4899", // Pink
		"#06b6d4", // Cyan
		"#f97316", // Orange
		"#84cc16", // Lime
		"#6366f1", // Indigo
	];

	const handleStart = () => {
		logWizardInteraction("Start game clicked", {
			selectedPlayer,
			tempNames,
			tempColors,
		});
		const currentPlayer1 = players.find((p) => p.id === 1);
		const currentPlayer2 = players.find((p) => p.id === 2);

		// Check if any changes need to be applied
		const nameChanged =
			tempNames[1] !== currentPlayer1?.name ||
			tempNames[2] !== currentPlayer2?.name;
		const colorChanged =
			tempColors[1] !== currentPlayer1?.color ||
			tempColors[2] !== currentPlayer2?.color;

		// Apply any name changes before starting
		if (tempNames[1] !== currentPlayer1?.name && onPlayerNameChange) {
			onPlayerNameChange(1, tempNames[1]);
		}
		if (tempNames[2] !== currentPlayer2?.name && onPlayerNameChange) {
			onPlayerNameChange(2, tempNames[2]);
		}
		// Apply any color changes before starting
		if (tempColors[1] !== currentPlayer1?.color && onPlayerColorChange) {
			onPlayerColorChange(1, tempColors[1]);
		}
		if (tempColors[2] !== currentPlayer2?.color && onPlayerColorChange) {
			onPlayerColorChange(2, tempColors[2]);
		}

		// If names or colors changed, defer game start to next tick to allow React to update
		if (nameChanged || colorChanged) {
			setTimeout(() => {
				onStartGame(selectedPlayer);
			}, 0);
		} else {
			onStartGame(selectedPlayer);
		}
	};

	const handleNameClick = (playerId: 1 | 2) => {
		setEditingPlayer(playerId);
	};

	const handleNameChange = (playerId: 1 | 2, newName: string) => {
		setTempNames((prev) => ({
			...prev,
			[playerId]: newName,
		}));
	};

	const handleColorChange = (playerId: 1 | 2, newColor: string) => {
		setTempColors((prev) => ({
			...prev,
			[playerId]: newColor,
		}));
	};

	const handlePlayerSelection = (playerId: 1 | 2) => {
		logWizardInteraction("Player selection toggled", {
			playerId,
			previousSelection: selectedPlayer,
		});
		setSelectedPlayer(playerId);
	};

	const handleNameSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (editingPlayer && tempNames[editingPlayer].trim()) {
			setEditingPlayer(null);
		}
	};

	const handleNameCancel = () => {
		if (editingPlayer) {
			const currentPlayer =
				editingPlayer === 1
					? players.find((p) => p.id === 1)?.name || "Player 1"
					: players.find((p) => p.id === 2)?.name || "Player 2";
			setTempNames((prev) => ({
				...prev,
				[editingPlayer]: currentPlayer,
			}));
			setEditingPlayer(null);
		}
	};

	return (
		<div className="text-center space-y-8">
			<div>
				<h3 className="text-2xl font-bold text-gray-800 mb-4">
					Who Goes First?
				</h3>
				<p className="text-gray-600">
					Choose which player will start the game!
				</p>
			</div>

			<div className="grid grid-cols-2 gap-6">
				{editingPlayer === 1 ? (
					<div
						className={`p-8 rounded-xl border-3 transition-all duration-300 ${
							selectedPlayer === 1
								? "shadow-xl ring-4 ring-opacity-30"
								: "border-gray-200 bg-white"
						}`}
						style={
							selectedPlayer === 1
								? ({
										borderColor: tempColors[1],
										backgroundColor: `${tempColors[1]}20`,
										"--tw-ring-color": tempColors[1],
									} as React.CSSProperties & { "--tw-ring-color": string })
								: {}
						}
					>
						<div className="space-y-4">
							<div className="text-6xl">👤</div>

							{/* Player 1 Name Input */}
							<form onSubmit={handleNameSubmit} className="space-y-2">
								<div className="flex items-center justify-center gap-2">
									<div
										className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"
										style={{ backgroundColor: tempColors[1] }}
										title={`Selected color: ${tempColors[1]}`}
									/>
									<input
										type="text"
										value={tempNames[1]}
										onChange={(e) => handleNameChange(1, e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Escape") {
												handleNameCancel();
											} else if (e.key === "Enter") {
												e.preventDefault();
												handleNameSubmit(e);
											}
										}}
										className="flex-1 px-3 py-2 text-xl font-bold text-center border-2 rounded-lg focus:outline-none focus:ring-2"
										style={{
											color: tempColors[1],
											borderColor: tempColors[1],
										}}
										maxLength={20}
									/>
								</div>
								{/* Color Picker */}
								<div className="flex flex-wrap gap-2 justify-center mt-2">
									{colorOptions.map((color) => (
										<button
											key={color}
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												e.preventDefault();
												handleColorChange(1, color);
											}}
											className={`w-8 h-8 rounded-full border-2 transition-all ${
												tempColors[1] === color
													? "border-gray-800 scale-110"
													: "border-gray-300 hover:scale-110"
											}`}
											style={{ backgroundColor: color }}
											title={color}
										/>
									))}
									<input
										type="color"
										value={tempColors[1]}
										onChange={(e) => {
											e.stopPropagation();
											handleColorChange(1, e.target.value);
										}}
										onClick={(e) => e.stopPropagation()}
										className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
										title="Custom color"
									/>
								</div>
								<div className="flex gap-2 justify-center mt-3">
									<button
										type="button"
										onClick={handleNameCancel}
										className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors duration-200"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="px-4 py-2 text-white font-semibold rounded-lg transition-all duration-200 hover:opacity-90"
										style={{
											background: tempColors[1],
										}}
									>
										Save
									</button>
								</div>
							</form>
						</div>
					</div>
				) : (
					<button
						type="button"
						onClick={() => handlePlayerSelection(1)}
						className={`p-8 rounded-xl border-3 transition-all duration-300 transform hover:scale-105 ${
							selectedPlayer === 1
								? "shadow-xl ring-4 ring-opacity-30"
								: "border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg"
						} ${editingPlayer === 2 ? "opacity-50 cursor-not-allowed" : ""}`}
						style={
							selectedPlayer === 1
								? ({
										borderColor: tempColors[1],
										backgroundColor: `${tempColors[1]}20`,
										"--tw-ring-color": tempColors[1],
									} as React.CSSProperties & { "--tw-ring-color": string })
								: {}
						}
					>
						<div className="space-y-4">
							<div className="text-6xl">👤</div>

							{/* Player 1 Name Display */}
							<div className="flex items-center justify-center gap-2">
								<div
									className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"
									style={{ backgroundColor: tempColors[1] }}
									title={`Selected color: ${tempColors[1]}`}
								/>
								<button
									type="button"
									onClick={() => handleNameClick(1)}
									className="text-xl font-bold cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-0 p-0"
									style={{ color: tempColors[1] }}
									title="Click to edit name"
									aria-label="Edit player 1 name"
								>
									{tempNames[1]}
									<svg
										className="w-4 h-4 inline-block ml-1 opacity-60"
										fill="currentColor"
										viewBox="0 0 20 20"
										aria-hidden="true"
									>
										<title>Edit</title>
										<path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
									</svg>
								</button>
							</div>

							{selectedPlayer === 1 && (
								<div
									className="text-sm font-semibold flex items-center justify-center gap-2"
									style={{ color: tempColors[1] }}
								>
									<svg
										className="w-5 h-5"
										fill="currentColor"
										viewBox="0 0 20 20"
										aria-hidden="true"
									>
										<title>Checkmark</title>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clipRule="evenodd"
										/>
									</svg>
									Goes First
								</div>
							)}
						</div>
					</button>
				)}

				{editingPlayer === 2 ? (
					<div
						className={`p-8 rounded-xl border-3 transition-all duration-300 ${
							selectedPlayer === 2
								? "shadow-xl ring-4 ring-opacity-30"
								: "border-gray-200 bg-white"
						}`}
						style={
							selectedPlayer === 2
								? ({
										borderColor: tempColors[2],
										backgroundColor: `${tempColors[2]}20`,
										"--tw-ring-color": tempColors[2],
									} as React.CSSProperties & { "--tw-ring-color": string })
								: {}
						}
					>
						<div className="space-y-4">
							<div className="text-6xl">👤</div>

							{/* Player 2 Name Input */}
							<form onSubmit={handleNameSubmit} className="space-y-2">
								<div className="flex items-center justify-center gap-2">
									<div
										className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"
										style={{ backgroundColor: tempColors[2] }}
										title={`Selected color: ${tempColors[2]}`}
									/>
									<input
										type="text"
										value={tempNames[2]}
										onChange={(e) => handleNameChange(2, e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Escape") {
												handleNameCancel();
											} else if (e.key === "Enter") {
												e.preventDefault();
												handleNameSubmit(e);
											}
										}}
										className="flex-1 px-3 py-2 text-xl font-bold text-center border-2 rounded-lg focus:outline-none focus:ring-2"
										style={{
											color: tempColors[2],
											borderColor: tempColors[2],
										}}
										maxLength={20}
									/>
								</div>
								{/* Color Picker */}
								<div className="flex flex-wrap gap-2 justify-center mt-2">
									{colorOptions.map((color) => (
										<button
											key={color}
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												e.preventDefault();
												handleColorChange(2, color);
											}}
											className={`w-8 h-8 rounded-full border-2 transition-all ${
												tempColors[2] === color
													? "border-gray-800 scale-110"
													: "border-gray-300 hover:scale-110"
											}`}
											style={{ backgroundColor: color }}
											title={color}
										/>
									))}
									<input
										type="color"
										value={tempColors[2]}
										onChange={(e) => {
											e.stopPropagation();
											handleColorChange(2, e.target.value);
										}}
										onClick={(e) => e.stopPropagation()}
										className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
										title="Custom color"
									/>
								</div>
								<div className="flex gap-2 justify-center mt-3">
									<button
										type="button"
										onClick={handleNameCancel}
										className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors duration-200"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="px-4 py-2 text-white font-semibold rounded-lg transition-all duration-200 hover:opacity-90"
										style={{
											background: tempColors[2],
										}}
									>
										Save
									</button>
								</div>
							</form>
						</div>
					</div>
				) : (
					<button
						type="button"
						onClick={() => handlePlayerSelection(2)}
						className={`p-8 rounded-xl border-3 transition-all duration-300 transform hover:scale-105 ${
							selectedPlayer === 2
								? "shadow-xl ring-4 ring-opacity-30"
								: "border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg"
						} ${editingPlayer === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
						style={
							selectedPlayer === 2
								? ({
										borderColor: tempColors[2],
										backgroundColor: `${tempColors[2]}20`,
										"--tw-ring-color": tempColors[2],
									} as React.CSSProperties & { "--tw-ring-color": string })
								: {}
						}
					>
						<div className="space-y-4">
							<div className="text-6xl">👤</div>

							{/* Player 2 Name Display */}
							<div className="flex items-center justify-center gap-2">
								<div
									className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"
									style={{ backgroundColor: tempColors[2] }}
									title={`Selected color: ${tempColors[2]}`}
								/>
								<button
									type="button"
									onClick={() => handleNameClick(2)}
									className="text-xl font-bold cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-0 p-0"
									style={{ color: tempColors[2] }}
									title="Click to edit name"
									aria-label="Edit player 2 name"
								>
									{tempNames[2]}
									<svg
										className="w-4 h-4 inline-block ml-1 opacity-60"
										fill="currentColor"
										viewBox="0 0 20 20"
										aria-hidden="true"
									>
										<title>Edit</title>
										<path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
									</svg>
								</button>
							</div>

							{selectedPlayer === 2 && (
								<div
									className="text-sm font-semibold flex items-center justify-center gap-2"
									style={{ color: tempColors[2] }}
								>
									<svg
										className="w-5 h-5"
										fill="currentColor"
										viewBox="0 0 20 20"
										aria-hidden="true"
									>
										<title>Checkmark</title>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clipRule="evenodd"
										/>
									</svg>
									Goes First
								</div>
							)}
						</div>
					</button>
				)}
			</div>

			<button
				type="button"
				onClick={handleStart}
				className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 text-lg shadow-lg transform hover:scale-[1.02]"
			>
				🎮 Start Game
			</button>
		</div>
	);
};
