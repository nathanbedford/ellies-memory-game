import { useEffect, useRef, useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";

interface PlayerNamePickerProps {
	currentName: string;
	playerColor: string;
	onSelect: (name: string) => void;
	onCancel: () => void;
	hideActionButtons?: boolean; // Hide inline save/cancel buttons (useful when modal has its own buttons)
	hideDeleteMode?: boolean; // Hide the slide-to-delete control (useful in modal context)
}

// Slide-to-unlock component for enabling delete mode
const SlideToDelete = ({
	onActivate,
	isActive,
	onDeactivate,
}: {
	onActivate: () => void;
	isActive: boolean;
	onDeactivate: () => void;
}) => {
	const trackRef = useRef<HTMLDivElement>(null);
	const [dragX, setDragX] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const startXRef = useRef(0);

	const TRACK_WIDTH = 160;
	const HANDLE_WIDTH = 44;
	const ACTIVATION_THRESHOLD = TRACK_WIDTH - HANDLE_WIDTH - 8;

	// Reset slider position when deactivated
	useEffect(() => {
		if (!isActive) {
			setDragX(0);
		}
	}, [isActive]);

	const handleStart = (clientX: number) => {
		if (isActive) return;
		setIsDragging(true);
		startXRef.current = clientX - dragX;
	};

	const handleMove = (clientX: number) => {
		if (!isDragging || isActive) return;
		const newX = Math.max(0, Math.min(clientX - startXRef.current, ACTIVATION_THRESHOLD));
		setDragX(newX);
	};

	const handleEnd = () => {
		if (!isDragging) return;
		setIsDragging(false);

		if (dragX >= ACTIVATION_THRESHOLD * 0.9) {
			setDragX(ACTIVATION_THRESHOLD);
			onActivate();
		} else {
			setDragX(0);
		}
	};

	const handleMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
	const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
	const handleMouseUp = () => handleEnd();
	const handleMouseLeave = () => {
		if (isDragging) handleEnd();
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		handleStart(e.touches[0].clientX);
	};
	const handleTouchMove = (e: React.TouchEvent) => {
		handleMove(e.touches[0].clientX);
	};
	const handleTouchEnd = () => handleEnd();

	if (isActive) {
		return (
			<button
				type="button"
				onClick={onDeactivate}
				className="flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-xs font-medium transition-colors"
			>
				<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<title>Exit</title>
					<path
						fillRule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						clipRule="evenodd"
					/>
				</svg>
				Done Editing
			</button>
		);
	}

	return (
		<div
			ref={trackRef}
			className="relative h-9 rounded-full bg-gray-200 overflow-hidden cursor-pointer select-none"
			style={{ width: TRACK_WIDTH }}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseLeave}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
			{/* Track background with progress */}
			<div
				className="absolute inset-y-0 left-0 bg-red-200 transition-all duration-75"
				style={{ width: dragX + HANDLE_WIDTH / 2 }}
			/>

			{/* Label - positioned to the right of handle */}
			<span
				className="absolute inset-y-0 right-0 flex items-center justify-center text-xs font-medium text-gray-500 pointer-events-none pr-3"
				style={{ left: HANDLE_WIDTH + 4 }}
			>
				{isDragging ? "Release →" : "Enable delete mode →"}
			</span>

			{/* Handle */}
			<div
				className={`absolute top-1 h-7 rounded-full bg-white shadow-md flex items-center justify-center transition-shadow ${isDragging ? "shadow-lg" : ""
					}`}
				style={{
					width: HANDLE_WIDTH,
					left: dragX,
				}}
			>
				<svg
					className={`w-4 h-4 transition-colors ${isDragging ? "text-red-500" : "text-gray-400"}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Drag</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 5l7 7-7 7"
					/>
				</svg>
			</div>
		</div>
	);
};

export const PlayerNamePicker = ({
	currentName,
	playerColor,
	onSelect,
	onCancel,
	hideActionButtons = false,
	hideDeleteMode = false,
}: PlayerNamePickerProps) => {
	const savedNames =
		useSettingsStore((state) => state.settings.savedPlayerNames) ?? [];
	const addSavedPlayerName = useSettingsStore(
		(state) => state.addSavedPlayerName,
	);
	const removeSavedPlayerName = useSettingsStore(
		(state) => state.removeSavedPlayerName,
	);

	const [newName, setNewName] = useState(currentName);
	const [deleteMode, setDeleteMode] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	// Sync input value when currentName changes from parent
	useEffect(() => {
		setNewName(currentName);
	}, [currentName]);

	const handleSelectSaved = (name: string) => {
		if (deleteMode) return; // Don't select when in delete mode
		addSavedPlayerName(name);
		setNewName(name); // Update the text input to show the selected name
		onSelect(name);
	};

	const handleRemoveName = (
		e: React.MouseEvent | React.TouchEvent,
		name: string,
	) => {
		e.stopPropagation();
		e.preventDefault();
		removeSavedPlayerName(name);
	};

	const handleNewNameSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (newName.trim()) {
			addSavedPlayerName(newName.trim());
			onSelect(newName.trim());
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			onCancel();
		}
	};

	// Filter out the current name from saved names to avoid showing it twice
	const filteredSavedNames = savedNames.filter(
		(name) => name.toLowerCase() !== currentName.toLowerCase(),
	);

	return (
		<div className="space-y-3">
			{/* Slide-to-delete control - absolutely positioned in upper right of parent editing panel */}
			{filteredSavedNames.length > 0 && !hideDeleteMode && (
				<div className="absolute top-2 right-2 z-10">
					<SlideToDelete
						isActive={deleteMode}
						onActivate={() => setDeleteMode(true)}
						onDeactivate={() => setDeleteMode(false)}
					/>
				</div>
			)}

			{/* Saved Names - compact horizontal layout */}
			{filteredSavedNames.length > 0 && (
				<div className="flex flex-wrap gap-1.5 justify-start">
					{filteredSavedNames.map((name) => (
						<button
							key={name}
							type="button"
							onClick={() => handleSelectSaved(name)}
							className={`relative flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border-2 transition-all duration-200 ${deleteMode
								? "cursor-default border-red-300 bg-red-50"
								: "hover:scale-105 active:scale-95"
								}`}
							style={
								deleteMode
									? {}
									: {
										borderColor: playerColor,
										backgroundColor: `${playerColor}10`,
									}
							}
						>
							<span
								className={`font-semibold text-sm ${deleteMode ? "text-red-500" : "text-gray-800"}`}
							>
								{name}
							</span>
							{/* Delete button - only visible in delete mode */}
							{deleteMode && (
								<button
									type="button"
									onClick={(e) => handleRemoveName(e, name)}
									onTouchEnd={(e) => handleRemoveName(e, name)}
									className="w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white transition-transform hover:scale-110"
									title={`Remove ${name}`}
								>
									<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
										<title>Remove</title>
										<path
											fillRule="evenodd"
											d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
											clipRule="evenodd"
										/>
									</svg>
								</button>
							)}
						</button>
					))}
				</div>
			)}

			{/* New Name Input - compact */}
			<form onSubmit={handleNewNameSubmit} className="flex items-center gap-2">
				<div className="flex-1 relative">
					<input
						ref={inputRef}
						type="text"
						value={newName}
						onChange={(e) => {
						const value = e.target.value;
						setNewName(value);
						// Sync with parent on every keystroke so Done button works
						if (value.trim()) {
							onSelect(value.trim());
						}
					}}
						onKeyDown={handleKeyDown}
						className="w-full px-3 py-2 pr-9 min-h-[40px] text-base font-semibold text-gray-800 border-2 rounded-lg focus:outline-none focus:ring-2"
						style={{
							borderColor: playerColor,
						}}
						placeholder="Enter name..."
						maxLength={20}
						autoFocus
					/>
					{/* Clear button inside input */}
					{newName && (
						<button
							type="button"
							onClick={() => {
								setNewName("");
								inputRef.current?.focus();
							}}
							className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
							title="Clear"
						>
							<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<title>Clear</title>
								<path
									fillRule="evenodd"
									d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
					)}
				</div>
				{!hideActionButtons && (
					<>
						<button
							type="submit"
							disabled={!newName.trim()}
							className="px-3 py-2 min-h-[40px] rounded-lg text-white font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
							style={{ backgroundColor: playerColor }}
							title="Save name"
						>
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
								<title>Save</title>
								<path
									fillRule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
						<button
							type="button"
							onClick={onCancel}
							className="px-3 py-2 min-h-[40px] bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors duration-200"
							title="Cancel"
						>
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
								<title>Cancel</title>
								<path
									fillRule="evenodd"
									d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
					</>
				)}
			</form>
		</div>
	);
};
