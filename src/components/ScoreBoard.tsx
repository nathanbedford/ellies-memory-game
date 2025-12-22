import { getPlayerScore } from "../services/game/GameEngine";
import type { Card, Player } from "../types";

interface ScoreBoardProps {
	players: Player[];
	cards: Card[];
	currentPlayer: number;
}

export const ScoreBoard = ({
	players,
	cards,
	currentPlayer,
}: ScoreBoardProps) => {
	return (
		<div className="bg-white rounded-lg shadow-md p-6 mb-6">
			<h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
				Score Board
			</h2>
			<div className="flex justify-around">
				{players.map((player) => (
					<div
						key={player.id}
						className={`
              text-center p-4 rounded-lg transition-all duration-300
              ${
								currentPlayer === player.id
									? "bg-blue-100 border-2 border-blue-500 scale-105"
									: "bg-gray-50 border-2 border-transparent"
							}
            `}
					>
						<h3 className="font-semibold text-lg text-gray-800">
							{player.name}
						</h3>
						<p className="text-3xl font-bold text-gray-900 mt-2">
							{getPlayerScore(cards, player.id)}
						</p>
						{currentPlayer === player.id && (
							<p className="text-sm text-blue-600 mt-2 font-medium">
								Current Turn
							</p>
						)}
					</div>
				))}
			</div>
		</div>
	);
};
