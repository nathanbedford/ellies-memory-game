import { useState } from 'react';
import type { Card, Player } from '../types';
import { Card as CardComponent } from './Card';
import type { CardBackOption } from '../hooks/useCardBackSelector';
import { CardGridModal } from './CardGridModal';

interface PlayerMatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  cards: Card[];
  useWhiteCardBackground?: boolean;
  emojiSizePercentage?: number;
  cardBack?: CardBackOption;
  onPlayerNameChange?: (playerId: 1 | 2, newName: string) => void;
  canEditName?: boolean; // Controls whether name editing is allowed (for online mode)
}

export const PlayerMatchesModal = ({
  isOpen,
  onClose,
  player,
  cards,
  useWhiteCardBackground = false,
  emojiSizePercentage = 72,
  cardBack,
  onPlayerNameChange,
  canEditName = true // Default to true for backwards compatibility
}: PlayerMatchesModalProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(player.name);

  // Get all cards matched by this player, grouped by imageId (pairs)
  const matchedCards = cards.filter(c => c.isMatched && c.matchedByPlayerId === player.id);

  // Group cards by imageId to show pairs
  const cardPairs: { [imageId: string]: Card[] } = {};
  matchedCards.forEach(card => {
    if (!cardPairs[card.imageId]) {
      cardPairs[card.imageId] = [];
    }
    cardPairs[card.imageId].push(card);
  });

  const pairs = Object.values(cardPairs);
  // Get unique cards (one per pair) for navigation in lightbox
  const uniqueCards = pairs.map(pair => pair[0]);

  // Render editable title with player name
  const renderTitle = () => (
    <div className="flex items-center gap-2">
      {isEditingName ? (
        <input
          type="text"
          value={editNameValue}
          onChange={(e) => setEditNameValue(e.target.value)}
          onBlur={() => {
            if (editNameValue.trim() && onPlayerNameChange) {
              onPlayerNameChange(player.id as 1 | 2, editNameValue.trim());
            }
            setIsEditingName(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (editNameValue.trim() && onPlayerNameChange) {
                onPlayerNameChange(player.id as 1 | 2, editNameValue.trim());
              }
              setIsEditingName(false);
            } else if (e.key === 'Escape') {
              setEditNameValue(player.name);
              setIsEditingName(false);
            }
          }}
          className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 outline-none bg-transparent"
        />
      ) : (
        <h2 className="text-2xl font-bold text-gray-800">{player.name}'s Matches</h2>
      )}
      {onPlayerNameChange && canEditName && !isEditingName && (
        <button
          onClick={() => {
            setEditNameValue(player.name);
            setIsEditingName(true);
          }}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          type="button"
          title="Edit player name"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}
    </div>
  );

  // Custom card renderer to show pairs (only first card of each pair)
  const renderCard = (card: Card, index: number, onCardClick: (index: number) => void) => (
    <div
      key={index}
      className="flex flex-col items-center gap-2"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCardClick(index);
        }}
        className="cursor-pointer transition-transform hover:scale-110 active:scale-95 border-0 bg-transparent p-0"
        title="Click to view card details"
      >
        <CardComponent
          card={card}
          onClick={() => { }}
          size={200}
          useWhiteBackground={useWhiteCardBackground}
          emojiSizePercentage={emojiSizePercentage}
          cardBack={cardBack}
          forceGameplaySize={true}
          forceGameplayBackground={true}
        />
      </button>
    </div>
  );

  return (
    <CardGridModal
      isOpen={isOpen}
      onClose={onClose}
      title={renderTitle()}
      subtitle={`${pairs.length} pair${pairs.length !== 1 ? 's' : ''} matched`}
      cards={uniqueCards}
      useWhiteCardBackground={useWhiteCardBackground}
      emojiSizePercentage={emojiSizePercentage}
      cardBack={cardBack}
      emptyMessage="No matches yet!"
      renderCard={renderCard}
    />
  );
};
