import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
	component: PrivacyPage,
});

export function PrivacyPage() {
	return (
		<div className="min-h-screen bg-white">
			<div className="max-w-3xl mx-auto px-6 py-12">
				<Link
					to="/"
					className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to game
				</Link>

				<h1 className="text-3xl font-bold text-gray-900 mb-8">
					Privacy Policy
				</h1>

				<div className="prose prose-gray max-w-none space-y-6">
					<p className="text-sm text-gray-500">Last updated: December 2025</p>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							Overview
						</h2>
						<p className="text-gray-600">
							Matchimus is committed to protecting your privacy. This policy
							explains what information we collect, how we use it, and your
							choices regarding your data.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							Information We Collect
						</h2>

						<h3 className="text-lg font-medium text-gray-700 mt-6 mb-3">
							Player Names
						</h3>
						<p className="text-gray-600">
							You may enter player names of your choosing when playing the game.
							These names are:
						</p>
						<ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
							<li>Stored locally on your device for convenience</li>
							<li>
								Shared with other players during online multiplayer sessions
							</li>
							<li>Not used for any other purpose</li>
						</ul>

						<h3 className="text-lg font-medium text-gray-700 mt-6 mb-3">
							Game Preferences
						</h3>
						<p className="text-gray-600">
							Your game settings (card packs, backgrounds, display preferences)
							are stored locally on your device using your browser's
							localStorage. This data never leaves your device and is only used
							to remember your preferences between sessions.
						</p>

						<h3 className="text-lg font-medium text-gray-700 mt-6 mb-3">
							Online Multiplayer
						</h3>
						<p className="text-gray-600">
							When you play online, we use Firebase services to enable
							multiplayer functionality:
						</p>
						<ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
							<li>
								<strong>Anonymous Authentication:</strong> A randomly generated
								anonymous ID is created for your session. No personal
								information is required.
							</li>
							<li>
								<strong>Game Data:</strong> Room codes, player presence, and
								game state are temporarily stored to synchronize gameplay
								between players.
							</li>
							<li>
								<strong>Player Names:</strong> The names you enter are shared
								with other players in your game session.
							</li>
						</ul>
						<p className="text-gray-600 mt-2">
							Online game data is temporary and is automatically cleaned up
							after sessions end.
						</p>

						<h3 className="text-lg font-medium text-gray-700 mt-6 mb-3">
							Analytics
						</h3>
						<p className="text-gray-600">
							We use PostHog to collect anonymous analytics data to help us
							improve the game and debug issues. This includes:
						</p>
						<ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
							<li>Page views and general usage patterns</li>
							<li>Error reports and crash data</li>
							<li>Device type and browser information</li>
						</ul>
						<p className="text-gray-600 mt-2">
							Analytics data is anonymized and does not include your player
							names or personal information. Analytics are only collected in
							production and not during development.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							What We Don't Collect
						</h2>
						<ul className="list-disc list-inside text-gray-600 space-y-1">
							<li>Email addresses or contact information</li>
							<li>Payment information (the game is free)</li>
							<li>Location data</li>
							<li>Social media profiles</li>
							<li>Personal identifiers beyond anonymous session IDs</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							Data Storage
						</h2>
						<ul className="list-disc list-inside text-gray-600 space-y-1">
							<li>
								<strong>Local Storage:</strong> Your device stores game
								preferences. You can clear this by clearing your browser data.
							</li>
							<li>
								<strong>Firebase:</strong> Online game data is stored in Google
								Cloud infrastructure (US region). Temporary session data is
								automatically cleaned up.
							</li>
							<li>
								<strong>PostHog:</strong> Analytics data is stored in PostHog's
								US cloud infrastructure.
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							Your Choices
						</h2>
						<ul className="list-disc list-inside text-gray-600 space-y-1">
							<li>
								<strong>Clear Local Data:</strong> You can clear your browser's
								localStorage to remove all saved preferences.
							</li>
							<li>
								<strong>Player Names:</strong> You can change your player name
								at any time in the game settings.
							</li>
							<li>
								<strong>Online Play:</strong> Playing locally doesn't require
								any cloud services; only online multiplayer uses Firebase.
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							Children's Privacy
						</h2>
						<p className="text-gray-600">
							Matchimus is designed to be family-friendly. We do not knowingly
							collect personal information from children. The game requires no
							account creation and only stores user-entered player names.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							Changes to This Policy
						</h2>
						<p className="text-gray-600">
							We may update this Privacy Policy from time to time. Any changes
							will be reflected on this page with an updated "Last updated"
							date.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							Contact
						</h2>
						<p className="text-gray-600">
							For questions or concerns about this Privacy Policy, please
							contact us at{" "}
							<a
								href="mailto:contact@avodah.dev"
								className="text-blue-600 hover:underline"
							>
								contact@avodah.dev
							</a>
						</p>
					</section>
				</div>

				<div className="mt-12 pt-8 border-t border-gray-200">
					<Link
						to="/"
						className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to game
					</Link>
				</div>
			</div>
		</div>
	);
}
