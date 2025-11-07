import { useState } from 'react';
import { Card } from '../types';
import { Card as CardComponent } from './Card';
import type { CardBackOption } from '../hooks/useCardBackSelector';
import { CardLightbox } from './CardLightbox';

interface CardExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  cardSize?: number;
  useWhiteCardBackground?: boolean;
  emojiSizePercentage?: number;
  cardBack?: CardBackOption;
}

export const CardExplorerModal = ({
  isOpen,
  onClose,
  cards,
  cardSize = 100,
  useWhiteCardBackground = false,
  emojiSizePercentage = 72,
  cardBack
}: CardExplorerModalProps) => {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  // Get unique cards (one per imageId) and ensure they're flipped to show faces
  const uniqueCardsMap = new Map<string, Card>();
  cards.forEach(card => {
    if (!uniqueCardsMap.has(card.imageId)) {
      uniqueCardsMap.set(card.imageId, {
        ...card,
        isFlipped: true // Show card faces in explorer
      });
    }
  });
  const uniqueCards = Array.from(uniqueCardsMap.values());

  const handleCardClick = (index: number) => {
    setSelectedCardIndex(index);
  };

  const handleCloseLightbox = () => {
    setSelectedCardIndex(null);
  };

  const handleNavigate = (index: number) => {
    setSelectedCardIndex(index);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
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
              <h2 className="text-2xl font-bold text-gray-800">Explore All Cards</h2>
              <p className="text-sm text-gray-500 mt-1">{uniqueCards.length} card{uniqueCards.length !== 1 ? 's' : ''} in deck</p>
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
            {uniqueCards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No cards available!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {uniqueCards.map((card, index) => (
                  <div 
                    key={card.id} 
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(index);
                      }}
                      className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                      title="Click to view card details"
                    >
                      <CardComponent
                        card={card}
                        onClick={() => {}}
                        size={cardSize}
                        useWhiteBackground={useWhiteCardBackground}
                        emojiSizePercentage={emojiSizePercentage}
                        cardBack={cardBack}
                        forceGameplaySize={true}
                        forceGameplayBackground={true}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Card Lightbox */}
      <CardLightbox
        isOpen={selectedCardIndex !== null}
        onClose={handleCloseLightbox}
        card={selectedCardIndex !== null ? uniqueCards[selectedCardIndex] : null}
        cards={uniqueCards}
        currentIndex={selectedCardIndex ?? 0}
        onNavigate={handleNavigate}
      />
    </>
  );
};




