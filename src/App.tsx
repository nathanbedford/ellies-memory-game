import { useEffect, useState, useRef, useCallback } from 'react';
import { useMemoryGame } from './hooks/useMemoryGame';
import { useCardPacks } from './hooks/useCardPacks';
import { useBackgroundSelector, BackgroundTheme } from './hooks/useBackgroundSelector';
import { useCardBackSelector, CardBackType } from './hooks/useCardBackSelector';
import { CardPack } from './types';
import { GameBoard } from './components/GameBoard';
import { GameOver } from './components/GameOver';
import { Modal } from './components/Modal';
import { CardPackModal } from './components/CardPackModal';
import { BackgroundModal } from './components/BackgroundModal';
import { CardBackModal } from './components/CardBackModal';
import { GameStartModal } from './components/GameStartModal';
import { ResetConfirmationModal } from './components/ResetConfirmationModal';
import { SettingsMenu } from './components/SettingsMenu';
import { PlayerMatchesModal } from './components/PlayerMatchesModal';
import { CardExplorerModal } from './components/CardExplorerModal';
import { Pong } from './components/Pong';
import { MobileWarningModal } from './components/MobileWarningModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { AdminSidebar } from './components/AdminSidebar';
import screenfull from 'screenfull';

type SetupStep = 'cardPack' | 'background' | 'cardBack' | 'startGame' | null;

const ENABLE_SETUP_DEBUG_LOGS = true;

const setupWizardLog = (...args: unknown[]) => {
  if (!ENABLE_SETUP_DEBUG_LOGS) return;
  console.log('[Setup Wizard]', ...args);
};

const setupWizardWarn = (...args: unknown[]) => {
  if (!ENABLE_SETUP_DEBUG_LOGS) return;
  console.warn('[Setup Wizard]', ...args);
};

// Secret keyboard combo: P+P+O+N+G (press P twice, then O, N, G)
const COMBO_SEQUENCE = ['p', 'p', 'o', 'n', 'g'];
// Test combo: 1, 2, 2, 5, 1, 2, 2, 5 (to advance game to end state)
const TEST_COMBO_SEQUENCE = ['1', '2', '2', '5', '1', '2', '2', '5'];

