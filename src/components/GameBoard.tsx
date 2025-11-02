import { Card } from './Card';
import { Card as CardType } from '../types';

interface GameBoardProps {
  cards: CardType[];
  onCardClick: (cardId: string) => void;
  cardSize?: number;
}

export const GameBoard = ({ cards, onCardClick, cardSize = 100 }: GameBoardProps) => {
  return (
    <div 
      className="grid grid-cols-6 gap-2 max-w-none mx-auto justify-center"
      style={{ 
        perspective: '1000px',
        width: `${(cardSize * 6) + (8 * 5)}px` // 6 cards + 5 gaps
      }}
    >
      {cards.map((card) => (
        card.isMatched ? (
          // Empty placeholder for matched cards
          <div
            key={card.id}
            className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 opacity-30"
            style={{ 
              width: `${cardSize}px`, 
              height: `${cardSize}px` 
            }}
          />
        ) : (
          <Card
            key={card.id}
            card={card}
            onClick={() => onCardClick(card.id)}
            size={cardSize}
          />
        )
      ))}
    </div>
  );
};
