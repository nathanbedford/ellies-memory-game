/**
 * JoinRoomForm - Form to join an existing room with a code
 */

import { useState } from "react";

interface JoinRoomFormProps {
	onJoin: (roomCode: string) => void;
	onBack: () => void;
	isLoading?: boolean;
	error?: string | null;
}

export const JoinRoomForm = ({
	onJoin,
	onBack,
	isLoading = false,
	error,
}: JoinRoomFormProps) => {
	const [roomCode, setRoomCode] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (roomCode.trim().length === 4) {
			onJoin(roomCode.trim().toUpperCase());
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// Only allow letters and limit to 4 characters
		const value = e.target.value
			.toUpperCase()
			.replace(/[^A-Z]/g, "")
			.slice(0, 4);
		setRoomCode(value);
	};

	return (
		<div className="text-center space-y-6">
			<div>
				<h2 className="text-2xl font-bold text-gray-800 mb-2">Join a Game</h2>
				<p className="text-gray-600">
					Enter the 4-letter room code from your friend
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div>
					<input
						type="text"
						value={roomCode}
						onChange={handleChange}
						placeholder="ABCD"
						className="w-full max-w-xs mx-auto block text-center text-4xl font-mono font-bold tracking-widest px-6 py-4 border-3 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
						maxLength={4}
						disabled={isLoading}
						autoFocus
					/>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
						{error}
					</div>
				)}

				<div className="flex gap-4 justify-center">
					<button
						type="button"
						onClick={onBack}
						disabled={isLoading}
						className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
					>
						Back
					</button>
					<button
						type="submit"
						disabled={roomCode.length !== 4 || isLoading}
						className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{isLoading ? (
							<>
								<svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
									<title>Loading</title>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
										fill="none"
									/>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
								Joining...
							</>
						) : (
							"Join Game"
						)}
					</button>
				</div>
			</form>
		</div>
	);
};
