/**
 * Test Mocks Index
 *
 * Centralized exports for all test mocks.
 */

// Firebase mocks
export {
	createMockFirestoreSyncAdapter,
	createMockPresenceService,
	setupFirebaseMocks,
	getMockFirestoreSyncAdapter,
	resetFirebaseMocks,
	createFirestoreSyncAdapterMock,
} from "./firebase";
export type { MockFirestoreSyncAdapterState, MockPresenceState } from "./firebase";

// Router mocks
export {
	mockNavigate,
	useNavigateMock,
	useLocationMock,
	useRouterStateMock,
	useSearchMock,
	useParamsMock,
	useMatchMock,
	setMockRoute,
	getMockNavigationHistory,
	getMockCurrentRoute,
	resetRouterMocks,
	createRouterMock,
} from "./router";
export type { MockRouterState } from "./router";

// Storage mocks
export {
	MockStorage,
	setupStorageMocks,
	getMockLocalStorage,
	getMockSessionStorage,
	resetStorageMocks,
	setupWithMatchimusSettings,
	setupWithOnlinePreferences,
	getPersistedSettings,
} from "./storage";

// Screenfull mocks
export {
	mockScreenfull,
	setupScreenfullMock,
	simulateFullscreen,
	simulateExitFullscreen,
	simulateFullscreenError,
	disableFullscreen,
	enableFullscreen,
	resetScreenfullMock,
	createScreenfullMock,
} from "./screenfull";
export type { MockScreenfullState } from "./screenfull";
