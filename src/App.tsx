import { useEffect, useLayoutEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useLocalGame } from './hooks/useLocalGame';
import { useCardPacks } from './hooks/useCardPacks';
import { useBackgroundSelector, BackgroundTheme, BACKGROUND_OPTIONS } from './hooks/useBackgroundSelector';
import { useCardBackSelector, CardBackType, CARD_BACK_OPTIONS } from './hooks/useCardBackSelector';
import { useOnlineGame } from './hooks/useOnlineGame';
import { useOnlineStore } from './stores/onlineStore';
import { useCursorSync } from './hooks/useCursorSync';
import { CardPack, GameMode, OnlineGameState } from './types';
import { CARD_DECKS } from './data/cardDecks';
import { initializeCards, createInitialState, startGameWithCards, getPlayerScore, reconcileMatchedCards, getPlayersFromPresence, calculateWinner } from './services/game/GameEngine';
import { getFirestoreSyncAdapter } from './services/sync/FirestoreSyncAdapter';
import { GameBoard } from './components/GameBoard';
import { GameOver } from './components/GameOver';
import { Modal } from './components/Modal';
import { CardPackModal } from './components/CardPackModal';
import { BackgroundModal } from './components/BackgroundModal';
import { CardBackModal } from './components/CardBackModal';
import { GameStartModal } from './components/GameStartModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { GameTheme } from './types';
import { ResetConfirmationModal } from './components/ResetConfirmationModal';
import { ReloadConfirmationModal } from './components/ReloadConfirmationModal';
import { SettingsMenu } from './components/SettingsMenu';
import { PlayerMatchesModal } from './components/PlayerMatchesModal';
import { CardExplorerModal } from './components/CardExplorerModal';
import { GameplayHeader, FixedGameControls, SetupControls, FloatingSettingsButton } from './components/game';
import { SettingsSidebarWrapper } from './components/layout';
import { BackgroundViewer } from './components/BackgroundViewer';
import { Pong } from './components/Pong';
import { MobileWarningModal } from './components/MobileWarningModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { AdminSidebar } from './components/AdminSidebar';
import { LogViewerModal } from './components/LogViewerModal';
import { ModeSelector, OnlineLobby, OpponentDisconnectOverlay } from './components/online';
import { useOpponentDisconnect } from './hooks/useOpponentDisconnect';
import { PairCountModal } from './components/PairCountModal';
import { useSettingsStore } from './stores/settingsStore';
import screenfull from 'screenfull';

// SetupStep type is now derived from route paths
type SetupStep = 'modeSelect' | 'theme' | 'cardPack' | 'background' | 'cardBack' | 'pairCount' | 'startGame' | null;

const ENABLE_SETUP_DEBUG_LOGS = true;

const setupWizardLog = (...args: unknown[]) => {
  if (!ENABLE_SETUP_DEBUG_LOGS) return;
  console.log('[Setup Wizard]', ...args);
};

// Removed setupWizardWarn - no longer needed with router navigation

// Secret keyboard combo: P+P+O+N+G (press P twice, then O, N, G)
const COMBO_SEQUENCE = ['p', 'p', 'o', 'n', 'g'];
// Test combo: 1, 2, 2, 5, 1, 2, 2, 5 (to advance game to end state)
const TEST_COMBO_SEQUENCE = ['1', '2', '2', '5', '1', '2', '2', '5'];

