/**
 * Test Mocks Index
 *
 * Centralized exports for all test mocks.
 */

export type {
	MockFirestoreSyncAdapterState,
	MockPresenceState,
} from "./firebase";
// Firebase mocks
export {
	createFirestoreSyncAdapterMock,
	createMockFirestoreSyncAdapter,
	createMockPresenceService,
	getMockFirestoreSyncAdapter,
	resetFirebaseMocks,
	setupFirebaseMocks,
} from "./firebase";
export type { MockRouterState } from "./router";
// Router mocks
export {
	createRouterMock,
	getMockCurrentRoute,
	getMockNavigationHistory,
	mockNavigate,
	resetRouterMocks,
	setMockRoute,
	useLocationMock,
	useMatchMock,
	useNavigateMock,
	useParamsMock,
	useRouterStateMock,
	useSearchMock,
} from "./router";
export type { MockScreenfullState } from "./screenfull";

// Screenfull mocks
export {
	createScreenfullMock,
	disableFullscreen,
	enableFullscreen,
	mockScreenfull,
	resetScreenfullMock,
	setupScreenfullMock,
	simulateExitFullscreen,
	simulateFullscreen,
	simulateFullscreenError,
} from "./screenfull";
// Storage mocks
export {
	getMockLocalStorage,
	getMockSessionStorage,
	getPersistedSettings,
	MockStorage,
	resetStorageMocks,
	setupStorageMocks,
	setupWithMatchimusSettings,
	setupWithOnlinePreferences,
} from "./storage";
