import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { PlayerNamePicker } from "./PlayerNamePicker";

const COLOR_OPTIONS = [
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

interface PlayerNameEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    playerName: string;
    playerColor: string;
    onSave: (newName: string) => void;
    onColorChange?: (newColor: string) => void;
}

export const PlayerNameEditModal = ({
    isOpen,
    onClose,
    playerName,
    playerColor,
    onSave,
    onColorChange,
}: PlayerNameEditModalProps) => {
    const [pendingName, setPendingName] = useState(playerName);
    const [pendingColor, setPendingColor] = useState(playerColor);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setPendingName(playerName);
            setPendingColor(playerColor);
        }
    }, [isOpen, playerName, playerColor]);

    const handleNameSelect = (name: string) => {
        // Just update pending name, don't close
        setPendingName(name);
    };

    const handleColorChange = (color: string) => {
        setPendingColor(color);
    };

    const handleDone = () => {
        // Save name if changed
        if (pendingName !== playerName) {
            onSave(pendingName);
        }
        // Save color if changed
        if (pendingColor !== playerColor && onColorChange) {
            onColorChange(pendingColor);
        }
        onClose();
    };

    const handleCancel = () => {
        // Reset and close without saving
        setPendingName(playerName);
        setPendingColor(playerColor);
        onClose();
    };

    const hasChanges = pendingName !== playerName || pendingColor !== playerColor;

    return (
        <Modal isOpen={isOpen} onClose={handleCancel} title="Edit Player">
            <div className="space-y-4">
                {/* Current selection preview */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div
                        className="w-8 h-8 rounded-full border-2 border-white shadow-md flex-shrink-0"
                        style={{ backgroundColor: pendingColor }}
                    />
                    <span className="text-xl font-bold text-gray-800">
                        {pendingName}
                    </span>
                    {hasChanges && (
                        <span className="text-xs text-gray-500 ml-auto">(unsaved changes)</span>
                    )}
                </div>

                {/* Name Section */}
                <div>
                    <p className="text-sm text-gray-600 mb-2">
                        Choose from saved names or enter a new one:
                    </p>
                    <PlayerNamePicker
                        currentName={pendingName}
                        playerColor={pendingColor}
                        onSelect={handleNameSelect}
                        onCancel={handleCancel}
                        hideActionButtons={true}
                        hideDeleteMode={true}
                    />
                </div>

                {/* Color Section - only show if onColorChange is provided */}
                {onColorChange && (
                    <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-2">Player Color:</p>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_OPTIONS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => handleColorChange(color)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${pendingColor === color
                                        ? "border-gray-800 scale-110 ring-2 ring-gray-300"
                                        : "border-gray-300 hover:scale-110"
                                        }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                            <input
                                type="color"
                                value={pendingColor}
                                onChange={(e) => handleColorChange(e.target.value)}
                                className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
                                title="Custom color"
                            />
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleDone}
                        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </Modal>
    );
};

