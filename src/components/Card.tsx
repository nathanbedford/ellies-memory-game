import { useEffect } from 'react';
import { Card as CardType } from '../types';
import type { CardBackOption } from '../hooks/useCardBackSelector';

interface CardProps {
  card: CardType;
  onClick: () => void;
  size?: number;
  useWhiteBackground?: boolean;
  cardBack?: CardBackOption;
  forceGameplaySize?: boolean; // Force use of regular gameplay size instead of matched size
  forceGameplayBackground?: boolean; // Force use of gradient background instead of white matched background
}

export const Card = ({ card, onClick, size = 100, useWhiteBackground = false, cardBack, forceGameplaySize = false, forceGameplayBackground = false }: CardProps) => {
  // Debug: Log when isFlipped changes
  useEffect(() => {
    console.log('[CARD] Card prop changed', JSON.stringify({
      cardId: card.id,
      isFlipped: card.isFlipped,
      isMatched: card.isMatched,
      timestamp: new Date().toISOString()
    }));
  }, [card.id, card.isFlipped, card.isMatched]);
  
  // Calculate font size based on card size (roughly 40% of card size, then 80% bigger)
  const fontSize = Math.round(size * 0.4 * 1.8); // 0.4 * 1.8 = 0.72 (72% of card size)
  // For matched cards, make emoji 50% bigger (then 80% bigger on top of that)
  const matchedFontSize = Math.round(size * 0.6 * 1.8); // 0.6 * 1.8 = 1.08 (108% of card size)
  
  // Default card back if none provided
  const defaultCardBack: CardBackOption = {
    id: 'default',
    name: 'Default',
    gradient: 'from-indigo-500 to-purple-600',
    emoji: '?'
  };
  
  const activeCardBack = cardBack || defaultCardBack;
  
  return (
    <div
      onPointerDown={card.isMatched ? undefined : (e) => {
        e.preventDefault(); // Prevent text selection and other default behaviors
        onClick();
      }}
      className={`relative transition-transform duration-500 transform-gpu ${card.isMatched ? 'cursor-default' : 'cursor-pointer'}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transformStyle: 'preserve-3d',
        transform: card.isFlipped || card.isMatched ? 'rotateY(180deg)' : 'rotateY(0deg)',
        pointerEvents: card.isMatched ? 'none' : 'auto',
        userSelect: 'none', // Prevent text selection for snappier feel
        touchAction: 'manipulation' // Optimize touch interactions on mobile
      }}
    >
      {/* Card Back */}
      <div
        className={`absolute inset-0 w-full h-full rounded-lg shadow-lg flex items-center justify-center border-2 ${
          activeCardBack.gradient ? `bg-gradient-to-br ${activeCardBack.gradient}` : ''
        } ${activeCardBack.id === 'default' ? 'border-indigo-300' : activeCardBack.id === 'emoji' ? 'border-purple-300' : 'border-gray-300'}`}
        style={{ 
          backfaceVisibility: 'hidden', 
          transform: 'rotateY(0deg)',
          ...(activeCardBack.imageUrl ? {
            backgroundImage: `url(${activeCardBack.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {})
        }}
      >
        {activeCardBack.emoji && (
          <div 
            className="text-white font-bold"
            style={{ fontSize: `${fontSize}px` }}
          >
            {activeCardBack.emoji}
          </div>
        )}
        {activeCardBack.id === 'default' && !activeCardBack.emoji && (
          <div 
            className="text-white font-bold"
            style={{ fontSize: `${fontSize}px` }}
          >
            ?
          </div>
        )}
      </div>
      
      {/* Card Front */}
      <div 
        className={`absolute inset-0 w-full h-full rounded-lg shadow-lg overflow-hidden ${
          useWhiteBackground || (card.isMatched && !forceGameplayBackground)
            ? 'bg-white'
            : `bg-gradient-to-br ${card.gradient || 'from-gray-400 to-gray-600'}`
        }`}
        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
      >
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ fontSize: forceGameplaySize ? `${fontSize}px` : (card.isMatched ? `${matchedFontSize}px` : `${fontSize}px`) }}
        >
          {card.imageUrl}
        </div>
      </div>
    </div>
  );
};
