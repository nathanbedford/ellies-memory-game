import { Card, Player } from '../types';
import { Card as CardComponent } from './Card';
import type { CardBackOption } from '../hooks/useCardBackSelector';

interface PlayerMatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  cards: Card[];
  cardSize?: number;
  useWhiteCardBackground?: boolean;
  cardBack?: CardBackOption;
}

export const PlayerMatchesModal = ({
  isOpen,
  onClose,
  player,
  cards,
  cardSize = 100,
  useWhiteCardBackground = false,
  cardBack
}: PlayerMatchesModalProps) => {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{player.name}'s Matches</h2>
            <p className="text-sm text-gray-500 mt-1">{pairs.length} pair{pairs.length !== 1 ? 's' : ''} matched</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
            type="button"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {pairs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No matches yet!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {pairs.map((pair, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  {/* Stacked card effect - show one card with a shadow/stacked appearance */}
                  <div className="relative" style={{ width: `${cardSize}px`, height: `${cardSize}px` }}>
                    {/* Shadow card (slightly offset behind) */}
                    <div 
                      className="absolute opacity-60"
                      style={{
                        top: '6px',
                        left: '6px',
                        width: `${cardSize}px`,
                        height: `${cardSize}px`,
                        zIndex: 0,
                        filter: 'brightness(0.7)'
                      }}
                    >
                      <CardComponent
                        card={pair[0]}
                        onClick={() => {}}
                        size={cardSize}
                        useWhiteBackground={useWhiteCardBackground}
                        cardBack={cardBack}
                        forceGameplaySize={true}
                        forceGameplayBackground={true}
                      />
                    </div>
                    {/* Top card */}
                    <div 
                      className="relative"
                      style={{
                        zIndex: 1
                      }}
                    >
                      <CardComponent
                        card={pair[0]}
                        onClick={() => {}}
                        size={cardSize}
                        useWhiteBackground={useWhiteCardBackground}
                        cardBack={cardBack}
                        forceGameplaySize={true}
                        forceGameplayBackground={true}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

