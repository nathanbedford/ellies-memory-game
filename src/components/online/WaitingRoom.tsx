/**
 * WaitingRoom - Shows players waiting for game to start
 *
 * Host can configure game settings (card pack, background, card back).
 * Guest sees previews of the host's selected settings.
 */

import { useState } from 'react';
import type { Room, CardPack } from '../../types';
import { CARD_PACKS } from '../../hooks/useCardPacks';
import { BACKGROUND_OPTIONS } from '../../hooks/useBackgroundSelector';
import { CARD_BACK_OPTIONS } from '../../hooks/useCardBackSelector';
import { useOnlineStore } from '../../stores/onlineStore';

type SettingsSection = 'none' | 'cardPack' | 'background' | 'cardBack';

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
  const [expandedSection, setExpandedSection] = useState<SettingsSection>('none');
  const { updateRoomConfig } = useOnlineStore();

  const players = Object.entries(room.players);
  const hasOpponent = players.length === 2;
  const canStart = isHost && hasOpponent && opponentConnected;

  // Sort players by slot
  const sortedPlayers = [...players].sort(([, a], [, b]) => a.slot - b.slot);

  // Get current settings from room config
  const currentCardPack = room.config?.cardPack || 'animals';
  const currentBackground = room.config?.background || 'rainbow';
  const currentCardBack = room.config?.cardBack || 'default';

  // Find display info for current selections
  const cardPackInfo = CARD_PACKS.find(p => p.id === currentCardPack);
  const backgroundInfo = BACKGROUND_OPTIONS.find(b => b.id === currentBackground);
  const cardBackInfo = CARD_BACK_OPTIONS.find(c => c.id === currentCardBack);

  // Handle settings changes (host only)
  const handleCardPackChange = async (packId: CardPack) => {
    if (!isHost) return;
    await updateRoomConfig({ cardPack: packId });
    setExpandedSection('none');
  };

  const handleBackgroundChange = async (backgroundId: string) => {
    if (!isHost) return;
    await updateRoomConfig({ background: backgroundId });
    setExpandedSection('none');
  };

  const handleCardBackChange = async (cardBackId: string) => {
    if (!isHost) return;
    await updateRoomConfig({ cardBack: cardBackId });
    setExpandedSection('none');
  };

  const toggleSection = (section: SettingsSection) => {
    if (!isHost) return;
    setExpandedSection(prev => prev === section ? 'none' : section);
  };

  // Render a settings preview tile
  const renderSettingTile = (
    label: string,
    section: SettingsSection,
    preview: React.ReactNode,
    displayName: string
  ) => (
    <button
      onClick={() => toggleSection(section)}
      disabled={!isHost}
      className={`p-3 rounded-lg border-2 transition-all text-left w-full ${
        isHost
          ? 'hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
          : 'cursor-default'
      } ${expandedSection === section ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
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
            className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === section ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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

      {/* Players */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
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
                  className={`w-2 h-2 rounded-full ${
                    player.slot === 1 || opponentConnected
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
      <div className="bg-gray-50 rounded-xl p-4 max-w-md mx-auto max-h-[50vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3 sticky top-0 bg-gray-50 pb-2 -mt-1 pt-1">
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

          {/* Card Pack Selector (expanded) */}
          {expandedSection === 'cardPack' && isHost && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 grid grid-cols-3 gap-2">
              {CARD_PACKS.map(pack => (
                <button
                  key={pack.id}
                  onClick={() => handleCardPackChange(pack.id as CardPack)}
                  className={`p-2 rounded-lg border-2 transition-all text-center ${
                    currentCardPack === pack.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{pack.emoji}</div>
                  <div className="text-xs font-medium text-gray-700 truncate">{pack.name}</div>
                </button>
              ))}
            </div>
          )}

          {/* Background */}
          {renderSettingTile(
            'Background',
            'background',
            renderBackgroundPreview(),
            backgroundInfo?.name || currentBackground
          )}

          {/* Background Selector (expanded) */}
          {expandedSection === 'background' && isHost && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 grid grid-cols-3 gap-2">
              {BACKGROUND_OPTIONS.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => handleBackgroundChange(bg.id)}
                  className={`p-1 rounded-lg border-2 transition-all ${
                    currentBackground === bg.id
                      ? 'border-blue-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-12 rounded overflow-hidden mb-1">
                    {bg.imageUrl ? (
                      <img src={bg.imageUrl} alt={bg.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${bg.gradient}`} />
                    )}
                  </div>
                  <div className="text-xs font-medium text-gray-700 truncate">{bg.name}</div>
                </button>
              ))}
            </div>
          )}

          {/* Card Back */}
          {renderSettingTile(
            'Card Back',
            'cardBack',
            renderCardBackPreview(),
            cardBackInfo?.name || currentCardBack
          )}

          {/* Card Back Selector (expanded) */}
          {expandedSection === 'cardBack' && isHost && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 grid grid-cols-2 gap-2">
              {CARD_BACK_OPTIONS.map(cb => (
                <button
                  key={cb.id}
                  onClick={() => handleCardBackChange(cb.id)}
                  className={`p-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    currentCardBack === cb.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                    {cb.imageUrl ? (
                      <img src={cb.imageUrl} alt={cb.name} className="w-full h-full object-cover" />
                    ) : cb.solidColor ? (
                      <div
                        className="w-full h-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: cb.solidColor }}
                      >
                        ?
                      </div>
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${cb.gradient} flex items-center justify-center text-white font-bold`}>
                        {cb.emoji || '?'}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-700">{cb.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={onLeave}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
        >
          Leave Room
        </button>
        {isHost && (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className={`px-8 py-3 font-bold rounded-lg transition-all flex items-center gap-2 ${
              canStart
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
    </div>
  );
};
