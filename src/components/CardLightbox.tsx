import { useEffect } from 'react';
import { Card } from '../types';
import { CARD_DECKS } from '../data/cardDecks';

interface CardLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
  cards?: Card[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

// Helper function to format imageId into a readable name
const formatCardName = (imageId: string): string => {
  // Find the card in any deck
  for (const deck of CARD_DECKS) {
    const cardData = deck.cards.find(c => c.id === imageId);
    if (cardData) {
      // Convert kebab-case to Title Case (e.g., 'very-happy' -> 'Very Happy')
      return imageId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }
  // Fallback: format the imageId itself
  return imageId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const CardLightbox = ({ isOpen, onClose, card, cards = [], currentIndex = 0, onNavigate }: CardLightboxProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && cards.length > 0 && onNavigate) {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
        onNavigate(prevIndex);
      } else if (e.key === 'ArrowRight' && cards.length > 0 && onNavigate) {
        const nextIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
        onNavigate(nextIndex);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, cards, currentIndex, onNavigate]);

  if (!isOpen || !card) return null;

  const canNavigate = cards.length > 1 && onNavigate;

  const handlePrevious = () => {
    if (canNavigate) {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
      onNavigate(prevIndex);
    }
  };

  const handleNext = () => {
    if (canNavigate) {
      const nextIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
      onNavigate(nextIndex);
    }
  };

  // Check if imageUrl is an actual image URL or an emoji
  const isImage = card.imageUrl && (
    card.imageUrl.startsWith('http') || 
    card.imageUrl.startsWith('/') || 
    card.imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
    card.imageUrl.includes('blob:') || 
    card.imageUrl.includes('data:')
  );

  const cardName = formatCardName(card.imageId);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 text-white hover:text-gray-300 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors z-10"
        type="button"
        title="Close"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation Arrows */}
      {canNavigate && (
        <>
          {/* Left Arrow */}
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:text-gray-300 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors z-10"
            type="button"
            title="Previous card"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:text-gray-300 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors z-10"
            type="button"
            title="Next card"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Card Display */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card container with rounded corners */}
        <div 
          className="relative flex items-center justify-center w-full max-w-[95vmin] max-h-[95vmin] rounded-3xl overflow-hidden shadow-2xl"
          style={{ aspectRatio: '1/1' }}
        >
          {isImage ? (
            <img 
              src={card.imageUrl} 
              alt="" 
              className="w-full h-full object-contain"
            />
          ) : (
            <div 
              className={`relative w-full h-full flex items-center justify-center ${
                card.gradient
                  ? `bg-gradient-to-br ${card.gradient}`
                  : 'bg-white'
              }`}
            >
              {/* Semi-transparent overlay for gradient backgrounds */}
              {card.gradient && (
                <div className="absolute inset-0 bg-white opacity-30" />
              )}
              <div 
                className="text-center relative z-10"
                style={{ fontSize: 'min(52.25vmin, 200px)' }}
              >
                {card.imageUrl || '?'}
              </div>
            </div>
          )}
          
          {/* Card Name Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
            <h2 
              className="text-white text-center text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold"
              style={{
                textShadow: '0 0 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 0, 0, 0.6), 0 2px 4px rgba(0, 0, 0, 0.9)'
              }}
            >
              {cardName}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};


