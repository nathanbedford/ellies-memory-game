import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
	component: TermsPage,
});

export function TermsPage() {
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
					Terms of Service
				</h1>

				<div className="prose prose-gray max-w-none space-y-6">
					<p className="text-sm text-gray-500">Last updated: December 2025</p>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							1. Acceptance of Terms
						</h2>
						<p className="text-gray-600">
							By accessing and using Matchimus ("the Game"), you agree to be
							bound by these Terms of Service. If you do not agree to these
							terms, please do not use the Game.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							2. Description of Service
						</h2>
						<p className="text-gray-600">
							Matchimus is a memory card matching game that can be played
							locally on a single device or online with another player. The Game
							is provided free of charge for personal, non-commercial use.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							3. User-Provided Content
						</h2>
						<p className="text-gray-600">
							The Game allows you to enter player names of your choosing. You
							agree that any names you enter:
						</p>
						<ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
							<li>Will not be offensive, inappropriate, or harmful</li>
							<li>Will not impersonate others or misrepresent your identity</li>
							<li>Will not violate any applicable laws or regulations</li>
						</ul>
						<p className="text-gray-600 mt-2">
							Player names entered during online play may be visible to other
							players in your game session.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							4. Intellectual Property
						</h2>
						<p className="text-gray-600">
							All content within the Game, including but not limited to
							graphics, designs, and code, is owned by Avodah Transformations
							LLC and is protected by intellectual property laws. You may not
							copy, modify, distribute, or create derivative works from the Game
							without explicit written permission.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							5. User Conduct
						</h2>
						<p className="text-gray-600">You agree not to:</p>
						<ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
							<li>
								Attempt to hack, disrupt, or interfere with the Game's operation
							</li>
							<li>Use automated systems or bots to interact with the Game</li>
							<li>Exploit bugs or glitches for unfair advantage</li>
							<li>Harass or abuse other players during online sessions</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							6. Disclaimer of Warranties
						</h2>
						<p className="text-gray-600">
							The Game is provided "as is" without warranties of any kind,
							either express or implied. We do not guarantee that the Game will
							be uninterrupted, error-free, or free of viruses or other harmful
							components.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							7. Limitation of Liability
						</h2>
						<p className="text-gray-600">
							To the fullest extent permitted by law, Avodah Transformations LLC
							shall not be liable for any indirect, incidental, special,
							consequential, or punitive damages arising from your use of the
							Game.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							8. Changes to Terms
						</h2>
						<p className="text-gray-600">
							We reserve the right to modify these terms at any time. Continued
							use of the Game after changes constitutes acceptance of the
							updated terms.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
							9. Contact
						</h2>
						<p className="text-gray-600">
							For questions about these Terms of Service, please contact us at{" "}
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