function App() {
  const { selectedPack, setSelectedPack, getCurrentPackImages, cardPacks } = useCardPacks();
  const { gameState, cardSize, autoSizeEnabled, useWhiteCardBackground, flipDuration, emojiSizePercentage, ttsEnabled, initializeGame, startGameWithFirstPlayer, updatePlayerName, updatePlayerColor, increaseCardSize, decreaseCardSize, toggleWhiteCardBackground, toggleAutoSize, increaseFlipDuration, decreaseFlipDuration, increaseEmojiSize, decreaseEmojiSize, toggleTtsEnabled, flipCard, endTurn, resetGame, isAnimatingCards, endGameEarly, toggleAllCardsFlipped, updateAutoSizeMetrics, calculateOptimalCardSizeForCount } = useMemoryGame();
  const { selectedBackground, setSelectedBackground, getCurrentBackground } = useBackgroundSelector();
  const { selectedCardBack, setSelectedCardBack, getCurrentCardBack } = useCardBackSelector();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>(() => {
    // Only restore wizard state if no game is in progress
    const savedGameState = sessionStorage.getItem('gameState');
    if (savedGameState) {
      try {
        const parsed = JSON.parse(savedGameState);
        // If we have cards, don't restore wizard state
        if (parsed && parsed.cards && parsed.cards.length > 0) {
          return null;
        }
      } catch {
        // Invalid saved state, continue to restore wizard
      }
    }
    // Restore wizard step if no game in progress
    const saved = sessionStorage.getItem('setupStep');
    return (saved as SetupStep) || null;
  });
  const [isResetting, setIsResetting] = useState(false);
  const [originalPack, setOriginalPack] = useState<string | null>(null);
  const [originalBackground, setOriginalBackground] = useState<BackgroundTheme | null>(null);
  const [originalCardBack, setOriginalCardBack] = useState<CardBackType | null>(null);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [lastConfig, setLastConfig] = useState<{
    pack: string;
    background: BackgroundTheme;
    cardBack: CardBackType;
    firstPlayer: number;
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
  const [showAdminSidebar, setShowAdminSidebar] = useState(false);
  const [adminEnabled, setAdminEnabled] = useState(false); // In-memory only, resets on refresh
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [showPWAInstall, setShowPWAInstall] = useState(false);
  const boardWrapperRef = useRef<HTMLDivElement>(null);
  const scoreboardRef = useRef<HTMLDivElement>(null);
  const gameBoardContainerRef = useRef<HTMLDivElement>(null);
  const layoutMeasureRafRef = useRef<number | null>(null);
  
  // Track if we're in a back navigation to allow intentional backward steps
  const isBackNavigationRef = useRef(false);
  
  // Guarded setSetupStep that prevents unintended backward navigation
  const guardedSetSetupStep = useCallback((newStep: SetupStep, reason: string) => {
    const stepOrder: SetupStep[] = ['cardPack', 'background', 'cardBack', 'startGame'];
    const diagnosticBase = {
      from: setupStep,
      to: newStep,
      reason,
      isBackNavigation: isBackNavigationRef.current,
    };

    if (newStep === null) {
      setupWizardLog('Closing wizard', diagnosticBase);
      setSetupStep(null);
      sessionStorage.removeItem('setupStep');
      return;
    }

    if (setupStep === null) {
      setupWizardLog('Opening wizard', diagnosticBase);
      setSetupStep(newStep);
      sessionStorage.setItem('setupStep', newStep);
      return;
    }

    const currentIndex = stepOrder.indexOf(setupStep);
    const newIndex = stepOrder.indexOf(newStep);
    const diagnostic = {
      ...diagnosticBase,
      currentIndex,
      newIndex,
      stepOrder,
    };

    setupWizardLog('Step change requested', diagnostic);

    if (isBackNavigationRef.current) {
      setupWizardLog('Allowing backward navigation (explicit back trigger)', diagnostic);
      isBackNavigationRef.current = false;
      setSetupStep(newStep);
      sessionStorage.setItem('setupStep', newStep);
      return;
    }

    if (newIndex >= currentIndex) {
      setupWizardLog('Allowing forward navigation', diagnostic);
      setSetupStep(newStep);
      sessionStorage.setItem('setupStep', newStep);
      return;
    }

    const error = new Error('guardedSetSetupStep blocked navigation');
    setupWizardWarn('BLOCKED unintended backward navigation', {
      ...diagnostic,
      stack: error.stack,
    });
  }, [setupStep]);
  
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
    const images = getCurrentPackImages;
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

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 59, g: 130, b: 246 }; // Default blue
  };

  // Handle replay initialization when pack changes
  useEffect(() => {
    if (isReplaying && lastConfig && selectedPack === lastConfig.pack) {
      const images = getCurrentPackImages;
      initializeGame(images, true);
      startGameWithFirstPlayer(lastConfig.firstPlayer);
      setIsReplaying(false);
    }
  }, [selectedPack, isReplaying, lastConfig, getCurrentPackImages, initializeGame, startGameWithFirstPlayer]);

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

  const handlePackChange = (newPack: string) => {
    setSelectedPack(newPack as CardPack);
    guardedSetSetupStep('background', 'pack selected');
  };

  const handleBackgroundChange = (newBackground: BackgroundTheme) => {
    setSelectedBackground(newBackground);
    guardedSetSetupStep('cardBack', 'background selected');
  };

  const handleCardBackChange = (newCardBack: CardBackType) => {
    setSelectedCardBack(newCardBack);
    guardedSetSetupStep('startGame', 'card back selected');
  };

  const handleResetClick = () => {
    // Store current configuration as last config
    setLastConfig({
      pack: selectedPack,
      background: selectedBackground,
      cardBack: selectedCardBack,
      firstPlayer: gameState.currentPlayer
    });
    setShowResetConfirmation(true);
  };

  const handleReplay = () => {
    // Replay with last configuration
    if (!lastConfig) return;
    
    resetGame();
    setSelectedPack(lastConfig.pack as CardPack);
    setSelectedBackground(lastConfig.background);
    setSelectedCardBack(lastConfig.cardBack);
    setShowResetConfirmation(false);
    setIsReplaying(true);
  };

  const handleNewGame = () => {
    // Start new game setup flow
    setOriginalPack(selectedPack);
    setOriginalBackground(selectedBackground);
    setOriginalCardBack(selectedCardBack);
    setIsResetting(true);
    resetGame();
    guardedSetSetupStep('cardPack', 'new game clicked');
    setShowResetConfirmation(false);
  };

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
    guardedSetSetupStep(null, 'cancel setup flow');
  };

  const handleStartModalBack = () => {
    // Go back to card back selection (intentional backward navigation)
    isBackNavigationRef.current = true;
    guardedSetSetupStep('cardBack', 'back button from start modal');
  };

  const handleCardBackModalBack = () => {
    // Go back to background selection (intentional backward navigation)
    isBackNavigationRef.current = true;
    guardedSetSetupStep('background', 'back button from card back modal');
  };

  const handleBackgroundModalBack = () => {
    // Go back to card pack selection (intentional backward navigation)
    isBackNavigationRef.current = true;
    guardedSetSetupStep('cardPack', 'back button from background modal');
  };

  const handleStartGame = (firstPlayer: number) => {
    // Initialize game with animation and start playing
    const images = getCurrentPackImages;
    initializeGame(images, true); // true = start playing with animation
    startGameWithFirstPlayer(firstPlayer);
    guardedSetSetupStep(null, 'game started');
    setIsResetting(false);
    localStorage.setItem('hasPlayedBefore', 'true');
    
    // Measure layout metrics after modal closes and calculate card size
    // Wait 100ms for DOM elements to be fully rendered and positioned
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
    
    // Store configuration for replay
    setLastConfig({
      pack: selectedPack,
      background: selectedBackground,
      cardBack: selectedCardBack,
      firstPlayer
    });
  };

  // Set overflow hidden to prevent page scrolling
  // Settings sidebar will still scroll due to overflow-y-auto on its inner content
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

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


  const currentBackground = getCurrentBackground();
  // Only show custom background when playing the game (when cards exist)
  const shouldShowCustomBackground = gameState.cards.length > 0;
  const backgroundStyle = shouldShowCustomBackground && currentBackground.imageUrl
    ? {
        backgroundImage: `url(${currentBackground.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {};
  const backgroundClass = shouldShowCustomBackground && currentBackground.imageUrl
    ? 'min-h-screen'
    : shouldShowCustomBackground && currentBackground.gradient
    ? `min-h-screen bg-gradient-to-br ${currentBackground.gradient}`
    : 'min-h-screen bg-rainbow-gradient'; // Rainbow gradient for welcome screen

  return (
    <div className={`${backgroundClass} ${gameState.gameStatus === 'playing' ? 'pt-4' : 'py-8'}`} style={backgroundStyle}>
      <div className="container mx-auto px-4 max-w-full">
        {gameState.gameStatus === 'setup' ? (
          <header className="text-center mb-8 relative">
            {/* Fullscreen Button */}
            {screenfull.isEnabled && (
              <button
                onClick={toggleFullscreen}
                className="absolute top-0 right-0 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors duration-200"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            )}
          </header>
        ) : (
          <>
            {/* Fixed position controls */}
            {/* Left side - Reset Button */}
            <div className="fixed top-5 left-5 z-10 flex flex-col gap-2">
              <button
                onClick={handleResetClick}
                className="p-3 text-base font-semibold bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
                title="Reset Game"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              {/* Admin Toggle Button - only show if admin is enabled */}
              {adminEnabled && (
                <button
                  onClick={() => setShowAdminSidebar(!showAdminSidebar)}
                  className={`p-2 text-xs font-semibold rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 ${
                    showAdminSidebar
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-400 hover:bg-gray-500 text-white'
                  }`}
                  title={showAdminSidebar ? 'Hide Admin Panel' : 'Show Admin Panel'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Right side - Settings Button */}
            <div className="fixed top-5 right-5 z-10">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-3 text-base font-semibold bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
                title="Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            
            {/* Settings Slide-over Menu */}
            <div
              className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
                isSettingsOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
                      <SettingsMenu
                        cardSize={cardSize}
                        autoSizeEnabled={autoSizeEnabled}
                        useWhiteCardBackground={useWhiteCardBackground}
                        flipDuration={flipDuration}
                        emojiSizePercentage={emojiSizePercentage}
                        ttsEnabled={ttsEnabled}
                        onIncreaseSize={increaseCardSize}
                        onDecreaseSize={decreaseCardSize}
                        onToggleAutoSize={toggleAutoSize}
                        onToggleWhiteCardBackground={toggleWhiteCardBackground}
                        onIncreaseFlipDuration={increaseFlipDuration}
                        onDecreaseFlipDuration={decreaseFlipDuration}
                        onIncreaseEmojiSize={increaseEmojiSize}
                        onDecreaseEmojiSize={decreaseEmojiSize}
                        onToggleTtsEnabled={toggleTtsEnabled}
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
                      />
            </div>
            
            {/* Backdrop when settings menu is open */}
            {isSettingsOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setIsSettingsOpen(false)}
              />
            )}
          </>
        )}

        <main>
          {/* Welcome Screen */}
          {gameState.cards.length === 0 && setupStep === null && (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-6">
                <h2 className="text-5xl font-bold text-gray-800 mb-4">Welcome!</h2>
                <p className="text-xl text-gray-600 mb-8">Ready to play Matchimus?</p>
                <button
                  onClick={() => {
                    guardedSetSetupStep('cardPack', 'welcome screen start button');
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 text-lg shadow-lg transform hover:scale-[1.02]"
                >
                  🎮 Start Game
                </button>
              </div>
            </div>
          )}

          {gameState.gameStatus === 'playing' && (
            <div ref={boardWrapperRef} className="flex flex-col gap-6 items-center w-full max-w-full">
              {/* Compact Header - Players Points and Current Player */}
              <div ref={scoreboardRef} className="w-full max-w-2xl mx-auto">
                <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-lg shadow-lg p-3 overflow-visible">
                  <div className="flex items-center justify-between overflow-visible">
              {/* Player 1 */}
              <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                gameState.currentPlayer === 1 
                  ? 'bg-opacity-90 ring-2' 
                  : 'bg-gray-50 bg-opacity-50'
              } ${glowingPlayer === 1 ? 'player-turn-glow' : ''}`}
              style={(() => {
                const player1 = gameState.players.find(p => p.id === 1);
                const playerColor = player1?.color || '#3b82f6';
                const rgb = hexToRgb(playerColor);
                const baseStyle: React.CSSProperties & { 
                  '--tw-ring-color'?: string; 
                  '--glow-color-start'?: string;
                  '--glow-color-mid'?: string;
                  '--glow-color-outer'?: string;
                  '--glow-color-end'?: string;
                } = {};
                
                if (gameState.currentPlayer === 1) {
                  baseStyle.backgroundColor = `${playerColor}20`;
                  baseStyle['--tw-ring-color'] = playerColor;
                }
                
                // Set glow color RGB strings for CSS variables with different opacities
                baseStyle['--glow-color-start'] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
                baseStyle['--glow-color-mid'] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)`;
                baseStyle['--glow-color-outer'] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
                baseStyle['--glow-color-end'] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`;
                
                return baseStyle;
              })()}
              >
                <div className="flex items-baseline gap-2">
                  <button
                    onClick={() => setSelectedPlayerForMatches(1)}
                    className="text-3xl text-gray-600 font-medium cursor-pointer hover:opacity-75 transition-opacity"
                    title="Click to view matches"
                  >
                    {gameState.players.find(p => p.id === 1)?.name || 'Player 1'}:
                  </button>
                  <button
                    onClick={() => setSelectedPlayerForMatches(1)}
                    className={`text-3xl font-bold cursor-pointer hover:opacity-75 transition-opacity leading-none ${gameState.currentPlayer === 1 ? '' : 'text-gray-400'}`}
                    style={gameState.currentPlayer === 1 ? { color: gameState.players.find(p => p.id === 1)?.color || '#3b82f6' } : {}}
                    title="Click to view matches"
                  >
                    {gameState.players.find(p => p.id === 1)?.score || 0}
                  </button>
                </div>
                {gameState.currentPlayer === 1 && (
                  <div className="font-semibold flex flex-col items-center justify-center gap-1" style={{ color: gameState.players.find(p => p.id === 1)?.color || '#3b82f6' }}>
                    <svg className="animate-pulse" fill="currentColor" viewBox="0 0 20 20" style={{ width: '30px', height: '30px' }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs">Turn</span>
                  </div>
                )}
              </div>

                    {/* VS Divider */}
                    <div className="text-gray-400 font-semibold px-3 text-sm">VS</div>

              {/* Player 2 */}
              <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                gameState.currentPlayer === 2 
                  ? 'bg-opacity-90 ring-2' 
                  : 'bg-gray-50 bg-opacity-50'
              } ${glowingPlayer === 2 ? 'player-turn-glow' : ''}`}
              style={(() => {
                const player2 = gameState.players.find(p => p.id === 2);
                const playerColor = player2?.color || '#10b981';
                const rgb = hexToRgb(playerColor);
                const baseStyle: React.CSSProperties & { 
                  '--tw-ring-color'?: string; 
                  '--glow-color-start'?: string;
                  '--glow-color-mid'?: string;
                  '--glow-color-outer'?: string;
                  '--glow-color-end'?: string;
                } = {};
                
                if (gameState.currentPlayer === 2) {
                  baseStyle.backgroundColor = `${playerColor}20`;
                  baseStyle['--tw-ring-color'] = playerColor;
                }
                
                // Set glow color RGB strings for CSS variables with different opacities
                baseStyle['--glow-color-start'] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
                baseStyle['--glow-color-mid'] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)`;
                baseStyle['--glow-color-outer'] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
                baseStyle['--glow-color-end'] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`;
                
                return baseStyle;
              })()}
              >
                <div className="flex items-baseline gap-2">
                  <button
                    onClick={() => setSelectedPlayerForMatches(2)}
                    className="text-3xl text-gray-600 font-medium cursor-pointer hover:opacity-75 transition-opacity"
                    title="Click to view matches"
                  >
                    {gameState.players.find(p => p.id === 2)?.name || 'Player 2'}:
                  </button>
                  <button
                    onClick={() => setSelectedPlayerForMatches(2)}
                    className={`text-3xl font-bold cursor-pointer hover:opacity-75 transition-opacity leading-none ${gameState.currentPlayer === 2 ? '' : 'text-gray-400'}`}
                    style={gameState.currentPlayer === 2 ? { color: gameState.players.find(p => p.id === 2)?.color || '#10b981' } : {}}
                    title="Click to view matches"
                  >
                    {gameState.players.find(p => p.id === 2)?.score || 0}
                  </button>
                </div>
                {gameState.currentPlayer === 2 && (
                  <div className="font-semibold flex flex-col items-center justify-center gap-1" style={{ color: gameState.players.find(p => p.id === 2)?.color || '#10b981' }}>
                    <svg className="animate-pulse" fill="currentColor" viewBox="0 0 20 20" style={{ width: '30px', height: '30px' }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs">Turn</span>
                  </div>
                )}
              </div>
                  </div>
                </div>
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
                  cardBack={getCurrentCardBack()}
                />
              </div>
            </div>
          )}
        </main>

        {gameState.gameStatus === 'finished' && (gameState.winner || gameState.isTie) && (
          <GameOver 
            winner={gameState.winner} 
            players={gameState.players}
            isTie={gameState.isTie}
            onPlayAgain={handleResetClick}
            onExploreCards={() => setShowCardExplorer(true)}
            onClose={() => {
              resetGame();
              guardedSetSetupStep(null, 'game over close');
            }}
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
            onCancel={() => setShowResetConfirmation(false)}
          />
        </Modal>

        {/* Game Start Modal */}
        <Modal
          isOpen={setupStep === 'startGame'}
          onClose={cancelSetupFlow}
          onBack={handleStartModalBack}
          title={isResetting ? "Step 4: Who Goes First?" : "Step 4: Who Goes First?"}
        >
          <GameStartModal
            players={gameState.players}
            currentPlayer={gameState.currentPlayer}
            onStartGame={handleStartGame}
            onPlayerNameChange={updatePlayerName}
            onPlayerColorChange={updatePlayerColor}
            onBack={handleStartModalBack}
            isResetting={isResetting}
          />
        </Modal>

        {/* Card Pack Modal */}
        <Modal
          isOpen={setupStep === 'cardPack'}
          onClose={cancelSetupFlow}
          title={isResetting ? "Step 1: Choose Your Card Pack" : "Step 1: Choose Your Card Pack"}
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
          isOpen={setupStep === 'background'}
          onClose={cancelSetupFlow}
          onBack={handleBackgroundModalBack}
          title={isResetting ? "Step 2: Choose Your Background" : "Step 2: Choose Your Background"}
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
          isOpen={setupStep === 'cardBack'}
          onClose={cancelSetupFlow}
          onBack={handleCardBackModalBack}
          title={isResetting ? "Step 3: Choose Your Card Back" : "Step 3: Choose Your Card Back"}
        >
          <CardBackModal
            selectedCardBack={selectedCardBack}
            onSelect={(cb) => handleCardBackChange(cb as CardBackType)}
            onClose={cancelSetupFlow}
            onBack={handleCardBackModalBack}
            isResetting={isResetting}
          />
        </Modal>

        {/* Player Matches Modal */}
        {selectedPlayerForMatches !== null && gameState.players[selectedPlayerForMatches - 1] && (
          <PlayerMatchesModal
            isOpen={selectedPlayerForMatches !== null}
            onClose={() => setSelectedPlayerForMatches(null)}
            player={gameState.players[selectedPlayerForMatches - 1]}
            cards={gameState.cards}
            cardSize={cardSize}
            useWhiteCardBackground={useWhiteCardBackground}
            emojiSizePercentage={emojiSizePercentage}
            cardBack={getCurrentCardBack()}
          />
        )}

        {/* Hidden Pong Game */}
        <Pong isOpen={showPong} onClose={() => setShowPong(false)} />

        {/* Card Explorer Modal */}
        <CardExplorerModal
          isOpen={showCardExplorer}
          onClose={() => setShowCardExplorer(false)}
          cards={gameState.cards}
          cardSize={cardSize}
          useWhiteCardBackground={useWhiteCardBackground}
          emojiSizePercentage={emojiSizePercentage}
          cardBack={getCurrentCardBack()}
        />

        {/* Admin Sidebar */}
        {gameState.gameStatus === 'playing' && adminEnabled && (
          <AdminSidebar
            isOpen={showAdminSidebar}
            onClose={() => setShowAdminSidebar(false)}
            onEndGameEarly={() => {
              endGameEarly();
              setShowAdminSidebar(false);
            }}
            onToggleFlipAll={toggleAllCardsFlipped}
            allCardsFlipped={
              gameState.cards.length > 0 &&
              gameState.cards
                .filter(c => !c.isMatched && !c.isFlyingToPlayer)
                .every(c => c.isFlipped)
            }
          />
        )}

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
  );
}

export default App;
