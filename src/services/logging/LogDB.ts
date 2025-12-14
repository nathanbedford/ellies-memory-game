/**
 * LogDB - Dexie-based IndexedDB wrapper for persistent log storage
 *
 * Stores logs organized by roomCode with size-based retention.
 */

import Dexie, { type EntityTable } from "dexie";

export interface LogEntry {
	id?: number;
	timestamp: number;
	level: "error" | "warn" | "info" | "debug" | "trace";
	message: string;
	context?: Record<string, unknown>;
	roomCode?: string;
	playerSlot?: 1 | 2;
	sizeBytes: number;
}

export interface LogQuery {
	roomCode?: string;
	level?: LogEntry["level"];
	minLevel?: LogEntry["level"];
	startTime?: number;
	endTime?: number;
	limit?: number;
}

const LEVEL_ORDER: Record<LogEntry["level"], number> = {
	error: 0,
	warn: 1,
	info: 2,
	debug: 3,
	trace: 4,
};

class LogDatabase extends Dexie {
	logs!: EntityTable<LogEntry, "id">;

	constructor() {
		super("matchimus-logs");

		this.version(1).stores({
			logs: "++id, timestamp, level, roomCode, [roomCode+timestamp]",
		});
	}
}

class LogDB {
	private db: LogDatabase;

	constructor() {
		this.db = new LogDatabase();
	}

	async addLog(entry: Omit<LogEntry, "id">): Promise<number> {
		return this.db.logs.add(entry as LogEntry);
	}

	async getLogs(query: LogQuery = {}): Promise<LogEntry[]> {
		let collection;

		if (query.roomCode) {
			// Use compound index for room-specific queries
			collection = this.db.logs
				.where("[roomCode+timestamp]")
				.between(
					[query.roomCode, query.startTime ?? 0],
					[query.roomCode, query.endTime ?? Date.now()],
					true,
					true,
				)
				.reverse();
		} else {
			// Use timestamp index for general queries
			collection = this.db.logs
				.where("timestamp")
				.between(query.startTime ?? 0, query.endTime ?? Date.now(), true, true)
				.reverse();
		}

		let results = await collection.toArray();

		// Filter by level if specified
		if (query.level) {
			results = results.filter((entry) => entry.level === query.level);
		}

		// Filter by minimum level
		if (query.minLevel) {
			const minOrder = LEVEL_ORDER[query.minLevel];
			results = results.filter(
				(entry) => LEVEL_ORDER[entry.level] <= minOrder,
			);
		}

		// Apply limit
		if (query.limit) {
			results = results.slice(0, query.limit);
		}

		return results;
	}

	async getTotalSize(): Promise<number> {
		const logs = await this.db.logs.toArray();
		return logs.reduce((sum, entry) => sum + entry.sizeBytes, 0);
	}

	async getLogCount(): Promise<number> {
		return this.db.logs.count();
	}

	async deleteOldestLogs(bytesToDelete: number): Promise<number> {
		// Get logs sorted by timestamp (oldest first)
		const logs = await this.db.logs.orderBy("timestamp").toArray();

		let deletedBytes = 0;
		let deletedCount = 0;
		const idsToDelete: number[] = [];

		for (const log of logs) {
			if (deletedBytes >= bytesToDelete) break;
			if (log.id !== undefined) {
				idsToDelete.push(log.id);
				deletedBytes += log.sizeBytes;
				deletedCount++;
			}
		}

		if (idsToDelete.length > 0) {
			await this.db.logs.bulkDelete(idsToDelete);
		}

		return deletedCount;
	}

	async clearLogs(): Promise<void> {
		await this.db.logs.clear();
	}

	async clearLogsForRoom(roomCode: string): Promise<number> {
		const logsToDelete = await this.db.logs
			.where("roomCode")
			.equals(roomCode)
			.toArray();

		const idsToDelete = logsToDelete
			.map((log) => log.id)
			.filter((id): id is number => id !== undefined);

		if (idsToDelete.length > 0) {
			await this.db.logs.bulkDelete(idsToDelete);
		}

		return idsToDelete.length;
	}

	async exportLogs(roomCode?: string): Promise<LogEntry[]> {
		return this.getLogs({ roomCode });
	}
}

// Singleton instance
export const logDB = new LogDB();
