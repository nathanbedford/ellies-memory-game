import { useState, useEffect, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { Modal } from "./Modal";
import { logger, type LogEntry, type LogLevel } from "../services/logging/LogService";

interface LogViewerModalProps {
	isOpen: boolean;
	onClose: () => void;
	roomCode?: string;
}

const LEVEL_COLORS: Record<LogLevel, string> = {
	error: "bg-red-100 text-red-800",
	warn: "bg-yellow-100 text-yellow-800",
	info: "bg-blue-100 text-blue-800",
	debug: "bg-purple-100 text-purple-800",
	trace: "bg-gray-100 text-gray-600",
};

const LEVEL_OPTIONS: LogLevel[] = ["error", "warn", "info", "debug", "trace"];

export const LogViewerModal = ({
	isOpen,
	onClose,
	roomCode: initialRoomCode,
}: LogViewerModalProps) => {
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [minLevel, setMinLevel] = useState<LogLevel>("debug");
	const [searchTerm, setSearchTerm] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [stats, setStats] = useState({ count: 0, sizeMB: 0 });
	const [consoleLevel, setConsoleLevel] = useState<LogLevel>(
		logger.getConsoleLevel(),
	);
	const [roomCodes, setRoomCodes] = useState<{ roomCode: string; lastActivity: number }[]>([]);
	const [selectedRoomCode, setSelectedRoomCode] = useState<string>(initialRoomCode || "");
	const [copied, setCopied] = useState(false);

	const loadLogs = useCallback(async () => {
		setIsLoading(true);
		try {
			const roomCodeFilter = selectedRoomCode || undefined;
			const [fetchedLogs, count, size] = await Promise.all([
				logger.getLogs({ roomCode: roomCodeFilter, minLevel, limit: 500 }),
				logger.getLogCount(),
				logger.getTotalSize(),
			]);
			setLogs(fetchedLogs);
			setStats({ count, sizeMB: size / 1024 / 1024 });
		} catch (err) {
			console.error("Failed to load logs:", err);
		} finally {
			setIsLoading(false);
		}
	}, [selectedRoomCode, minLevel]);

	const loadRoomCodes = useCallback(async () => {
		try {
			const codes = await logger.getUniqueRoomCodes();
			setRoomCodes(codes);
		} catch (err) {
			console.error("Failed to load room codes:", err);
		}
	}, []);

	useEffect(() => {
		if (isOpen) {
			loadLogs();
			loadRoomCodes();
		}
	}, [isOpen, loadLogs, loadRoomCodes]);

	// Reset selected room code when initial room code prop changes
	useEffect(() => {
		setSelectedRoomCode(initialRoomCode || "");
	}, [initialRoomCode]);

	const handleConsoleLevelChange = (level: LogLevel) => {
		setConsoleLevel(level);
		logger.setConsoleLevel(level);
	};

	const handleClearLogs = async () => {
		if (
			window.confirm(
				selectedRoomCode
					? `Clear all logs for room ${selectedRoomCode}?`
					: "Clear ALL logs? This cannot be undone.",
			)
		) {
			if (selectedRoomCode) {
				await logger.clearLogsForRoom(selectedRoomCode);
			} else {
				await logger.clearLogs();
			}
			await loadLogs();
			await loadRoomCodes();
		}
	};

	const handleExport = async () => {
		await logger.downloadLogs(selectedRoomCode || undefined);
	};

	const handleCopyLogs = async () => {
		const textLogs = logger.formatLogsAsText(filteredLogs);
		try {
			await navigator.clipboard.writeText(textLogs);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy logs:", err);
			// Fallback for older browsers
			const textarea = document.createElement("textarea");
			textarea.value = textLogs;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const filteredLogs = searchTerm
		? logs.filter(
				(log) =>
					log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
					JSON.stringify(log.context)
						.toLowerCase()
						.includes(searchTerm.toLowerCase()),
			)
		: logs;

	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp);
		const time = date.toLocaleTimeString("en-US", {
			hour12: false,
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
		const ms = date.getMilliseconds().toString().padStart(3, "0");
		return `${time}.${ms}`;
	};

	const formatContext = (context?: Record<string, unknown>) => {
		if (!context) return null;
		const { roomCode: _, playerSlot: __, ...rest } = context;
		if (Object.keys(rest).length === 0) return null;
		return JSON.stringify(rest, null, 2);
	};

	const formatRelativeTime = (timestamp: number) => {
		const diff = Date.now() - timestamp;
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);
		if (days > 0) return `${days}d ago`;
		if (hours > 0) return `${hours}h ago`;
		if (minutes > 0) return `${minutes}m ago`;
		return "just now";
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Debug Logs">
			<div className="space-y-4">
				{/* Room Code Selector */}
				<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
					<label className="text-sm font-medium text-gray-700">Room:</label>
					<select
						value={selectedRoomCode}
						onChange={(e) => setSelectedRoomCode(e.target.value)}
						className="flex-1 border rounded px-3 py-1.5 text-sm bg-white"
					>
						<option value="">All Rooms</option>
						{roomCodes.map(({ roomCode, lastActivity }) => (
							<option key={roomCode} value={roomCode}>
								{roomCode} ({formatRelativeTime(lastActivity)})
							</option>
						))}
					</select>
					<button
						onClick={handleCopyLogs}
						disabled={filteredLogs.length === 0}
						className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
							copied
								? "bg-green-100 text-green-800"
								: "bg-blue-100 hover:bg-blue-200 text-blue-800"
						} disabled:opacity-50 disabled:cursor-not-allowed`}
						title="Copy logs to clipboard"
					>
						{copied ? (
							<>
								<Check className="w-4 h-4" />
								Copied!
							</>
						) : (
							<>
								<Copy className="w-4 h-4" />
								Copy Logs
							</>
						)}
					</button>
				</div>

				{/* Controls */}
				<div className="flex flex-wrap gap-4 items-center justify-between">
					{/* Filters */}
					<div className="flex gap-3 items-center">
						<div>
							<label className="text-sm text-gray-600 mr-2">Show:</label>
							<select
								value={minLevel}
								onChange={(e) => setMinLevel(e.target.value as LogLevel)}
								className="border rounded px-2 py-1 text-sm"
							>
								{LEVEL_OPTIONS.map((level) => (
									<option key={level} value={level}>
										{level}+
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="text-sm text-gray-600 mr-2">Console:</label>
							<select
								value={consoleLevel}
								onChange={(e) =>
									handleConsoleLevelChange(e.target.value as LogLevel)
								}
								className="border rounded px-2 py-1 text-sm"
							>
								{LEVEL_OPTIONS.map((level) => (
									<option key={level} value={level}>
										{level}
									</option>
								))}
							</select>
						</div>
						<input
							type="text"
							placeholder="Search logs..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="border rounded px-3 py-1 text-sm w-48"
						/>
					</div>

					{/* Actions */}
					<div className="flex gap-2 items-center">
						<span className="text-xs text-gray-500">
							{stats.count.toLocaleString()} logs ({stats.sizeMB.toFixed(2)} MB)
						</span>
						<button
							onClick={loadLogs}
							disabled={isLoading}
							className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
						>
							Refresh
						</button>
						<button
							onClick={handleExport}
							className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
						>
							Export
						</button>
						<button
							onClick={handleClearLogs}
							className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded transition-colors"
						>
							Clear
						</button>
					</div>
				</div>

				{/* Logs table */}
				<div className="border rounded-lg overflow-hidden">
					<div className="max-h-96 overflow-y-auto bg-gray-50">
						{isLoading ? (
							<div className="p-8 text-center text-gray-500">Loading...</div>
						) : filteredLogs.length === 0 ? (
							<div className="p-8 text-center text-gray-500">No logs found</div>
						) : (
							<table className="w-full text-xs">
								<thead className="bg-gray-100 sticky top-0">
									<tr>
										<th className="px-2 py-2 text-left font-medium text-gray-600 w-24">
											Time
										</th>
										<th className="px-2 py-2 text-left font-medium text-gray-600 w-16">
											Level
										</th>
										{!selectedRoomCode && (
											<th className="px-2 py-2 text-left font-medium text-gray-600 w-16">
												Room
											</th>
										)}
										<th className="px-2 py-2 text-left font-medium text-gray-600">
											Message
										</th>
									</tr>
								</thead>
								<tbody className="font-mono">
									{filteredLogs.map((log) => (
										<tr
											key={log.id}
											className="border-t border-gray-200 hover:bg-white"
										>
											<td className="px-2 py-1.5 text-gray-500 whitespace-nowrap">
												{formatTime(log.timestamp)}
											</td>
											<td className="px-2 py-1.5">
												<span
													className={`px-1.5 py-0.5 rounded text-xs font-medium ${LEVEL_COLORS[log.level]}`}
												>
													{log.level.toUpperCase()}
												</span>
											</td>
											{!selectedRoomCode && (
												<td className="px-2 py-1.5 text-gray-500">
													{log.roomCode || "-"}
												</td>
											)}
											<td className="px-2 py-1.5">
												<div className="flex items-start gap-2">
													{log.playerSlot && (
														<span className="text-gray-400">
															[P{log.playerSlot}]
														</span>
													)}
													<span className="text-gray-800">{log.message}</span>
												</div>
												{formatContext(log.context) && (
													<pre className="mt-1 text-gray-500 bg-gray-100 p-1 rounded text-[10px] overflow-x-auto">
														{formatContext(log.context)}
													</pre>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="text-xs text-gray-500">
					Showing {filteredLogs.length} of {logs.length} logs (max 500 loaded).
					Older logs are automatically deleted when storage exceeds{" "}
					{logger.getMaxSizeMB()} MB.
				</div>
			</div>
		</Modal>
	);
};
