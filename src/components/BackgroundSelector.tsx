import {
	type BackgroundTheme,
	useBackgroundSelector,
} from "../hooks/useBackgroundSelector";

interface BackgroundSelectorProps {
	selectedBackground: BackgroundTheme;
	onBackgroundChange: (background: BackgroundTheme) => void;
}

export const BackgroundSelector = ({
	selectedBackground,
	onBackgroundChange,
}: BackgroundSelectorProps) => {
	const { backgroundOptions } = useBackgroundSelector();

	return (
		<div className="flex items-center gap-2">
			<label
				htmlFor="background-select"
				className="text-sm font-medium text-gray-700"
			>
				Background:
			</label>
			<select
				id="background-select"
				value={selectedBackground}
				onChange={(e) => onBackgroundChange(e.target.value as BackgroundTheme)}
				className="px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm hover:border-gray-400 transition-colors cursor-pointer"
			>
				{backgroundOptions.map((option) => (
					<option key={option.id} value={option.id}>
						{option.name}
					</option>
				))}
			</select>
		</div>
	);
};
