/**
 * LogService - Dual logging to IndexedDB and console
 *
 * All logs are written to IndexedDB for persistence.
 * Console output is filtered by the current verbosity level.
 */

import { logDB, type LogEntry, type LogQuery } from "./LogDB";

export type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

const LEVEL_ORDER: Record<LogLevel, number> = {
	error: 0,
	warn: 1,
	info: 2,
	debug: 3,
	trace: 4,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
	error: "color: #ef4444; font-weight: bold",
	warn: "color: #f59e0b; font-weight: bold",
	info: "color: #3b82f6",
	debug: "color: #8b5cf6",
	trace: "color: #6b7280",
};

const LEVEL_CONSOLE_METHOD: Record<LogLevel, keyof Console> = {
	error: "error",
	warn: "warn",
	info: "info",
	debug: "debug",
	trace: "debug",
};

// Default settings - can be overridden
const DEFAULT_CONSOLE_LEVEL: LogLevel = "info";
const DEFAULT_MAX_SIZE_MB = 50;

interface LogContext {
	roomCode?: string;
	playerSlot?: 1 | 2;
	[key: string]: unknown;
}

class LogService {
	private consoleLevel: LogLevel = DEFAULT_CONSOLE_LEVEL;
	private maxSizeBytes: number = DEFAULT_MAX_SIZE_MB * 1024 * 1024;
	private currentRoomCode: string | null = null;
	private currentPlayerSlot: 1 | 2 | null = null;
	private pendingRetentionCheck = false;

	/**
	 * Set the minimum level for console output
	 */
	setConsoleLevel(level: LogLevel): void {
		this.consoleLevel = level;
		console.info(
			`%c[Logger] Console level set to: ${level}`,
			"color: #10b981",
		);
	}

	getConsoleLevel(): LogLevel {
		return this.consoleLevel;
	}

	/**
	 * Set max storage size in MB
	 */
	setMaxSizeMB(mb: number): void {
		this.maxSizeBytes = mb * 1024 * 1024;
	}

	getMaxSizeMB(): number {
		return this.maxSizeBytes / 1024 / 1024;
	}

	/**
	 * Set context for all subsequent logs (room and player)
	 */
	setContext(roomCode: string | null, playerSlot: 1 | 2 | null): void {
		this.currentRoomCode = roomCode;
		this.currentPlayerSlot = playerSlot;
	}

	/**
	 * Core logging method
	 */
	private async log(
		level: LogLevel,
		message: string,
		context?: LogContext,
	): Promise<void> {
		const timestamp = Date.now();

		// Merge context with current room/player
		const fullContext: LogContext = {
			...context,
			roomCode: context?.roomCode ?? this.currentRoomCode ?? undefined,
			playerSlot: context?.playerSlot ?? this.currentPlayerSlot ?? undefined,
		};

		// Always write to IndexedDB
		const entry: Omit<LogEntry, "id"> = {
			timestamp,
			level,
			message,
			context: fullContext,
			roomCode: fullContext.roomCode,
			playerSlot: fullContext.playerSlot,
			sizeBytes: this.estimateSize(message, fullContext),
		};

		try {
			await logDB.addLog(entry);
			this.checkRetention();
		} catch (err) {
			// Don't let logging failures break the app
			console.error("Failed to write log to IndexedDB:", err);
		}

		// Conditionally write to console based on level
		if (LEVEL_ORDER[level] <= LEVEL_ORDER[this.consoleLevel]) {
			this.writeToConsole(level, message, fullContext, timestamp);
		}
	}

	private writeToConsole(
		level: LogLevel,
		message: string,
		context: LogContext,
		timestamp: number,
	): void {
		const time = new Date(timestamp).toISOString().slice(11, 23);
		const prefix = `[${time}] [${level.toUpperCase()}]`;
		const roomInfo = context.roomCode ? ` [${context.roomCode}]` : "";
		const playerInfo = context.playerSlot ? ` [P${context.playerSlot}]` : "";

		const method = LEVEL_CONSOLE_METHOD[level] as "log";
		const style = LEVEL_COLORS[level];

		// Remove roomCode and playerSlot from displayed context (already in prefix)
		const { roomCode, playerSlot, ...displayContext } = context;
		const hasContext = Object.keys(displayContext).length > 0;

		if (hasContext) {
			console[method](
				`%c${prefix}${roomInfo}${playerInfo} ${message}`,
				style,
				displayContext,
			);
		} else {
			console[method](`%c${prefix}${roomInfo}${playerInfo} ${message}`, style);
		}
	}

	private estimateSize(message: string, context?: LogContext): number {
		// Rough estimate: message length + JSON context + overhead
		const contextSize = context ? JSON.stringify(context).length : 0;
		return message.length + contextSize + 100; // 100 bytes overhead
	}

	private async checkRetention(): Promise<void> {
		// Debounce retention checks
		if (this.pendingRetentionCheck) return;
		this.pendingRetentionCheck = true;

		// Check every 100 writes or so
		setTimeout(async () => {
			this.pendingRetentionCheck = false;

			try {
				const totalSize = await logDB.getTotalSize();
				if (totalSize > this.maxSizeBytes) {
					const bytesToDelete = totalSize - this.maxSizeBytes * 0.8; // Delete to 80% capacity
					const deleted = await logDB.deleteOldestLogs(bytesToDelete);
					console.info(
						`%c[Logger] Retention cleanup: deleted ${deleted} old logs`,
						"color: #10b981",
					);
				}
			} catch (err) {
				console.error("Failed to check log retention:", err);
			}
		}, 1000);
	}

	// Convenience methods for each level
	error(message: string, context?: LogContext): void {
		this.log("error", message, context);
	}

	warn(message: string, context?: LogContext): void {
		this.log("warn", message, context);
	}

	info(message: string, context?: LogContext): void {
		this.log("info", message, context);
	}

	debug(message: string, context?: LogContext): void {
		this.log("debug", message, context);
	}

	trace(message: string, context?: LogContext): void {
		this.log("trace", message, context);
	}

	// Query methods
	async getLogs(query?: LogQuery): Promise<LogEntry[]> {
		return logDB.getLogs(query);
	}

	async getLogsForCurrentRoom(): Promise<LogEntry[]> {
		if (!this.currentRoomCode) return [];
		return logDB.getLogs({ roomCode: this.currentRoomCode });
	}

	async getTotalSize(): Promise<number> {
		return logDB.getTotalSize();
	}

	async getLogCount(): Promise<number> {
		return logDB.getLogCount();
	}

	async clearLogs(): Promise<void> {
		return logDB.clearLogs();
	}

	async clearLogsForRoom(roomCode: string): Promise<number> {
		return logDB.clearLogsForRoom(roomCode);
	}

	async exportLogs(roomCode?: string): Promise<string> {
		const logs = await logDB.exportLogs(roomCode);
		return JSON.stringify(logs, null, 2);
	}

	async downloadLogs(roomCode?: string): Promise<void> {
		const logs = await this.exportLogs(roomCode);
		const blob = new Blob([logs], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `matchimus-logs${roomCode ? `-${roomCode}` : ""}-${new Date().toISOString().slice(0, 10)}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
}

// Singleton instance
export const logger = new LogService();

// Re-export types
export type { LogEntry, LogQuery } from "./LogDB";
