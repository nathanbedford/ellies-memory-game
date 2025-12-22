import { useState } from "react";

interface PlayerSetupProps {
	onStartGame: (
		player1Name: string,
		player2Name: string,
		firstPlayer: number,
	) => void;
}

export const PlayerSetup = ({ onStartGame }: PlayerSetupProps) => {
	const [player1Name, setPlayer1Name] = useState("Player 1");
	const [player2Name, setPlayer2Name] = useState("Player 2");
	const [firstPlayer, setFirstPlayer] = useState<1 | 2>(1);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (player1Name.trim() && player2Name.trim()) {
			// Save to localStorage
			localStorage.setItem("player1Name", player1Name.trim());
			localStorage.setItem("player2Name", player2Name.trim());
			localStorage.setItem("firstPlayer", firstPlayer.toString());

			onStartGame(player1Name.trim(), player2Name.trim(), firstPlayer);
		}
	};

	return (
		<div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
			<h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
				Game Setup
			</h2>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div>
					<label
						htmlFor="player1"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						Player 1 Name
					</label>
					{/** biome-ignore lint/correctness/useUniqueElementIds: Opus says this is fine */}
					<input
						id="player1"
						type="text"
						value={player1Name}
						onChange={(e) => setPlayer1Name(e.target.value)}
						className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="Enter Player 1 name"
						maxLength={20}
						required
					/>
				</div>

				<div>
					<label
						htmlFor="player2"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						Player 2 Name
					</label>
					{/** biome-ignore lint/correctness/useUniqueElementIds: Opus says this is fine */}
					<input
						id="player2"
						type="text"
						value={player2Name}
						onChange={(e) => setPlayer2Name(e.target.value)}
						className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
						placeholder="Enter Player 2 name"
						maxLength={20}
						required
					/>
				</div>

				<div>
					<div className="block text-sm font-medium text-gray-700 mb-2">
						Who goes first?
					</div>
					<div
						className="flex gap-4"
						role="radiogroup"
						aria-label="Who goes first?"
					>
						<label className="flex-1">
							<input
								type="radio"
								name="firstPlayer"
								value="1"
								checked={firstPlayer === 1}
								onChange={() => setFirstPlayer(1)}
								className="sr-only"
							/>
							<div
								className={`px-4 py-3 text-center border-2 rounded-lg cursor-pointer transition-colors ${firstPlayer === 1
									? "border-blue-500 bg-blue-50 text-blue-700"
									: "border-gray-300 hover:border-gray-400"
									}`}
							>
								{player1Name || "Player 1"}
							</div>
						</label>

						<label className="flex-1">
							<input
								type="radio"
								name="firstPlayer"
								value="2"
								checked={firstPlayer === 2}
								onChange={() => setFirstPlayer(2)}
								className="sr-only"
							/>
							<div
								className={`px-4 py-3 text-center border-2 rounded-lg cursor-pointer transition-colors ${firstPlayer === 2
									? "border-green-500 bg-green-50 text-green-700"
									: "border-gray-300 hover:border-gray-400"
									}`}
							>
								{player2Name || "Player 2"}
							</div>
						</label>
					</div>
				</div>

				<button
					type="submit"
					className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 text-lg shadow-md"
				>
					Start Game
				</button>
			</form>
		</div>
	);
};
