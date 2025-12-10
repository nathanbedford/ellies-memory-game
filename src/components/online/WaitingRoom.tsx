/**
 * WaitingRoom - Shows players waiting for game to start
 *
 * Host can configure game settings (card pack, background, card back).
 * Guest sees previews of the host's selected settings.
 */

import { useState, useEffect } from 'react';
import type { Room, CardPack } from '../../types';
import { CARD_PACKS } from '../../hooks/useCardPacks';
import { BACKGROUND_OPTIONS } from '../../hooks/useBackgroundSelector';
import { CARD_BACK_OPTIONS } from '../../hooks/useCardBackSelector';
import { useOnlineStore } from '../../stores/onlineStore';
import { Modal } from '../Modal';
import { CardPackModal } from '../CardPackModal';
import { BackgroundModal } from '../BackgroundModal';
import { CardBackModal } from '../CardBackModal';

type OpenModal = 'none' | 'cardPack' | 'background' | 'cardBack';

interface WaitingRoomProps {
  roomCode: string;
  room: Room;
  isHost: boolean;
  opponentConnected: boolean;
  onLeave: () => void;
  onStartGame: () => void;
}

export const WaitingRoom = ({
  room,
  isHost,
  opponentConnected,
  onLeave,
  onStartGame,
}: WaitingRoomProps) => {
  const [openModal, setOpenModal] = useState<OpenModal>('none');
  const { updateRoomConfig, getLastOnlinePreferences } = useOnlineStore();

  const players = Object.entries(room.players);
  const hasOpponent = players.length === 2;
  const canStart = isHost && hasOpponent && opponentConnected;

  // Sort players by slot
  const sortedPlayers = [...players].sort(([, a], [, b]) => a.slot - b.slot);

  // Get current settings from room config, or load stored preferences if host and no config exists
  const getInitialSettings = () => {
    if (room.config?.cardPack && room.config?.background && room.config?.cardBack) {
      return {
        cardPack: room.config.cardPack,
        background: room.config.background,
        cardBack: room.config.cardBack,
      };
    }

    // If host and no config, try to load stored preferences
    if (isHost) {
      const storedPrefs = getLastOnlinePreferences();
      if (storedPrefs.cardPack && storedPrefs.background && storedPrefs.cardBack) {
        return {
          cardPack: storedPrefs.cardPack as CardPack,
          background: storedPrefs.background,
          cardBack: storedPrefs.cardBack,
        };
      }
    }

    // Fall back to defaults
    return {
      cardPack: 'animals' as CardPack,
      background: 'rainbow',
      cardBack: 'default',
    };
  };

  const initialSettings = getInitialSettings();
  const currentCardPack = room.config?.cardPack || initialSettings.cardPack;
  const currentBackground = room.config?.background || initialSettings.background;
  const currentCardBack = room.config?.cardBack || initialSettings.cardBack;

  // Load stored preferences into room config if host and no config exists
  useEffect(() => {
    if (isHost && !room.config?.cardPack && !room.config?.background && !room.config?.cardBack) {
      const storedPrefs = getLastOnlinePreferences();
      if (storedPrefs.cardPack && storedPrefs.background && storedPrefs.cardBack) {
        updateRoomConfig({
          cardPack: storedPrefs.cardPack as CardPack,
          background: storedPrefs.background,
          cardBack: storedPrefs.cardBack,
        }).catch(console.error);
      }
    }
  }, [isHost, room.config, getLastOnlinePreferences, updateRoomConfig]);

  // Find display info for current selections
  const cardPackInfo = CARD_PACKS.find(p => p.id === currentCardPack);
  const backgroundInfo = BACKGROUND_OPTIONS.find(b => b.id === currentBackground);
  const cardBackInfo = CARD_BACK_OPTIONS.find(c => c.id === currentCardBack);

  // Handle settings changes (host only) - sequential wizard flow
  const handleCardPackChange = async (packId: CardPack) => {
    if (!isHost) return;
    await updateRoomConfig({ cardPack: packId });
    // Advance to background modal
    setOpenModal('background');
  };

  const handleBackgroundChange = async (backgroundId: string) => {
    if (!isHost) return;
    await updateRoomConfig({ background: backgroundId });
    // Advance to card back modal
    setOpenModal('cardBack');
  };

  const handleCardBackChange = async (cardBackId: string) => {
    if (!isHost) return;
    await updateRoomConfig({ cardBack: cardBackId });
    // Close wizard - all settings configured
    setOpenModal('none');
  };

  // Render a settings preview tile
  const renderSettingTile = (
    label: string,
    modal: OpenModal,
    preview: React.ReactNode,
    displayName: string
  ) => (
    <button
      type="button"
      onClick={() => {
        if (isHost) {
          setOpenModal(modal);
        }
      }}
      disabled={!isHost}
      title={isHost ? `Change ${label.toLowerCase()}` : undefined}
      className={`p-3 rounded-lg border-2 transition-all text-left w-full ${isHost
        ? 'hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
        : 'cursor-default'
        } border-gray-200 bg-white`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
          {preview}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="font-medium text-gray-800 truncate">{displayName}</p>
        </div>
        {isHost && (
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </button>
  );

  // Render card pack preview
  const renderCardPackPreview = () => (
    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-2xl">
      {cardPackInfo?.emoji || '🃏'}
    </div>
  );

  // Render background preview
  const renderBackgroundPreview = () => {
    if (backgroundInfo?.imageUrl) {
      return (
        <img
          src={backgroundInfo.imageUrl}
          alt={backgroundInfo.name}
          className="w-full h-full object-cover"
        />
      );
    }
    return (
      <div className={`w-full h-full bg-gradient-to-br ${backgroundInfo?.gradient || 'from-gray-300 to-gray-400'}`} />
    );
  };

  // Render card back preview
  const renderCardBackPreview = () => {
    if (cardBackInfo?.imageUrl) {
      return (
        <img
          src={cardBackInfo.imageUrl}
          alt={cardBackInfo.name}
          className="w-full h-full object-cover"
        />
      );
    }
    if (cardBackInfo?.solidColor) {
      return (
        <div
          className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
          style={{ backgroundColor: cardBackInfo.solidColor }}
        >
          ?
        </div>
      );
    }
    return (
      <div className={`w-full h-full bg-gradient-to-br ${cardBackInfo?.gradient || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-white font-bold text-xl`}>
        {cardBackInfo?.emoji || '?'}
      </div>
    );
  };

  return (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {isHost ? 'Waiting for Player' : 'Waiting for Host'}
        </h2>
        <p className="text-gray-600">
          {isHost
            ? hasOpponent
              ? 'Player joined! Configure settings and start when ready.'
              : 'Share the room code with your friend'
            : 'Waiting for the host to start the game...'}
        </p>
      </div>

      {/* Players + Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Players */}
        <div className="grid grid-cols-2 gap-4">
          {sortedPlayers.map(([odahId, player]) => (
            <div
              key={odahId}
              className="p-4 rounded-xl border-3 transition-all"
              style={{
                borderColor: player.color,
                backgroundColor: `${player.color}15`,
              }}
            >
              <div className="space-y-2">
                <div
                  className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-white"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{player.name}</p>
                  <p className="text-xs text-gray-500">
                    {player.slot === 1 ? 'Host' : 'Guest'}
                  </p>
                </div>
                {/* Connection status */}
                <div className="flex items-center justify-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${player.slot === 1 || opponentConnected
                      ? 'bg-green-500'
                      : 'bg-gray-400 animate-pulse'
                      }`}
                  />
                  <span className="text-xs text-gray-500">
                    {player.slot === 1 || opponentConnected ? 'Online' : 'Connecting...'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Empty slot placeholder */}
          {!hasOpponent && (
            <div className="p-4 rounded-xl border-3 border-dashed border-gray-300 bg-gray-50">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-2xl bg-gray-200 text-gray-400">
                  ?
                </div>
                <div>
                  <p className="font-medium text-gray-400 text-sm">Waiting...</p>
                  <p className="text-xs text-gray-400">for player to join</p>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
                  <span className="text-xs text-gray-400">Waiting</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Game Settings */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">
              Game Settings
            </p>
            {!isHost && (
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                Host controls
              </span>
            )}
          </div>

          <div className="space-y-2">
            {/* Card Pack */}
            {renderSettingTile(
              'Card Pack',
              'cardPack',
              renderCardPackPreview(),
              cardPackInfo?.name || currentCardPack
            )}

            {/* Background */}
            {renderSettingTile(
              'Background',
              'background',
              renderBackgroundPreview(),
              backgroundInfo?.name || currentBackground
            )}

            {/* Card Back */}
            {renderSettingTile(
              'Card Back',
              'cardBack',
              renderCardBackPreview(),
              cardBackInfo?.name || currentCardBack
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <button
          type="button"
          onClick={onLeave}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
        >
          Leave Room
        </button>
        {isHost && (
          <button
            type="button"
            onClick={onStartGame}
            disabled={!canStart}
            className={`px-8 py-3 font-bold rounded-lg transition-all flex items-center gap-2 ${canStart
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            Start Game
          </button>
        )}
      </div>

      {/* Helper text for host */}
      {isHost && !canStart && (
        <p className="text-sm text-gray-500">
          {!hasOpponent
            ? 'Waiting for another player to join...'
            : !opponentConnected
              ? 'Waiting for player to connect...'
              : 'Ready to start!'}
        </p>
      )}

      {/* Wizard Modals */}
      {/* Card Pack Modal */}
      <Modal
        isOpen={openModal === 'cardPack'}
        onClose={() => setOpenModal('none')}
        title="Step 1: Choose Card Pack"
      >
        <CardPackModal
          cardPacks={CARD_PACKS}
          selectedPack={currentCardPack}
          onSelect={(packId) => handleCardPackChange(packId as CardPack)}
          onClose={() => setOpenModal('none')}
        />
      </Modal>

      {/* Background Modal */}
      <Modal
        isOpen={openModal === 'background'}
        onClose={() => setOpenModal('none')}
        onBack={() => setOpenModal('cardPack')}
        title="Step 2: Choose Background"
      >
        <BackgroundModal
          selectedBackground={currentBackground}
          onSelect={(backgroundId) => handleBackgroundChange(backgroundId)}
          onClose={() => setOpenModal('none')}
          onBack={() => setOpenModal('cardPack')}
        />
      </Modal>

      {/* Card Back Modal */}
      <Modal
        isOpen={openModal === 'cardBack'}
        onClose={() => setOpenModal('none')}
        onBack={() => setOpenModal('background')}
        title="Step 3: Choose Card Back"
      >
        <CardBackModal
          selectedCardBack={currentCardBack}
          onSelect={(cardBackId) => handleCardBackChange(cardBackId)}
          onClose={() => setOpenModal('none')}
          onBack={() => setOpenModal('background')}
        />
      </Modal>
    </div>
  );
};