function App() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const { selectedPack, setSelectedPack, getCurrentPackImages, getPackImagesForPairCount, cardPacks } = useCardPacks();

  // Get pair count settings from settings store
  const localPairCount = useSettingsStore((state) => state.settings.localPairCount);
  const onlinePairCount = useSettingsStore((state) => state.settings.onlinePairCount);
  const setLocalPairCount = useSettingsStore((state) => state.setLocalPairCount);
  const setOnlinePairCount = useSettingsStore((state) => state.setOnlinePairCount);

  // Get blur settings from settings store
  const backgroundBlurEnabled = useSettingsStore((state) => state.settings.backgroundBlurEnabled);
  const setBackgroundBlurEnabled = useSettingsStore((state) => state.setBackgroundBlurEnabled);

  // Local game hook - uses useGameController internally for unified game logic
  const localGame = useLocalGame();
  const { selectedBackground, setSelectedBackground, getCurrentBackground } = useBackgroundSelector();
  const { selectedCardBack, setSelectedCardBack, getCurrentCardBack } = useCardBackSelector();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Derive setupStep from current route
  const setupStep: SetupStep = useMemo(() => {
    if (currentPath === '/') return 'modeSelect';
    if (currentPath === '/local/theme') return 'theme';
    if (currentPath === '/local/card-pack') return 'cardPack';
    if (currentPath === '/local/background') return 'background';
    if (currentPath === '/local/card-back') return 'cardBack';
    if (currentPath === '/local/pair-count') return 'pairCount';
    if (currentPath === '/local/start') return 'startGame';
    if (currentPath === '/local/game') return null;
    if (currentPath === '/online') return 'modeSelect';
    if (currentPath === '/online/game') return null;
    if (currentPath === '/game-over') return null;
    return null;
  }, [currentPath]);
  const [isResetting, setIsResetting] = useState(false);
  const [cameFromTheme, setCameFromTheme] = useState(false); // Track if we came from theme selection
  const [originalPack, setOriginalPack] = useState<string | null>(null);
  const [originalBackground, setOriginalBackground] = useState<BackgroundTheme | null>(null);
  const [originalCardBack, setOriginalCardBack] = useState<CardBackType | null>(null);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showReloadConfirmation, setShowReloadConfirmation] = useState(false);
  const [lastConfig, setLastConfig] = useState<{
    pack: CardPack;
    background: BackgroundTheme;
    cardBack: CardBackType;
    firstPlayer: number;
    pairCount: number;
  } | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedPlayerForMatches, setSelectedPlayerForMatches] = useState<number | null>(null);
  const [glowingPlayer, setGlowingPlayer] = useState<number | null>(null);
  const prevCurrentPlayerRef = useRef<number | null>(null);
  const [showPong, setShowPong] = useState(false);
  const comboSequenceRef = useRef<string[]>([]);
  const comboTimeoutRef = useRef<number | null>(null);
  const testComboSequenceRef = useRef<string[]>([]);
  const testComboTimeoutRef = useRef<number | null>(null);
  const [showCardExplorer, setShowCardExplorer] = useState(false);
  const [showBackgroundViewer, setShowBackgroundViewer] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(false);
  const [adminEnabled, setAdminEnabled] = useState(false); // In-memory only, resets on refresh
  const [showLogViewer, setShowLogViewer] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [showPWAInstall, setShowPWAInstall] = useState(false);
  const refreshCheckDoneRef = useRef(false);
  const isRefreshRedirectingRef = useRef(false);
  const navigateRef = useRef(navigate);

  // Keep navigate ref updated (TanStack Router's navigate is stable, but this ensures we always have latest)
  navigateRef.current = navigate;

  // Clear navigation flag on page unload (before refresh)
  // This ensures refresh detection works correctly
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('appNavigation');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Refresh detection: Redirect to home on page refresh
  // This ensures the app always starts fresh after a refresh, regardless of the URL
  // Using useLayoutEffect to run synchronously before other useEffect hooks (like route guards)
  // that might set the appNavigation flag
  useLayoutEffect(() => {
    // Only check once per page load
    if (refreshCheckDoneRef.current) {
      return;
    }
    refreshCheckDoneRef.current = true;

    // Check if this is a page refresh (not programmatic navigation)
    const isAppNavigation = sessionStorage.getItem('appNavigation');
    const path = window.location.pathname;

    // Standalone pages that can be bookmarked/shared - don't redirect these
    const standalonePages = ['/terms', '/privacy'];
    const isStandalonePage = standalonePages.includes(path);

    // Use window.location.pathname instead of routerState to avoid reactive updates
    // This reads the actual browser URL without triggering React re-renders
    if (path !== '/' && !isAppNavigation && !isStandalonePage) {
      console.log('[REFRESH] Page refreshed on route:', path, '- redirecting to home');
      isRefreshRedirectingRef.current = true;
      // Use ref to avoid dependency on navigate function
      navigateRef.current({ to: '/' });
    }
  }, []); // Empty deps - only run once on mount, use ref for navigate

  // Online multiplayer state
  const { roomCode, room, odahId, leaveRoom, subscribeToPresence, isHost, updateRoomConfig, resetRoomToWaiting, setPlayerNamePreference, presenceData, updatePlayerName: updateOnlinePlayerName } = useOnlineStore();
  // Get local player slot from presence data
  const localPlayerSlot = odahId && presenceData[odahId] ? presenceData[odahId].slot : null;

  // Online game hook - only meaningful when in online mode with valid room
  // Game state is loaded from separate /games/{roomCode} document via Firestore subscription
  // Pass 0 when localPlayerSlot is not yet known from presence data - the hook will delay
  // subscription until a valid slot (1 or 2) is received, preventing race conditions
  const onlineGame = useOnlineGame({
    roomCode: roomCode || '',
    localPlayerSlot: localPlayerSlot || 0,
    flipDuration: localGame.flipDuration,
    initialGameState: localGame.gameState, // Used as fallback until Firestore snapshot arrives
    players: getPlayersFromPresence(presenceData),
    effectManager: localGame.effectManager,
  });

  const getPackImagesById = useCallback((packId: CardPack) => {
    const deck = CARD_DECKS.find(d => d.id === packId) || CARD_DECKS[0];
    return deck.cards.map(card => ({
      id: card.id,
      url: card.imageUrl || card.emoji,
      gradient: card.gradient,
    }));
  }, []);

  const startOnlineRound = useCallback(
    async (options: { firstPlayer: 1 | 2; pack: CardPack; background: BackgroundTheme; cardBack: CardBackType; pairCount?: number }) => {
      if (!roomCode || !room || !isHost) {
        console.warn('[Online] Only the host can start a new round');
        return;
      }

      try {
        const adapter = getFirestoreSyncAdapter();
        const players = Object.values(presenceData);
        const hostPlayer = players.find(p => p.slot === 1);
        const guestPlayer = players.find(p => p.slot === 2);

        if (!hostPlayer || !guestPlayer) {
          console.warn('[Online] Cannot start new round without two players');
          return;
        }

        // Get images for the pack, filtered by pair count if specified
        const allPackImages = getPackImagesById(options.pack);
        const pairCount = options.pairCount || 20;
        const imagesToUse = pairCount < allPackImages.length
          ? allPackImages.sort(() => Math.random() - 0.5).slice(0, pairCount)
          : allPackImages;

        const cards = initializeCards(imagesToUse);
        // Player info is stored in presence data, not game state
        const initialState = createInitialState(options.firstPlayer);
        const nextState = startGameWithCards(initialState, cards);

        // Increment gameRound for new game - read current round from online game state
        const currentGameRound = (onlineGame.gameState as OnlineGameState)?.gameRound || 0;
        const newGameRound = currentGameRound + 1;

        // Create online state with incremented gameRound
        const onlineState: OnlineGameState = {
          ...nextState,
          syncVersion: 1, // Reset sync version for new game
          gameRound: newGameRound,
          lastUpdatedBy: 1, // Host is always slot 1
        };

        await adapter.setState(onlineState);

        // Update local game state and refs so host's subsequent actions use correct gameRound
        // This is critical - without this, the host's card flips would send gameRound: 0
        onlineGame.setFullGameState(onlineState);

        const configUpdates: { cardPack?: CardPack; background?: string; cardBack?: string; pairCount?: number } = {};
        if (room.config?.cardPack !== options.pack) configUpdates.cardPack = options.pack;
        if (room.config?.background !== options.background) configUpdates.background = options.background;
        if (room.config?.cardBack !== options.cardBack) configUpdates.cardBack = options.cardBack;
        if (room.config?.pairCount !== pairCount) configUpdates.pairCount = pairCount;
        if (Object.keys(configUpdates).length > 0) {
          await updateRoomConfig(configUpdates);
        }
      } catch (error) {
        console.error('Failed to start online round', error);
      }
    },
    [roomCode, room, isHost, getPackImagesById, updateRoomConfig, presenceData, onlineGame]
  );

  // Select which game interface to use based on mode
  // In online mode: use onlineGame for state/actions, localGame for settings
  const isOnlineMode = gameMode === 'online' && roomCode && localPlayerSlot !== null;

  // Disconnect detection for online mode
  const disconnectState = useOpponentDisconnect({ timeoutSeconds: 60 });

  const gameState = isOnlineMode ? onlineGame.gameState : localGame.gameState;

  // Derive players from presence data (online) or settings (local)
  const players = useMemo(() => {
    if (isOnlineMode) {
      return getPlayersFromPresence(presenceData);
    }
    return localGame.players;
  }, [isOnlineMode, presenceData, localGame.players]);

  // Derive winner/isTie from game state when game is finished
  const { winner, isTie } = useMemo(() => {
    if (gameState.gameStatus === 'finished') {
      return calculateWinner(gameState.cards, players);
    }
    return { winner: null, isTie: false };
  }, [gameState.gameStatus, gameState.cards, players]);

  // Navigate to game-over route when game finishes
  useEffect(() => {
    if (gameState.gameStatus === 'finished' && currentPath !== '/game-over') {
      sessionStorage.setItem('appNavigation', 'true');
      navigate({ to: '/game-over' });
    }
  }, [gameState.gameStatus, currentPath, navigate]);

  // Navigate to game route when game starts playing (handles guest receiving replay from host)
  useEffect(() => {
    if (isOnlineMode && gameState.gameStatus === 'playing' && gameState.cards.length > 0 && currentPath === '/game-over') {
      console.log('[GAME STATUS] Game is playing while on game-over route - navigating to game');
      sessionStorage.setItem('appNavigation', 'true');
      navigate({ to: '/online/game' });
    }
  }, [isOnlineMode, gameState.gameStatus, gameState.cards.length, currentPath, navigate]);

  // Set game mode based on current route
  useEffect(() => {
    if (currentPath.startsWith('/local')) {
      setGameMode('local');
    } else if (currentPath.startsWith('/online')) {
      setGameMode('online');
    } else if (currentPath === '/') {
      // Don't reset gameMode on home - let user choose
    }
  }, [currentPath]);

  // Route guards: Redirect if trying to access game routes without setup
  // Skip if a refresh redirect is already in progress
  useEffect(() => {
    if (isRefreshRedirectingRef.current) {
      return;
    }

    if (currentPath === '/local/game' && gameState.cards.length === 0 && gameState.gameStatus !== 'playing') {
      // No cards and not playing - redirect to theme selection
      sessionStorage.setItem('appNavigation', 'true');
      navigate({ to: '/local/theme' });
    }
    if (currentPath === '/online/game' && !roomCode) {
      // No room code - redirect to online lobby
      sessionStorage.setItem('appNavigation', 'true');
      navigate({ to: '/online' });
    }

    // Online route guards
    if (currentPath === '/online/waiting' && !roomCode) {
      // On waiting room but no room code - redirect to choice
      sessionStorage.setItem('appNavigation', 'true');
      navigate({ to: '/online' });
    }
    if ((currentPath === '/online/create' || currentPath === '/online/join') && roomCode) {
      // Room already created/joined - redirect to waiting room
      sessionStorage.setItem('appNavigation', 'true');
      navigate({ to: '/online/waiting' });
    }
  }, [currentPath, gameState.cards.length, gameState.gameStatus, roomCode, navigate]);

  // Navigate to waiting room when room status changes to 'waiting' during online game
  // This handles the case where host clicks "New Game" - guest is taken back to waiting room
  useEffect(() => {
    if (currentPath === '/online/game' && room?.status === 'waiting') {
      console.log('[ROOM STATUS] Room status is waiting while on game route - navigating to waiting room');
      sessionStorage.setItem('appNavigation', 'true');
      navigate({ to: '/online/waiting' });
    }
  }, [currentPath, room?.status, navigate]);

  // Get opponent's odahId for cursor sync
  const opponentOdahId = useMemo(() => {
    if (!odahId) return null;
    const opponentEntry = Object.entries(presenceData).find(([id]) => id !== odahId);
    return opponentEntry ? opponentEntry[0] : null;
  }, [presenceData, odahId]);

  // Get opponent's player info for cursor display
  const opponentInfo = useMemo(() => {
    if (!opponentOdahId) return null;
    const opponentPresence = presenceData[opponentOdahId];
    if (!opponentPresence) return null;
    return {
      name: opponentPresence.name,
      color: opponentPresence.color,
    };
  }, [presenceData, opponentOdahId]);

  // Subscribe to presence during online gameplay
  // OnlineLobby handles presence in the waiting room, but unmounts when game starts
  // This subscription takes over to track presence during the actual game
  useEffect(() => {
    // Only subscribe when we're actively playing an online game
    // During waiting room phase, OnlineLobby handles the subscription
    const shouldSubscribe = isOnlineMode && roomCode && gameState.gameStatus === 'playing';

    if (!shouldSubscribe) return;

    console.log('[App] Subscribing to presence for gameplay, room:', roomCode);
    const unsubPresence = subscribeToPresence(roomCode);

    return () => {
      console.log('[App] Unsubscribing from gameplay presence');
      unsubPresence();
    };
  }, [isOnlineMode, roomCode, gameState.gameStatus, subscribeToPresence]);
  const setFullGameState = isOnlineMode ? onlineGame.setFullGameState : localGame.setFullGameState;
  const flipCard = isOnlineMode ? onlineGame.flipCard : localGame.flipCard;
  const endTurn = isOnlineMode ? onlineGame.endTurn : localGame.endTurn;
  const toggleAllCardsAdmin = isOnlineMode ? onlineGame.toggleAllCardsFlipped : localGame.toggleAllCardsFlipped;
  const endGameEarly = isOnlineMode ? onlineGame.endGameEarly : localGame.endGameEarly;
  const triggerGameFinish = isOnlineMode ? onlineGame.triggerGameFinish : localGame.triggerGameFinish;

  // Settings and game functions come from useLocalGame (unified hook)
  const {
    // Settings
    cardSize, autoSizeEnabled, useWhiteCardBackground, flipDuration, emojiSizePercentage, ttsEnabled,
    // Settings actions
    increaseCardSize, decreaseCardSize,
    toggleWhiteCardBackground, toggleAutoSize, increaseFlipDuration, decreaseFlipDuration,
    increaseEmojiSize, decreaseEmojiSize, toggleTtsEnabled,
    updatePlayerName, updatePlayerColor,
    // Layout
    updateAutoSizeMetrics, calculateOptimalCardSizeForCount,
    // Game actions
    initializeGame, startGameWithFirstPlayer, resetGame, isAnimatingCards,
  } = localGame;

  // Cursor sync for online mode - only active during gameplay
  const cursorSyncEnabled = Boolean(isOnlineMode && gameState.gameStatus === 'playing');
  const { opponentCursor, handleMouseMove: handleCursorMove, handleMouseLeave: handleCursorLeave } = useCursorSync({
    roomCode: roomCode || '',
    localOdahId: odahId || '',
    opponentOdahId,
    enabled: cursorSyncEnabled,
    cardSize,
  });

  // Build remote cursor data for GameBoard
  const remoteCursorData = useMemo(() => {
    if (!opponentCursor || !opponentInfo) return null;
    return {
      position: opponentCursor,
      playerName: opponentInfo.name,
      playerColor: opponentInfo.color,
    };
  }, [opponentCursor, opponentInfo]);

  const getActiveConfig = useCallback(() => {
    if (isOnlineMode) {
      return {
        pack: (room?.config?.cardPack as CardPack) || selectedPack,
        background: (room?.config?.background as BackgroundTheme) || selectedBackground,
        cardBack: (room?.config?.cardBack as CardBackType) || selectedCardBack,
      };
    }

    return {
      pack: selectedPack,
      background: selectedBackground,
      cardBack: selectedCardBack,
    };
  }, [isOnlineMode, room, selectedPack, selectedBackground, selectedCardBack]);

  const handlePlayerNameChange = useCallback(async (playerId: 1 | 2, name: string) => {
    if (isOnlineMode) {
      // In online mode, player names are managed via presence data (RTDB)
      // Only allow updating own name (verified by slot)
      if (localPlayerSlot === playerId) {
        // Update RTDB presence (syncs to other player)
        await updateOnlinePlayerName(name);
        // Also persist preference for future sessions
        setPlayerNamePreference(name);
      }
    } else {
      updatePlayerName(playerId, name);
    }
  }, [isOnlineMode, localPlayerSlot, updateOnlinePlayerName, setPlayerNamePreference, updatePlayerName]);

  // Reconciliation helper - fixes race condition where matchedByPlayerId is set but isMatched is false
  const reconcileScores = useCallback(async () => {
    const reconciledState = reconcileMatchedCards(gameState);

    // Only update if reconciliation actually changed something
    if (reconciledState !== gameState) {
      console.log('[RECONCILE] Reconciling matched cards', {
        cardsNeedingReconciliation: gameState.cards.filter(
          c => c.matchedByPlayerId !== undefined && !c.isMatched
        ).length,
      });

      if (isOnlineMode) {
        // For online mode, update state and sync to Firestore
        setFullGameState(reconciledState);

        // Manually sync to Firestore
        try {
          const adapter = getFirestoreSyncAdapter();
          const currentVersion = (reconciledState as OnlineGameState).syncVersion || 0;
          const newVersion = currentVersion + 1;
          const onlineState: OnlineGameState = {
            ...reconciledState,
            syncVersion: newVersion,
            lastUpdatedBy: localPlayerSlot || 1,
            gameRound: (reconciledState as OnlineGameState).gameRound || 0,
          };
          await adapter.setState(onlineState);
          console.log('[RECONCILE] Synced reconciled state to Firestore', { version: newVersion });
        } catch (error) {
          console.error('[RECONCILE] Failed to sync reconciled state:', error);
        }
      } else {
        // For local mode, just update state
        setFullGameState(reconciledState);
      }
    }
  }, [gameState, isOnlineMode, setFullGameState, localPlayerSlot]);

  // Handler for opening player matches modal - reconciles before opening
  const handleOpenPlayerMatches = useCallback((playerId: number) => {
    reconcileScores();
    setSelectedPlayerForMatches(playerId);
  }, [reconcileScores]);

  const boardWrapperRef = useRef<HTMLDivElement>(null);
  const scoreboardRef = useRef<HTMLDivElement>(null);
  const gameBoardContainerRef = useRef<HTMLDivElement>(null);
  const layoutMeasureRafRef = useRef<number | null>(null);

  // Long-press detection for background viewer during gameplay
  const longPressTimerRef = useRef<number | null>(null);
  const longPressStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const LONG_PRESS_DURATION = 1000;
  const LONG_PRESS_MOVE_THRESHOLD = 10; // pixels - cancel if moved more than this

  const handleBackgroundLongPressStart = useCallback((clientX: number, clientY: number) => {
    // Only enable during gameplay
    if (gameState.gameStatus !== 'playing') return;

    // Clear any existing timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // Store starting position to detect movement
    longPressStartPosRef.current = { x: clientX, y: clientY };

    // Start the long press timer
    longPressTimerRef.current = window.setTimeout(() => {
      setShowBackgroundViewer(true);
      longPressTimerRef.current = null;
      longPressStartPosRef.current = null;
    }, LONG_PRESS_DURATION);
  }, [gameState.gameStatus]);

  const handleBackgroundLongPressEnd = useCallback(() => {
    // Cancel the long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressStartPosRef.current = null;
  }, []);

  const handleBackgroundLongPressMove = useCallback((clientX: number, clientY: number) => {
    // If no long press in progress, ignore
    if (!longPressStartPosRef.current || !longPressTimerRef.current) return;

    // Calculate movement distance
    const dx = clientX - longPressStartPosRef.current.x;
    const dy = clientY - longPressStartPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Cancel if moved too much
    if (distance > LONG_PRESS_MOVE_THRESHOLD) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      longPressStartPosRef.current = null;
    }
  }, []);

  // Clean up long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Document-level event listeners for long-press background viewer
  // Only active during gameplay, ignores clicks on interactive elements
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return;

    const isInteractiveElement = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      // Check if target or any ancestor is an interactive element
      const interactiveSelectors = 'button, a, input, textarea, [role="button"], [data-card], .card-container';
      return target.closest(interactiveSelectors) !== null;
    };

    const handleDocumentMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      if (isInteractiveElement(e.target)) return; // Ignore interactive elements
      handleBackgroundLongPressStart(e.clientX, e.clientY);
    };

    const handleDocumentMouseUp = () => {
      handleBackgroundLongPressEnd();
    };

    const handleDocumentMouseMove = (e: MouseEvent) => {
      handleBackgroundLongPressMove(e.clientX, e.clientY);
    };

    const handleDocumentTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (isInteractiveElement(e.target)) return; // Ignore interactive elements
      handleBackgroundLongPressStart(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleDocumentTouchEnd = () => {
      handleBackgroundLongPressEnd();
    };

    const handleDocumentTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleBackgroundLongPressMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    document.addEventListener('mouseup', handleDocumentMouseUp);
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('touchstart', handleDocumentTouchStart);
    document.addEventListener('touchend', handleDocumentTouchEnd);
    document.addEventListener('touchmove', handleDocumentTouchMove);

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('touchstart', handleDocumentTouchStart);
      document.removeEventListener('touchend', handleDocumentTouchEnd);
      document.removeEventListener('touchmove', handleDocumentTouchMove);
    };
  }, [gameState.gameStatus, handleBackgroundLongPressStart, handleBackgroundLongPressEnd, handleBackgroundLongPressMove]);

  // Helper function to navigate to setup steps
  const navigateToStep = useCallback((step: SetupStep, reason: string) => {
    setupWizardLog('Navigating to step', { to: step, reason });

    // Set navigation flag to indicate this is programmatic navigation, not a refresh
    sessionStorage.setItem('appNavigation', 'true');

    if (step === null) {
      // Handle closing wizard - navigate based on game state
      if (gameState.gameStatus === 'playing') {
        // If closing wizard and game is playing, navigate to game route
        navigate({ to: gameMode === 'online' ? '/online/game' : '/local/game' });
      } else if (gameState.gameStatus === 'finished') {
        // If closing wizard and game is finished, navigate to game over
        navigate({ to: '/game-over' });
      } else {
        // Default: go to home
        navigate({ to: '/' });
        // Clear flag when navigating to home
        sessionStorage.removeItem('appNavigation');
      }
      return;
    }

    const routeMap: Record<Exclude<SetupStep, null>, string> = {
      modeSelect: '/',
      theme: '/local/theme',
      cardPack: '/local/card-pack',
      background: '/local/background',
      cardBack: '/local/card-back',
      pairCount: '/local/pair-count',
      startGame: '/local/start',
    };

    const targetRoute = routeMap[step];
    if (targetRoute) {
      if (targetRoute === '/') {
        // Clear flag when navigating to home
        sessionStorage.removeItem('appNavigation');
      }
      navigate({ to: targetRoute as '/' | '/local/theme' | '/local/card-pack' | '/local/background' | '/local/card-back' | '/local/pair-count' | '/local/start' });
    }
  }, [navigate, gameState.gameStatus, gameMode]);

  // Clear game state on page refresh - restart from scratch
  // But keep player preferences (names, colors, firstPlayer) and deck options
  useEffect(() => {
    // Clear sessionStorage game state
    sessionStorage.removeItem('gameState');
    sessionStorage.removeItem('setupStep');
    sessionStorage.removeItem('mobileWarningDismissed');

    // Note: We keep localStorage items for player names, colors, firstPlayer
    // and card pack/background/cardBack preferences - only game state is cleared

    console.log('[REFRESH] Cleared game state from storage (kept player preferences)');
  }, []); // Run once on mount

  // Check if screen is mobile-sized (< 768px)
  const isMobileScreen = () => {
    return window.innerWidth < 768;
  };

  // Check if device is an iPad
  const isIPad = () => {
    const ua = navigator.userAgent.toLowerCase();
    // Check for iPad in user agent (older iPads)
    if (ua.includes('ipad')) {
      return true;
    }
    // Check for newer iPads that report as Mac but have touch support
    if (ua.includes('macintosh') && 'ontouchend' in document) {
      return true;
    }
    return false;
  };

  // Check if app is running as a PWA (standalone mode)
  const isRunningAsPWA = () => {
    // Check for standalone display mode (standard PWA detection)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    // iOS Safari specific check
    if ('standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true) {
      return true;
    }
    return false;
  };

  // Check on mount if iPad and show PWA install modal
  useEffect(() => {
    // Don't show modal if already running as PWA
    if (isRunningAsPWA()) {
      return;
    }

    if (isIPad()) {
      const pwaInstallDismissed = localStorage.getItem('pwaInstallDismissed');
      if (!pwaInstallDismissed) {
        // Small delay to ensure page is loaded
        setTimeout(() => {
          setShowPWAInstall(true);
        }, 500);
      }
    }
  }, []);

  const handlePWAInstallClose = () => {
    setShowPWAInstall(false);
    localStorage.setItem('pwaInstallDismissed', 'true');
  };

  const handleShowPWAInstall = () => {
    setShowPWAInstall(true);
  };

  // Show mobile warning when game starts if on mobile
  useEffect(() => {
    if (gameState.gameStatus === 'playing' && gameState.cards.length > 0) {
      // Check if user has already dismissed the warning this session
      const warningDismissed = sessionStorage.getItem('mobileWarningDismissed');
      if (!warningDismissed && isMobileScreen()) {
        setShowMobileWarning(true);
      }
    }
  }, [gameState.gameStatus, gameState.cards.length]);

  // Also check when auto-size is enabled
  useEffect(() => {
    if (autoSizeEnabled && isMobileScreen()) {
      const warningDismissed = sessionStorage.getItem('mobileWarningDismissed');
      if (!warningDismissed) {
        setShowMobileWarning(true);
      }
    }
  }, [autoSizeEnabled]);

  // Check on window resize if auto-size is enabled
  useEffect(() => {
    if (!autoSizeEnabled) return;

    const handleResize = () => {
      const warningDismissed = sessionStorage.getItem('mobileWarningDismissed');
      if (!warningDismissed && isMobileScreen() && gameState.cards.length > 0) {
        setShowMobileWarning(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [autoSizeEnabled, gameState.cards.length]);

  const handleMobileWarningClose = () => {
    setShowMobileWarning(false);
    // Remember that user dismissed it for this session
    sessionStorage.setItem('mobileWarningDismissed', 'true');
  };

  // Calculate card size immediately when pack is selected or auto-size is enabled
  // This happens before cards are created, ensuring correct size from the start
  useEffect(() => {
    if (!autoSizeEnabled || gameState.cards.length > 0) {
      // Don't calculate if auto-size is disabled or game is already in progress
      return;
    }

    // Get card count from selected pack
    const images = getCurrentPackImages();
    const cardCount = images.length * 2; // Each image becomes a pair

    if (cardCount > 0) {
      calculateOptimalCardSizeForCount(cardCount);
    }
  }, [selectedPack, autoSizeEnabled, getCurrentPackImages, calculateOptimalCardSizeForCount, gameState.cards.length]);

  const computeLayoutMetrics = useCallback(() => {
    if (!autoSizeEnabled) {
      const emptyMetrics = { boardWidth: 0, boardAvailableHeight: 0, scoreboardHeight: 0 };
      updateAutoSizeMetrics(emptyMetrics);
      return emptyMetrics;
    }

    const wrapperWidth = boardWrapperRef.current?.getBoundingClientRect().width ?? 0;
    const scoreboardHeight = scoreboardRef.current?.getBoundingClientRect().height ?? 0;
    const boardRect = gameBoardContainerRef.current?.getBoundingClientRect();
    const bottomPadding = 24;
    const boardAvailableHeight = boardRect
      ? Math.max(window.innerHeight - boardRect.top - bottomPadding, 0)
      : Math.max(window.innerHeight - (scoreboardHeight + bottomPadding), 0);

    const metrics = {
      boardWidth: wrapperWidth,
      boardAvailableHeight,
      scoreboardHeight
    };

    // Update state for future use
    updateAutoSizeMetrics(metrics);

    // Return metrics synchronously for immediate use
    return metrics;
  }, [autoSizeEnabled, updateAutoSizeMetrics]);

  useEffect(() => {
    if (!autoSizeEnabled) {
      updateAutoSizeMetrics({ boardWidth: 0, boardAvailableHeight: 0, scoreboardHeight: 0 });
      return;
    }

    const triggerMeasure = () => {
      if (layoutMeasureRafRef.current) {
        cancelAnimationFrame(layoutMeasureRafRef.current);
      }
      layoutMeasureRafRef.current = requestAnimationFrame(() => {
        computeLayoutMetrics();
      });
    };

    triggerMeasure();

    const resizeObserver = new ResizeObserver(triggerMeasure);
    if (boardWrapperRef.current) resizeObserver.observe(boardWrapperRef.current);
    if (scoreboardRef.current) resizeObserver.observe(scoreboardRef.current);
    if (gameBoardContainerRef.current) resizeObserver.observe(gameBoardContainerRef.current);

    window.addEventListener('resize', triggerMeasure);

    return () => {
      if (layoutMeasureRafRef.current) {
        cancelAnimationFrame(layoutMeasureRafRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', triggerMeasure);
    };
  }, [autoSizeEnabled, computeLayoutMetrics, updateAutoSizeMetrics]);

  // Auto-size when cards appear (works for both local and online modes)
  // This is needed because useLocalGame's internal effect only sees its own gameState,
  // but in online mode the cards are in onlineGame.gameState
  useEffect(() => {
    if (!autoSizeEnabled || gameState.cards.length === 0) {
      return;
    }

    // Increased delay to ensure layout is rendered, especially for guests joining online games
    // Use requestAnimationFrame to ensure DOM is ready before measuring
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        // Double-check refs are attached before computing metrics
        if (boardWrapperRef.current && scoreboardRef.current && gameBoardContainerRef.current) {
          const metrics = computeLayoutMetrics();
          calculateOptimalCardSizeForCount(gameState.cards.length, metrics);
        } else {
          // Fallback: try again after another frame if refs aren't ready
          requestAnimationFrame(() => {
            const metrics = computeLayoutMetrics();
            calculateOptimalCardSizeForCount(gameState.cards.length, metrics);
          });
        }
      });
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [autoSizeEnabled, gameState.cards.length, computeLayoutMetrics, calculateOptimalCardSizeForCount]);

  // Detect turn switches and trigger glow effect
  useEffect(() => {
    if (gameState.gameStatus === 'playing' && gameState.currentPlayer !== prevCurrentPlayerRef.current) {
      // Only trigger glow if there was a previous player (not on initial game start)
      if (prevCurrentPlayerRef.current !== null) {
        console.log('[GLOW] Triggering glow for player', gameState.currentPlayer, 'from', prevCurrentPlayerRef.current);
        setGlowingPlayer(gameState.currentPlayer);
        // Clear glow after animation completes (1 second)
        const timer = setTimeout(() => {
          setGlowingPlayer(null);
        }, 1000);
        // Update ref after setting glow
        prevCurrentPlayerRef.current = gameState.currentPlayer;
        return () => clearTimeout(timer);
      }
      // Update ref even when not showing glow (initial game start)
      prevCurrentPlayerRef.current = gameState.currentPlayer;
    }

    // Reset glow when game status changes
    if (gameState.gameStatus !== 'playing') {
      setGlowingPlayer(null);
      prevCurrentPlayerRef.current = null;
    }
  }, [gameState.currentPlayer, gameState.gameStatus]);

  // Reconcile scores when total matches pair count (game complete) - fixes race condition
  useEffect(() => {
    if (gameState.gameStatus === 'playing' && gameState.cards.length > 0) {
      const player1Score = getPlayerScore(gameState.cards, 1);
      const player2Score = getPlayerScore(gameState.cards, 2);
      const totalScore = player1Score + player2Score;
      const expectedPairCount = gameState.cards.length / 2;

      if (totalScore === expectedPairCount) {
        console.log(`[RECONCILE] Total score reached ${expectedPairCount} (game complete), reconciling matched cards`);
        reconcileScores();
      }
    }
  }, [gameState.cards, gameState.gameStatus, reconcileScores]);

  // Handle replay initialization when pack changes
  useEffect(() => {
    if (isReplaying && lastConfig && selectedPack === lastConfig.pack) {
      // Use the stored pair count to get the same number of cards
      const images = getPackImagesForPairCount(lastConfig.pairCount);
      initializeGame(images, true);
      startGameWithFirstPlayer(lastConfig.firstPlayer);
      setIsReplaying(false);
      // Navigate to game route for local mode replay
      sessionStorage.setItem('appNavigation', 'true');
      navigate({ to: '/local/game' });
    }
  }, [selectedPack, isReplaying, lastConfig, getPackImagesForPairCount, initializeGame, startGameWithFirstPlayer, navigate]);

  // Welcome screen shows when no cards exist and setupStep is null
  // User must click "Start Game" to begin setup flow

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(screenfull.isFullscreen);
    };

    if (screenfull.isEnabled) {
      screenfull.on('change', handleFullscreenChange);
      return () => {
        screenfull.off('change', handleFullscreenChange);
      };
    }
  }, []);

  // Prevent scrolling when in fullscreen mode
  useEffect(() => {
    if (!isFullscreen) {
      // Restore normal scrolling when exiting fullscreen
      document.documentElement.style.position = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.width = '';
      document.documentElement.style.height = '';
      document.body.style.position = '';
      document.body.style.overflow = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
      return;
    }

    // Prevent scrolling in fullscreen
    const html = document.documentElement;
    const body = document.body;

    // Store original values
    const scrollY = window.scrollY;

    // Apply styles to prevent scrolling
    html.style.position = 'fixed';
    html.style.overflow = 'hidden';
    html.style.width = '100%';
    html.style.height = '100%';
    html.style.top = `-${scrollY}px`;

    body.style.position = 'fixed';
    body.style.overflow = 'hidden';
    body.style.width = '100%';
    body.style.height = '100%';
    body.style.top = `-${scrollY}px`;
    body.style.touchAction = 'none';

    // Prevent touchmove events that could cause scrolling (except on interactive elements)
    const preventScroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      // Allow touchmove on cards and other interactive elements
      if (target.closest('[data-allow-touchmove]') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('[role="button"]')) {
        return;
      }
      e.preventDefault();
    };

    document.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      // Restore scrolling
      html.style.position = '';
      html.style.overflow = '';
      html.style.width = '';
      html.style.height = '';
      html.style.top = '';

      body.style.position = '';
      body.style.overflow = '';
      body.style.width = '';
      body.style.height = '';
      body.style.top = '';
      body.style.touchAction = '';

      // Restore scroll position
      window.scrollTo(0, scrollY);

      document.removeEventListener('touchmove', preventScroll);
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (screenfull.isEnabled) {
      screenfull.toggle();
    }
  };

  const handleThemeSelect = (theme: GameTheme) => {
    // Apply theme settings
    setSelectedPack(theme.cardPack as CardPack);
    setSelectedBackground(theme.background as BackgroundTheme);
    setSelectedCardBack(theme.cardBack as CardBackType);
    setCameFromTheme(true); // Mark that we came from theme selection
    // Go to pair count selection before start game
    navigateToStep('pairCount', 'theme selected');
  };

  const handleBuildCustom = () => {
    setCameFromTheme(false); // Mark that we're building custom
    // Continue to card pack selection
    navigateToStep('cardPack', 'build custom selected');
  };

  const handlePackChange = (newPack: string) => {
    setSelectedPack(newPack as CardPack);
    navigateToStep('background', 'pack selected');
  };

  const handleBackgroundChange = (newBackground: BackgroundTheme) => {
    setSelectedBackground(newBackground);
    navigateToStep('cardBack', 'background selected');
  };

  const handleCardBackChange = (newCardBack: CardBackType) => {
    setSelectedCardBack(newCardBack);
    setCameFromTheme(false); // Mark that we came from custom build flow
    navigateToStep('pairCount', 'card back selected');
  };

  const handlePairCountChange = (count: number) => {
    // Store pair count based on game mode
    if (gameMode === 'online') {
      setOnlinePairCount(count);
    } else {
      setLocalPairCount(count);
    }
    navigateToStep('startGame', 'pair count selected');
  };

  const handlePairCountModalBack = () => {
    if (cameFromTheme) {
      navigateToStep('theme', 'back button from pair count modal (from theme)');
    } else {
      navigateToStep('cardBack', 'back button from pair count modal (from custom)');
    }
  };

  const handleResetClick = () => {
    const activeConfig = getActiveConfig();

    // Get pair count from current game's card count
    const currentPairCount = Math.floor(gameState.cards.length / 2);

    // Store current configuration as last config
    setLastConfig({
      ...activeConfig,
      firstPlayer: gameState.currentPlayer,
      pairCount: currentPairCount,
    });
    setShowResetConfirmation(true);
  };

  const handleReplay = useCallback(async () => {
    if (isOnlineMode) {
      setShowResetConfirmation(false);
      if (!isHost) {
        console.warn('[Online] Only the host can restart the game');
        return;
      }

      const activeConfig = getActiveConfig();
      // Get pair count from lastConfig, room config, or fallback to current game's card count
      const currentPairCount = lastConfig?.pairCount || room?.config?.pairCount || Math.floor(gameState.cards.length / 2) || 20;
      const configSource = lastConfig || {
        ...activeConfig,
        firstPlayer: (onlineGame.gameState?.currentPlayer as 1 | 2) || 1,
        pairCount: currentPairCount,
      };

      const normalizedConfig = {
        pack: configSource.pack as CardPack,
        background: configSource.background,
        cardBack: configSource.cardBack,
        firstPlayer: (configSource.firstPlayer === 2 ? 2 : 1) as 1 | 2,
        pairCount: configSource.pairCount,
      };

      await startOnlineRound(normalizedConfig);
      setLastConfig({
        pack: normalizedConfig.pack,
        background: normalizedConfig.background,
        cardBack: normalizedConfig.cardBack,
        firstPlayer: normalizedConfig.firstPlayer,
        pairCount: normalizedConfig.pairCount,
      });
      // Navigate to game route for online mode replay
      sessionStorage.setItem('appNavigation', 'true');
      navigate({ to: '/online/game' });
      return;
    }

    if (!lastConfig) return;

    resetGame();
    setSelectedPack(lastConfig.pack);
    setSelectedBackground(lastConfig.background);
    setSelectedCardBack(lastConfig.cardBack);
    setShowResetConfirmation(false);
    setIsReplaying(true);
  }, [isOnlineMode, isHost, lastConfig, room, startOnlineRound, resetGame, getActiveConfig, setSelectedPack, setSelectedBackground, setSelectedCardBack, gameState.cards.length, onlineGame.gameState?.currentPlayer, navigate]);

  const handleNewGame = async () => {
    // Close reset confirmation modal
    setShowResetConfirmation(false);

    // Reset game state - explicitly set to setup state
    resetGame();
    setFullGameState({
      cards: [],
      currentPlayer: gameState.currentPlayer, // Keep current player preference
      gameStatus: 'setup',
    });

    // Handle online mode differently - navigate to waiting room where host can change settings
    if (isOnlineMode) {
      // Reset room status to 'waiting' so the waiting room shows configuration UI
      // instead of auto-transitioning back to game
      if (isHost) {
        try {
          await resetRoomToWaiting();
        } catch (error) {
          console.error('Failed to reset room status:', error);
        }
      }
      sessionStorage.setItem('appNavigation', 'true');
      navigate({ to: '/online/waiting' });
      return;
    }

    // Local mode: Start new game setup flow using the current game configuration as the baseline
    const activeConfig = getActiveConfig();

    setOriginalPack(activeConfig.pack);
    setOriginalBackground(activeConfig.background);
    setOriginalCardBack(activeConfig.cardBack);

    if (selectedPack !== activeConfig.pack) {
      setSelectedPack(activeConfig.pack);
    }
    if (selectedBackground !== activeConfig.background) {
      setSelectedBackground(activeConfig.background);
    }
    if (selectedCardBack !== activeConfig.cardBack) {
      setSelectedCardBack(activeConfig.cardBack);
    }

    setIsResetting(true);
    setCameFromTheme(false); // Reset theme tracking
    navigateToStep('theme', 'new game clicked');
  };

  const handleBackToModeSelect = useCallback(async () => {
    // Full reset - go back to "How would you like to play?"
    setShowResetConfirmation(false);

    // If in online mode, leave the room
    if (gameMode === 'online') {
      try {
        await leaveRoom();
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    }

    // Reset all game state
    resetGame();
    setGameMode(null);
    setIsResetting(false);
    navigateToStep('modeSelect', 'back to mode select');
  }, [gameMode, leaveRoom, resetGame, navigateToStep]);

  const cancelSetupFlow = () => {
    // Restore original state if resetting
    if (isResetting) {
      if (originalPack !== null) {
        setSelectedPack(originalPack as CardPack);
      }
      if (originalBackground !== null) {
        setSelectedBackground(originalBackground);
      }
      if (originalCardBack !== null) {
        setSelectedCardBack(originalCardBack);
      }
      setIsResetting(false);
    }
    setCameFromTheme(false); // Reset theme tracking
    navigateToStep(null, 'cancel setup flow');
  };

  // Handler for leaving an online game (e.g., when opponent disconnects)
  const handleLeaveOnlineGame = useCallback(async () => {
    try {
      await leaveRoom();
    } catch (error) {
      console.error('Error leaving room:', error);
    }

    // Reset local game state
    resetGame();
    setGameMode(null);
    navigateToStep('modeSelect', 'left online game after disconnect');
  }, [leaveRoom, resetGame, navigateToStep]);

  const handleStartModalBack = () => {
    // Go back to pair count selection (always, since it's the step before startGame)
    navigateToStep('pairCount', 'back button from start modal');
  };

  const handleCardBackModalBack = () => {
    // Go back to background selection (intentional backward navigation)
    navigateToStep('background', 'back button from card back modal');
  };

  const handleBackgroundModalBack = () => {
    // Go back to card pack selection (intentional backward navigation)
    navigateToStep('cardPack', 'back button from background modal');
  };

  const handleStartGame = (firstPlayer: number) => {
    const normalizedFirstPlayer = (firstPlayer === 2 ? 2 : 1) as 1 | 2;

    // Get the appropriate pair count based on game mode
    const activePairCount = gameMode === 'online' ? onlinePairCount : localPairCount;

    if (isOnlineMode) {
      if (!isHost) {
        console.warn('[Online] Only the host can start the game');
        return;
      }

      void startOnlineRound({
        firstPlayer: normalizedFirstPlayer,
        pack: selectedPack,
        background: selectedBackground,
        cardBack: selectedCardBack,
        pairCount: activePairCount,
      });

      navigateToStep(null, 'game started');
      setIsResetting(false);
      setLastConfig({
        pack: selectedPack,
        background: selectedBackground,
        cardBack: selectedCardBack,
        firstPlayer: normalizedFirstPlayer,
        pairCount: activePairCount,
      });
      return;
    }

    // Get a random subset of images based on selected pair count
    const images = getPackImagesForPairCount(activePairCount);
    initializeGame(images, true); // true = start playing with animation
    startGameWithFirstPlayer(firstPlayer);
    // Explicitly navigate to game route for local mode
    sessionStorage.setItem('appNavigation', 'true');
    navigate({ to: '/local/game' });
    setIsResetting(false);

    if (autoSizeEnabled) {
      setTimeout(() => {
        const measuredMetrics = computeLayoutMetrics();
        console.log('[handleStartGame] Measured metrics after delay:', measuredMetrics);

        const cardCount = images.length * 2;
        if (cardCount > 0 && measuredMetrics) {
          console.log('[handleStartGame] Calculating card size with metrics for', cardCount, 'cards');
          calculateOptimalCardSizeForCount(cardCount, measuredMetrics);
        }
      }, 100);
    }

    setLastConfig({
      pack: selectedPack,
      background: selectedBackground,
      cardBack: selectedCardBack,
      firstPlayer,
      pairCount: activePairCount,
    });
  };

  // Set overflow hidden to prevent page scrolling
  // Settings sidebar will still scroll due to overflow-y-auto on its inner content
  // Skip for standalone pages (terms, privacy) that need to scroll
  const isStandalonePage = currentPath === '/terms' || currentPath === '/privacy';
  useEffect(() => {
    if (isStandalonePage) {
      // Allow scrolling on standalone pages
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isStandalonePage]);

  // Disable context menu globally
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Keyboard combo detection for Pong
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      // Handle Pong combo
      // Clear timeout if exists
      if (comboTimeoutRef.current) {
        clearTimeout(comboTimeoutRef.current);
      }

      // Add key to sequence
      comboSequenceRef.current.push(key);

      // Keep only last 5 keys
      if (comboSequenceRef.current.length > COMBO_SEQUENCE.length) {
        comboSequenceRef.current.shift();
      }

      // Check if sequence matches
      if (comboSequenceRef.current.length === COMBO_SEQUENCE.length) {
        const matches = comboSequenceRef.current.every(
          (k, i) => k === COMBO_SEQUENCE[i]
        );

        if (matches) {
          setShowPong(true);
          comboSequenceRef.current = [];
        }
      }

      // Reset sequence after 2 seconds of no keypress
      comboTimeoutRef.current = window.setTimeout(() => {
        comboSequenceRef.current = [];
      }, 2000);

      // Handle test combo (1, 2, 2, 5, 1, 2, 2, 5)
      // Clear timeout if exists
      if (testComboTimeoutRef.current) {
        clearTimeout(testComboTimeoutRef.current);
      }

      // Add key to test sequence (use exact key, not lowercase)
      const testKey = e.key;
      testComboSequenceRef.current.push(testKey);

      // Keep only last 8 keys
      if (testComboSequenceRef.current.length > TEST_COMBO_SEQUENCE.length) {
        testComboSequenceRef.current.shift();
      }

      // Check if test sequence matches
      if (testComboSequenceRef.current.length === TEST_COMBO_SEQUENCE.length) {
        const matches = testComboSequenceRef.current.every(
          (k, i) => k === TEST_COMBO_SEQUENCE[i]
        );

        if (matches) {
          setAdminEnabled(true);
          setShowAdminSidebar(true);
          testComboSequenceRef.current = [];
        }
      }

      // Reset test sequence after 5 seconds of no keypress
      testComboTimeoutRef.current = window.setTimeout(() => {
        testComboSequenceRef.current = [];
      }, 5000);
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (comboTimeoutRef.current) {
        clearTimeout(comboTimeoutRef.current);
      }
      if (testComboTimeoutRef.current) {
        clearTimeout(testComboTimeoutRef.current);
      }
    };
  }, []);

  // Note: Turn enforcement and sync are now handled inside useOnlineGame hook
  // The hook manages authority checking and Firestore sync internally

  // Get background - use room config for online mode, local settings for local mode
  const currentBackground = (() => {
    if (isOnlineMode && room?.config?.background) {
      // Find background option by room config
      const roomBg = BACKGROUND_OPTIONS.find(bg => bg.id === room.config?.background);
      if (roomBg) return roomBg;
    }
    return getCurrentBackground();
  })();

  // Get card back - use room config for online mode, local settings for local mode
  const effectiveCardBack = (() => {
    if (isOnlineMode && room?.config?.cardBack) {
      // Find card back option by room config
      const roomCb = CARD_BACK_OPTIONS.find(cb => cb.id === room.config?.cardBack);
      if (roomCb) return roomCb;
    }
    return getCurrentCardBack();
  })();

  // Only show custom background when playing the game (when cards exist)
  const shouldShowCustomBackground = gameState.cards.length > 0;
  const isPlaying = gameState.gameStatus === 'playing';

  // Calculate effective blur: use per-background override if defined, otherwise default to 2px
  const effectiveBlurAmount = currentBackground.blurAmount ?? 2;
  const shouldBlur = isPlaying && backgroundBlurEnabled && effectiveBlurAmount > 0;
  const blurFilter = shouldBlur ? `blur(${effectiveBlurAmount}px)` : 'none';

  // Background styles for the separate background layer
  const backgroundLayerStyle: React.CSSProperties = shouldShowCustomBackground && currentBackground.imageUrl
    ? {
      backgroundImage: `url(${currentBackground.imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      filter: blurFilter,
      transition: 'filter 0.3s ease',
    }
    : {
      filter: blurFilter,
      transition: 'filter 0.3s ease',
    };

  // Background class for gradient backgrounds (applied to background layer)
  const backgroundLayerClass = shouldShowCustomBackground && currentBackground.imageUrl
    ? ''
    : shouldShowCustomBackground && currentBackground.gradient
      ? `bg-gradient-to-br ${currentBackground.gradient}`
      : 'bg-rainbow-gradient'; // Rainbow gradient for welcome screen

  // Standalone pages (Terms, Privacy) are rendered by the router's Outlet
  // Return null so App doesn't render any UI for these paths
  if (currentPath === '/terms' || currentPath === '/privacy') {
    return null;
  }

  return (
    <>
      {/* Background layer - blurred during gameplay */}
      {/* Extended beyond viewport (-8) to hide blur edge artifacts */}
      <div
        className={`fixed -inset-1 -z-10 ${backgroundLayerClass}`}
        style={backgroundLayerStyle}
      />

      {/* Main content container */}
      <div className={`min-h-screen ${isPlaying ? 'pt-4' : 'py-8'}`}>
        <div className="container mx-auto px-4 max-w-full">
          {gameState.gameStatus === 'setup' ? (
            <SetupControls
              onReloadClick={() => setShowReloadConfirmation(true)}
              onToggleFullscreen={toggleFullscreen}
              onOpenSettings={() => setIsSettingsOpen(true)}
              isFullscreen={isFullscreen}
              screenfullEnabled={screenfull.isEnabled}
            />
          ) : (
            <FixedGameControls
              onResetClick={handleResetClick}
              onToggleFullscreen={toggleFullscreen}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onToggleAdmin={() => setShowAdminSidebar(!showAdminSidebar)}
              isFullscreen={isFullscreen}
              adminEnabled={adminEnabled}
              showAdminSidebar={showAdminSidebar}
              screenfullEnabled={screenfull.isEnabled}
            />
          )}

          {/* Settings Slide-over Menu - Available in both setup and gameplay */}
          <SettingsSidebarWrapper isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
            <SettingsMenu
              cardSize={cardSize}
              autoSizeEnabled={autoSizeEnabled}
              useWhiteCardBackground={useWhiteCardBackground}
              flipDuration={flipDuration}
              emojiSizePercentage={emojiSizePercentage}
              ttsEnabled={ttsEnabled}
              backgroundBlurEnabled={backgroundBlurEnabled}
              onIncreaseSize={increaseCardSize}
              onDecreaseSize={decreaseCardSize}
              onToggleAutoSize={toggleAutoSize}
              onToggleWhiteCardBackground={toggleWhiteCardBackground}
              onIncreaseFlipDuration={increaseFlipDuration}
              onDecreaseFlipDuration={decreaseFlipDuration}
              onIncreaseEmojiSize={increaseEmojiSize}
              onDecreaseEmojiSize={decreaseEmojiSize}
              onToggleTtsEnabled={toggleTtsEnabled}
              onToggleBackgroundBlur={() => setBackgroundBlurEnabled(!backgroundBlurEnabled)}
              onClose={() => setIsSettingsOpen(false)}
              onToggleFullscreen={toggleFullscreen}
              isFullscreen={isFullscreen}
              onEndTurn={endTurn}
              gameStatus={gameState.gameStatus}
              onEnableAdmin={() => {
                setAdminEnabled(true);
                setShowAdminSidebar(true);
              }}
              onShowPWAInstall={isIPad() && !isRunningAsPWA() ? handleShowPWAInstall : undefined}
              onReloadApp={() => setShowReloadConfirmation(true)}
            />
          </SettingsSidebarWrapper>

          {/* Settings Button - fixed bottom right, only visible when fullscreen is enabled */}
          <FloatingSettingsButton
            onClick={() => setIsSettingsOpen(true)}
            visible={screenfull.isEnabled}
          />

          <main>
            {/* Mode Selection Screen (merged with Welcome) */}
            {(currentPath === '/' || (setupStep === 'modeSelect' && gameMode !== 'online')) && (
              <div className="fixed inset-0 flex items-center justify-center z-0">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
                  <ModeSelector
                    onSelectMode={(mode: GameMode) => {
                      setGameMode(mode);
                      if (mode === 'local') {
                        navigateToStep('theme', 'local mode selected');
                      } else if (mode === 'online') {
                        sessionStorage.setItem('appNavigation', 'true');
                        navigate({ to: '/online' });
                      }
                      // For online mode, navigate to online route
                    }}
                  />
                </div>
              </div>
            )}

            {/* Online Lobby */}
            {(currentPath === '/online' || currentPath === '/online/create' || currentPath === '/online/join' || currentPath === '/online/waiting') && (
              <div className="flex flex-col items-center min-h-[60vh] overflow-y-auto max-h-[calc(100vh-4rem)] py-4">
                <OnlineLobby
                  onBack={() => {
                    setGameMode(null);
                    sessionStorage.removeItem('appNavigation');
                    navigate({ to: '/' });
                  }}
                  onGameStart={(onlineGameState) => {
                    // Set the game state from online lobby
                    setFullGameState(onlineGameState);
                    sessionStorage.setItem('appNavigation', 'true');
                    navigate({ to: '/online/game' });
                  }}
                />
              </div>
            )}

            {gameState.gameStatus === 'playing' && (currentPath === '/local/game' || currentPath === '/online/game') && (!isOnlineMode || room?.status === 'playing') && (
              <div ref={boardWrapperRef} className="flex flex-col gap-6 items-center w-full max-w-full">
                {/* Compact Header - Players Points and Current Player */}
                <div ref={scoreboardRef}>
                  <GameplayHeader
                    players={players}
                    currentPlayer={gameState.currentPlayer}
                    cards={gameState.cards}
                    glowingPlayer={glowingPlayer}
                    gameMode={gameMode}
                    localPlayerSlot={localPlayerSlot}
                    roomCode={roomCode}
                    isOnlineMode={Boolean(isOnlineMode)}
                    onOpenPlayerMatches={handleOpenPlayerMatches}
                  />
                </div>

                {/* Center Game Area - Full Width Below */}
                <div ref={gameBoardContainerRef} className="w-full flex justify-center">
                  <GameBoard
                    cards={gameState.cards}
                    onCardClick={flipCard}
                    cardSize={cardSize}
                    isAnimating={isAnimatingCards}
                    useWhiteCardBackground={useWhiteCardBackground}
                    emojiSizePercentage={emojiSizePercentage}
                    cardBack={effectiveCardBack}
                    onCursorMove={cursorSyncEnabled ? handleCursorMove : undefined}
                    onCursorLeave={cursorSyncEnabled ? handleCursorLeave : undefined}
                    remoteCursor={remoteCursorData}
                    onLastMatchAnimationComplete={triggerGameFinish}
                  />
                </div>
              </div>
            )}
          </main>

          {/* Opponent Disconnect Overlay - Online Mode Only */}
          {isOnlineMode && gameState.gameStatus === 'playing' && disconnectState.isDisconnected && (
            <OpponentDisconnectOverlay
              isVisible={true}
              opponentName={disconnectState.opponentName}
              secondsRemaining={disconnectState.secondsRemaining}
              onLeaveGame={handleLeaveOnlineGame}
            />
          )}

          {gameState.gameStatus === 'finished' && currentPath === '/game-over' && (winner !== null || isTie === true) && (
            <GameOver
              winner={winner}
              players={players}
              cards={gameState.cards}
              isTie={isTie}
              onPlayAgain={handleResetClick}
              onExploreCards={() => setShowCardExplorer(true)}
              onViewBackground={() => setShowBackgroundViewer(true)}
              onClose={() => {
                resetGame();
                navigateToStep(null, 'game over close');
              }}
              isOnlineMode={Boolean(isOnlineMode)}
              isHost={isHost}
              onLeaveGame={handleLeaveOnlineGame}
            />
          )}

          {/* Reset Confirmation Modal */}
          <Modal
            isOpen={showResetConfirmation}
            onClose={() => setShowResetConfirmation(false)}
            title="Reset Game"
          >
            <ResetConfirmationModal
              onReplay={handleReplay}
              onNewGame={handleNewGame}
              onChangeMode={handleBackToModeSelect}
              onCancel={() => setShowResetConfirmation(false)}
              isOnlineMode={Boolean(isOnlineMode)}
              isHost={isHost}
            />
          </Modal>

          {/* Reload App Confirmation Modal */}
          <Modal
            isOpen={showReloadConfirmation}
            onClose={() => setShowReloadConfirmation(false)}
            title="Reload App"
          >
            <ReloadConfirmationModal
              onCancel={() => setShowReloadConfirmation(false)}
              onConfirm={() => window.location.reload()}
            />
          </Modal>

          {/* Game Start Modal */}
          <Modal
            isOpen={setupStep === 'startGame' && currentPath === '/local/start'}
            onClose={cancelSetupFlow}
            onBack={handleStartModalBack}
            title={cameFromTheme ? "Step 3: Who Goes First?" : (isResetting ? "Step 5: Who Goes First?" : "Step 6: Who Goes First?")}
          >
            <GameStartModal
              players={players}
              currentPlayer={gameState.currentPlayer}
              onStartGame={handleStartGame}
              onPlayerNameChange={handlePlayerNameChange}
              onPlayerColorChange={updatePlayerColor}
              onBack={handleStartModalBack}
              isResetting={isResetting}
            />
          </Modal>

          {/* Theme Selector Modal */}
          <Modal
            isOpen={setupStep === 'theme' && currentPath === '/local/theme'}
            onClose={cancelSetupFlow}
            onBack={() => {
              navigateToStep('modeSelect', 'back button from theme modal');
            }}
            title={isResetting ? "Step 1: Choose Your Theme" : "Step 1: Choose Your Theme"}
          >
            <ThemeSelectorModal
              onSelectTheme={handleThemeSelect}
              onBuildCustom={handleBuildCustom}
              onClose={cancelSetupFlow}
            />
          </Modal>

          {/* Card Pack Modal */}
          <Modal
            isOpen={setupStep === 'cardPack' && currentPath === '/local/card-pack'}
            onClose={cancelSetupFlow}
            title={isResetting ? "Step 1: Choose Your Card Pack" : "Step 2: Choose Your Card Pack"}
          >
            <CardPackModal
              cardPacks={cardPacks}
              selectedPack={selectedPack}
              onSelect={handlePackChange}
              onClose={cancelSetupFlow}
            />
          </Modal>

          {/* Background Modal */}
          <Modal
            isOpen={setupStep === 'background' && currentPath === '/local/background'}
            onClose={cancelSetupFlow}
            onBack={handleBackgroundModalBack}
            title={isResetting ? "Step 2: Choose Your Background" : "Step 3: Choose Your Background"}
          >
            <BackgroundModal
              selectedBackground={selectedBackground}
              onSelect={(bg) => handleBackgroundChange(bg as BackgroundTheme)}
              onClose={cancelSetupFlow}
              onBack={handleBackgroundModalBack}
              isResetting={isResetting}
            />
          </Modal>

          {/* Card Back Modal */}
          <Modal
            isOpen={setupStep === 'cardBack' && currentPath === '/local/card-back'}
            onClose={cancelSetupFlow}
            onBack={handleCardBackModalBack}
            title={isResetting ? "Step 3: Choose Your Card Back" : "Step 4: Choose Your Card Back"}
          >
            <CardBackModal
              selectedCardBack={selectedCardBack}
              onSelect={(cb) => handleCardBackChange(cb as CardBackType)}
              onClose={cancelSetupFlow}
              onBack={handleCardBackModalBack}
              isResetting={isResetting}
            />
          </Modal>

          {/* Pair Count Modal */}
          <Modal
            isOpen={setupStep === 'pairCount' && currentPath === '/local/pair-count'}
            onClose={cancelSetupFlow}
            onBack={handlePairCountModalBack}
            title={cameFromTheme ? "Step 2: How Many Pairs?" : (isResetting ? "Step 4: How Many Pairs?" : "Step 5: How Many Pairs?")}
          >
            <PairCountModal
              selectedPairCount={gameMode === 'online' ? onlinePairCount : localPairCount}
              onSelect={handlePairCountChange}
              onClose={cancelSetupFlow}
            />
          </Modal>

          {/* Player Matches Modal */}
          {selectedPlayerForMatches !== null && players[selectedPlayerForMatches - 1] && (
            <PlayerMatchesModal
              isOpen={selectedPlayerForMatches !== null}
              onClose={() => setSelectedPlayerForMatches(null)}
              player={players[selectedPlayerForMatches - 1]}
              cards={gameState.cards}
              useWhiteCardBackground={useWhiteCardBackground}
              emojiSizePercentage={emojiSizePercentage}
              cardBack={effectiveCardBack}
              onPlayerNameChange={(playerId, name) => {
                handlePlayerNameChange(playerId as 1 | 2, name);
              }}
              canEditName={
                gameMode === 'local' || // Local mode: can edit both
                localPlayerSlot === 1 || // Host (slot 1): can edit both
                selectedPlayerForMatches === localPlayerSlot // Guest: can only edit own name
              }
            />
          )}

          {/* Hidden Pong Game */}
          <Pong isOpen={showPong} onClose={() => setShowPong(false)} />

          {/* Card Explorer Modal */}
          <CardExplorerModal
            isOpen={showCardExplorer}
            onClose={() => setShowCardExplorer(false)}
            cards={gameState.cards}
            useWhiteCardBackground={useWhiteCardBackground}
            emojiSizePercentage={emojiSizePercentage}
            cardBack={effectiveCardBack}
          />

          {/* Background Viewer */}
          <BackgroundViewer
            isOpen={showBackgroundViewer}
            onClose={() => setShowBackgroundViewer(false)}
            background={currentBackground}
          />

          {/* Admin Sidebar */}
          {adminEnabled && (
            <AdminSidebar
              isOpen={showAdminSidebar}
              onClose={() => setShowAdminSidebar(false)}
              onEndGameEarly={() => {
                endGameEarly();
                setShowAdminSidebar(false);
              }}
              onToggleFlipAll={toggleAllCardsAdmin}
              allCardsFlipped={
                gameState.cards.length > 0 &&
                gameState.cards
                  .filter(c => !c.isMatched)
                  .every(c => c.isFlipped)
              }
              onViewLogs={() => setShowLogViewer(true)}
            />
          )}

          {/* Log Viewer Modal */}
          <LogViewerModal
            isOpen={showLogViewer}
            onClose={() => setShowLogViewer(false)}
            roomCode={roomCode ?? undefined}
          />

          {/* Mobile Warning Modal */}
          <MobileWarningModal
            isOpen={showMobileWarning}
            onClose={handleMobileWarningClose}
          />

          {/* PWA Install Modal */}
          <PWAInstallModal
            isOpen={showPWAInstall}
            onClose={handlePWAInstallClose}
          />
        </div>
      </div>
    </>
  );
}

export default App;
