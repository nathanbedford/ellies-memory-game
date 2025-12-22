import { useState } from "react";
import { GAME_THEMES, getThemesByCategory } from "../data/gameThemes";
import type { GameTheme } from "../types";

const ENABLE_SETUP_DEBUG_LOGS = true;

const logWizardInteraction = (...args: unknown[]) => {
	if (!ENABLE_SETUP_DEBUG_LOGS) return;
	console.log("[Setup Wizard Interaction]", ...args);
};

interface ThemeSelectorModalProps {
	onSelectTheme: (theme: GameTheme) => void;
	onBuildCustom: () => void;
	onClose: () => void;
}

export const ThemeSelectorModal = ({
	onSelectTheme,
	onBuildCustom,
}: ThemeSelectorModalProps) => {
	const [selectedCategory, setSelectedCategory] = useState<
		"all" | GameTheme["category"]
	>("all");

	const handleThemeSelect = (theme: GameTheme) => {
		logWizardInteraction("Theme selected", {
			themeId: theme.id,
			themeName: theme.name,
		});
		onSelectTheme(theme);
	};

	const handleBuildCustom = () => {
		logWizardInteraction("Build custom selected");
		onBuildCustom();
	};

	// Filter themes by category
	const displayedThemes =
		selectedCategory === "all"
			? GAME_THEMES
			: getThemesByCategory(selectedCategory);

	const categories: Array<{
		id: "all" | GameTheme["category"];
		label: string;
		emoji: string;
	}> = [
		{ id: "all", label: "All Themes", emoji: "🌟" },
		{ id: "holiday", label: "Holiday", emoji: "🎉" },
		{ id: "nature", label: "Nature", emoji: "🌿" },
		{ id: "kids", label: "Kids", emoji: "🧸" },
		{ id: "educational", label: "Educational", emoji: "📚" },
	];

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-xl font-bold text-gray-800 mb-2">
					Choose Your Theme
				</h3>
				<p className="text-gray-600 text-sm">
					Pick a pre-built theme or build your own custom setup
				</p>
			</div>

			{/* Category Filter */}
			<div className="flex gap-2 flex-wrap">
				{categories.map((category) => (
					<button
						type="button"
						key={category.id}
						onClick={() => setSelectedCategory(category.id)}
						className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
							selectedCategory === category.id
								? "bg-blue-500 text-white shadow-md"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						}`}
					>
						<span className="mr-2">{category.emoji}</span>
						{category.label}
					</button>
				))}
			</div>

			{/* Theme Grid */}
			<div className="grid grid-cols-2 gap-4">
				{displayedThemes.map((theme) => (
					<button
						type="button"
						key={theme.id}
						onClick={() => handleThemeSelect(theme)}
						className="p-6 rounded-xl border-3 border-gray-200 bg-white hover:border-blue-500 hover:ring-2 hover:ring-blue-300 hover:ring-opacity-50 transition-all duration-200 text-left"
					>
						<div className="flex items-start gap-4">
							{/* Preview Emoji */}
							<div className="text-5xl flex-shrink-0">{theme.previewEmoji}</div>

							{/* Theme Info */}
							<div className="flex-1 min-w-0">
								<h4 className="text-lg font-bold text-gray-800 mb-1">
									{theme.name}
								</h4>
								<p className="text-sm text-gray-600 mb-2 line-clamp-2">
									{theme.description}
								</p>
								<div className="flex items-center gap-2 text-xs text-gray-500">
									<span className="px-2 py-1 bg-gray-100 rounded">
										{theme.category === "holiday" && "🎉 Holiday"}
										{theme.category === "nature" && "🌿 Nature"}
										{theme.category === "kids" && "🧸 Kids"}
										{theme.category === "educational" && "📚 Educational"}
									</span>
								</div>
							</div>
						</div>
					</button>
				))}

				{/* Build Your Own Card */}
				<button
					type="button"
					onClick={handleBuildCustom}
					className="p-6 rounded-xl border-3 border-dashed border-gray-300 bg-gradient-to-br from-purple-50 to-blue-50 hover:border-purple-500 hover:ring-2 hover:ring-purple-300 hover:ring-opacity-50 transition-all duration-200 text-left"
				>
					<div className="flex flex-col items-center justify-center h-full text-center">
						<div className="text-5xl mb-3">🎨</div>
						<h4 className="text-lg font-bold text-gray-800 mb-2">
							Build Your Own
						</h4>
						<p className="text-sm text-gray-600">
							Choose your own card pack, background, and card back
						</p>
					</div>
				</button>
			</div>
		</div>
	);
};
