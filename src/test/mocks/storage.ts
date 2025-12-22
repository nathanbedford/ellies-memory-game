/**
 * Storage Mock for Testing
 *
 * Provides mock implementations of localStorage and sessionStorage
 * for testing persistence behavior.
 */

// ============================================
// Mock Storage Implementation
// ============================================

export class MockStorage implements Storage {
	private store: Map<string, string> = new Map();

	get length(): number {
		return this.store.size;
	}

	clear(): void {
		this.store.clear();
	}

	getItem(key: string): string | null {
		return this.store.get(key) ?? null;
	}

	key(index: number): string | null {
		const keys = Array.from(this.store.keys());
		return keys[index] ?? null;
	}

	removeItem(key: string): void {
		this.store.delete(key);
	}

	setItem(key: string, value: string): void {
		this.store.set(key, value);
	}

	// Helper for tests
	_getAll(): Record<string, string> {
		const result: Record<string, string> = {};
		this.store.forEach((value, key) => {
			result[key] = value;
		});
		return result;
	}

	// Helper to set initial state
	_setAll(data: Record<string, string>): void {
		this.store.clear();
		Object.entries(data).forEach(([key, value]) => {
			this.store.set(key, value);
		});
	}
}

// ============================================
// Mock Instances
// ============================================

let mockLocalStorage: MockStorage;
let mockSessionStorage: MockStorage;

/**
 * Setup storage mocks.
 * Call this in beforeEach() to get fresh storage instances.
 */
export function setupStorageMocks() {
	mockLocalStorage = new MockStorage();
	mockSessionStorage = new MockStorage();

	// Replace global storage objects
	Object.defineProperty(globalThis, "localStorage", {
		value: mockLocalStorage,
		writable: true,
		configurable: true,
	});

	Object.defineProperty(globalThis, "sessionStorage", {
		value: mockSessionStorage,
		writable: true,
		configurable: true,
	});

	return {
		localStorage: mockLocalStorage,
		sessionStorage: mockSessionStorage,
	};
}

/**
 * Get mock localStorage.
 */
export function getMockLocalStorage(): MockStorage {
	return mockLocalStorage;
}

/**
 * Get mock sessionStorage.
 */
export function getMockSessionStorage(): MockStorage {
	return mockSessionStorage;
}

/**
 * Reset storage mocks.
 * Call in afterEach() to clean up.
 */
export function resetStorageMocks() {
	if (mockLocalStorage) {
		mockLocalStorage.clear();
	}
	if (mockSessionStorage) {
		mockSessionStorage.clear();
	}
}

// ============================================
// Pre-populated Storage Helpers
// ============================================

/**
 * Setup localStorage with matchimus settings.
 * Useful for testing initial state loading.
 */
export function setupWithMatchimusSettings(settings: Record<string, unknown>) {
	const storage = getMockLocalStorage();
	storage.setItem(
		"matchimus-settings",
		JSON.stringify({
			state: { settings },
			version: 0,
		}),
	);
}

/**
 * Setup localStorage with online player preferences.
 */
export function setupWithOnlinePreferences(prefs: {
	name?: string;
	cardPack?: string;
	background?: string;
	cardBack?: string;
}) {
	const storage = getMockLocalStorage();

	if (prefs.name) {
		storage.setItem("onlinePlayerName", prefs.name);
	}
	if (prefs.cardPack) {
		storage.setItem("onlineCardPack", prefs.cardPack);
	}
	if (prefs.background) {
		storage.setItem("onlineBackground", prefs.background);
	}
	if (prefs.cardBack) {
		storage.setItem("onlineCardBack", prefs.cardBack);
	}
}

/**
 * Get persisted matchimus settings from mock storage.
 */
export function getPersistedSettings(): Record<string, unknown> | null {
	const storage = getMockLocalStorage();
	const data = storage.getItem("matchimus-settings");
	if (!data) return null;

	try {
		const parsed = JSON.parse(data);
		return parsed.state?.settings ?? null;
	} catch {
		return null;
	}
}
