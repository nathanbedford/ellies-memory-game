import { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  onClick: () => void;
}

export const Card = ({ card, onClick }: CardProps) => {
  return (
    <div
      onClick={onClick}
      className={`relative aspect-square cursor-pointer transition-transform duration-500 transform-gpu ${card.isMatched ? 'scale-95' : 'hover:scale-105'}`}
      style={{
        transformStyle: card.isMatched ? 'flat' : 'preserve-3d',
        transform: card.isFlipped || card.isMatched ? 'rotateY(180deg)' : 'rotateY(0deg)'
      }}
    >
      {/* Card Back */}
      <div
        className="absolute inset-0 w-full h-full rounded-lg shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-indigo-300"
        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
      >
        <div className="text-white text-4xl font-bold">?</div>
      </div>
      
      {/* Card Front */}
      <div 
        className={`absolute inset-0 w-full h-full rounded-lg shadow-lg overflow-hidden bg-gradient-to-br ${card.gradient || 'from-gray-400 to-gray-600'}`}
        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
      >
        <div className="w-full h-full flex items-center justify-center text-6xl">
          {card.imageUrl}
        </div>
      </div>
    </div>
  );
};
