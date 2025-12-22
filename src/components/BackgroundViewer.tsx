import { useCallback, useEffect } from "react";
import type { BackgroundOption } from "../hooks/useBackgroundSelector";

interface BackgroundViewerProps {
	isOpen: boolean;
	onClose: () => void;
	background: BackgroundOption;
}

export const BackgroundViewer = ({
	isOpen,
	onClose,
	background,
}: BackgroundViewerProps) => {
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		},
		[onClose],
	);

	useEffect(() => {
		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
			return () => document.removeEventListener("keydown", handleKeyDown);
		}
	}, [isOpen, handleKeyDown]);

	if (!isOpen) return null;

	const backgroundStyle = background.imageUrl
		? {
				backgroundImage: `url(${background.imageUrl})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat" as const,
			}
		: {};

	const backgroundClass = background.imageUrl
		? ""
		: background.gradient
			? `bg-gradient-to-br ${background.gradient}`
			: "bg-gray-200";

	return (
		<button
			type="button"
			className={`fixed inset-0 z-[100] cursor-pointer ${backgroundClass} w-full h-full border-0`}
			style={backgroundStyle}
			onClick={onClose}
		>
			{/* Close button indicator */}
			<span
				className="absolute top-6 right-6 p-3 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors backdrop-blur-sm"
				aria-hidden="true"
			>
				<svg
					className="w-6 h-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</span>

			{/* Background name label */}
			<span className="absolute bottom-6 left-6 px-4 py-2 bg-black/30 text-white rounded-lg backdrop-blur-sm">
				<span className="text-sm font-medium">{background.name}</span>
			</span>

			{/* Click anywhere hint */}
			<span className="absolute bottom-6 right-6 px-4 py-2 bg-black/30 text-white/70 rounded-lg backdrop-blur-sm">
				<span className="text-sm">Click anywhere to close</span>
			</span>
		</button>
	);
};
