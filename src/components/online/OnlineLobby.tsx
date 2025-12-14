/**
 * OnlineLobby - Main container for online multiplayer flow
 *
 * Handles the flow: Connect -> Create/Join -> Wait -> Start
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { UserPlus, LogIn } from 'lucide-react';
import { useOnlineStore } from '../../stores';
import { useGameStore } from '../../stores';
import { ConnectionStatus } from './ConnectionStatus';
import { RoomCodeDisplay } from './RoomCodeDisplay';
import { JoinRoomForm } from './JoinRoomForm';
import { WaitingRoom } from './WaitingRoom';
import { getFirestoreSyncAdapter } from '../../services/sync/FirestoreSyncAdapter';
import { initializeCards, createInitialState, startGameWithCards } from '../../services/game/GameEngine';
import { CARD_DECKS } from '../../data/cardDecks';
import { DEFAULT_PAIR_COUNT } from '../../utils/gridLayout';
import type { CardPack } from '../../types';

type LobbyView = 'choice' | 'create' | 'join' | 'waiting';

interface OnlineLobbyProps {
  onBack: () => void;
  onGameStart: (gameState: import('../../types').GameState) => void;
}

export const OnlineLobby = ({ onBack, onGameStart }: OnlineLobbyProps) => {
  const [view, setView] = useState<LobbyView>('choice');
  const [isLoading, setIsLoading] = useState(false);
  const hasStartedGame = useRef(false);
  const [playerNameInput, setPlayerNameInput] = useState('');

  const {
    connectionStatus,
    roomCode,
    room,
    isHost,
    opponentConnected,
    error,
    connect,
    createRoom,
    joinRoom,
    leaveRoom,
    subscribeToPresence,
    clearError,
    playerName,
    setPlayerNamePreference,
    getLastOnlinePreferences,
  } = useOnlineStore();

  useEffect(() => {
    setPlayerNameInput(playerName);
  }, [playerName]);

  const { settings } = useGameStore();

  // Helper to get images for a card pack
  const getPackImages = useCallback((packId: CardPack) => {
    const deck = CARD_DECKS.find(d => d.id === packId) || CARD_DECKS[0];
    return deck.cards.map((card) => ({
      id: card.id,
      url: card.imageUrl || card.emoji,
      gradient: card.gradient
    }));
  }, []);

  // Handle starting the game (host only)
  const handleStartGame = useCallback(async () => {
    if (!isHost || !room || !roomCode) return;

    try {
      // Get card images for the selected pack
      const cardPack = room.config?.cardPack || settings.cardPack;
      const pairCount = room.config?.pairCount ?? DEFAULT_PAIR_COUNT;
      
      // Get all images then randomly select subset based on pair count
      const allImages = getPackImages(cardPack);
      const shuffled = [...allImages].sort(() => 0.5 - Math.random());
      const images = shuffled.slice(0, pairCount);

      // Create initial game state
      const players = Object.entries(room.players);
      const hostPlayer = players.find(([, p]) => p.slot === 1);
      const guestPlayer = players.find(([, p]) => p.slot === 2);

      if (!hostPlayer || !guestPlayer) {
        console.error('Missing players');
        return;
      }

      // Initialize cards
      const cards = initializeCards(images);

      // Create game state with player info from room
      const initialState = createInitialState(
        hostPlayer[1].name,
        guestPlayer[1].name,
        hostPlayer[1].color,
        guestPlayer[1].color,
        1 // Host goes first
      );

      const gameState = startGameWithCards(initialState, cards);

      // Start game via adapter (syncs to Firestore)
      const adapter = getFirestoreSyncAdapter();
      await adapter.startGame(roomCode, gameState);

      // Trigger callback with the game state
      onGameStart(gameState);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  }, [isHost, room, roomCode, settings.cardPack, getPackImages, onGameStart]);

  // Connect on mount
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      connect().catch(console.error);
    }
  }, [connectionStatus, connect]);

  // Subscribe to room and presence when in a room
  useEffect(() => {
    if (!roomCode) return;

    const unsubPresence = subscribeToPresence(roomCode);
    return () => {
      unsubPresence();
    };
  }, [roomCode, subscribeToPresence]);

  // Move to waiting view when room is created/joined
  useEffect(() => {
    if (roomCode && (view === 'create' || view === 'join')) {
      setView('waiting');
      setIsLoading(false);
    }
  }, [roomCode, view]);

  // Auto-transition to game when host starts (for guest players)
  // Game state is now in separate /games/{roomCode} document, so fetch it from adapter
  useEffect(() => {
    if (
      room?.status === 'playing' &&
      !hasStartedGame.current
    ) {
      hasStartedGame.current = true;
      // Fetch game state from separate Firestore document
      const adapter = getFirestoreSyncAdapter();
      adapter.getState().then((gameState) => {
        if (gameState) {
          onGameStart(gameState);
        }
      });
    }
  }, [room?.status, onGameStart]);

  const handleCreateRoom = async () => {
    setIsLoading(true);
    clearError();

    try {
      const preferredName = playerNameInput.trim() || 'Player';
      setPlayerNamePreference(preferredName);

      // Get stored online preferences, fall back to local game settings
      const storedPrefs = getLastOnlinePreferences();
      await createRoom({
        hostName: preferredName,
        hostColor: settings.player1Color,
        cardPack: (storedPrefs.cardPack as CardPack) || settings.cardPack,
        background: storedPrefs.background || settings.background,
        cardBack: storedPrefs.cardBack || settings.cardBack,
      });
    } catch {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (code: string) => {
    setIsLoading(true);
    clearError();

    try {
      const preferredName = playerNameInput.trim() || 'Player';
      setPlayerNamePreference(preferredName);
      await joinRoom(code, preferredName, settings.player1Color);
    } catch {
      setIsLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    setView('choice');
  };

  const handleBack = () => {
    if (view === 'waiting') {
      handleLeaveRoom();
    } else if (view === 'choice') {
      onBack();
    } else {
      setView('choice');
      clearError();
    }
  };

  // Render based on current view
  const renderContent = () => {
    // Still connecting
    if (connectionStatus === 'connecting') {
      return (
        <div className="text-center space-y-6 py-8">
          <div className="text-6xl animate-bounce">{"connect"}</div>
          <p className="text-gray-600">Connecting to server...</p>
        </div>
      );
    }

    // Connection failed
    if (connectionStatus === 'disconnected' && error) {
      return (
        <div className="text-center space-y-6 py-8">
          <div className="text-6xl">{"err"}</div>
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => connect()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      );
    }

    switch (view) {
      case 'choice':
        return (
          <div className="text-center space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Online Multiplayer</h2>
              <p className="text-gray-600">Create a room or join an existing one</p>
            </div>

            <div className="max-w-sm mx-auto w-full text-left space-y-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="online-name-input">
                Your online name
              </label>
              <input
                id="online-name-input"
                type="text"
                value={playerNameInput}
                onChange={(e) => setPlayerNameInput(e.target.value)}
                onBlur={() => setPlayerNamePreference(playerNameInput)}
                maxLength={20}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your name"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">This name is shared when you create or join rooms.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => {
                  setView('create');
                  handleCreateRoom();
                }}
                disabled={isLoading}
                className="p-8 rounded-xl border-3 border-gray-200 bg-white hover:border-blue-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group disabled:opacity-50"
              >
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <UserPlus className="w-14 h-14 text-blue-500 transition-transform group-hover:scale-110" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Create Room</h3>
                  <p className="text-gray-600 text-sm">
                    Start a new game and invite a friend
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setView('join')}
                disabled={isLoading}
                className="p-8 rounded-xl border-3 border-gray-200 bg-white hover:border-purple-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 group disabled:opacity-50"
              >
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <LogIn className="w-14 h-14 text-purple-500 transition-transform group-hover:scale-110" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Join Room</h3>
                  <p className="text-gray-600 text-sm">
                    Enter a code to join your friend's game
                  </p>
                </div>
              </button>
            </div>

            <button
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              Back to Mode Selection
            </button>
          </div>
        );

      case 'create':
        return (
          <div className="text-center space-y-6 py-8">
            <div className="text-6xl animate-pulse">{"..."}</div>
            <p className="text-gray-600">Creating room...</p>
          </div>
        );

      case 'join':
        return (
          <JoinRoomForm
            onJoin={handleJoinRoom}
            onBack={handleBack}
            isLoading={isLoading}
            error={error}
          />
        );

      case 'waiting':
        return roomCode && room ? (
          <WaitingRoom
            roomCode={roomCode}
            room={room}
            isHost={isHost}
            opponentConnected={opponentConnected}
            onLeave={handleLeaveRoom}
            onStartGame={handleStartGame}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Connection Status - fixed top left, aligned with reload button */}
      <div className="fixed top-5 left-[3.75rem] z-10 flex items-center">
        <div className="px-2 py-2">
          <ConnectionStatus status={connectionStatus} />
        </div>
      </div>

      {/* Room Code (when in room) */}
      {roomCode && view === 'waiting' && (
        <div className="mb-6">
          <RoomCodeDisplay roomCode={roomCode} />
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {renderContent()}
      </div>
    </div>
  );
};
