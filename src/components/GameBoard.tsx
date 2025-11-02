import { Card } from './Card';
import { Card as CardType } from '../types';

interface GameBoardProps {
  cards: CardType[];
  onCardClick: (cardId: string) => void;
}

export const GameBoard = ({ cards, onCardClick }: GameBoardProps) => {
  return (
    <div 
      className="grid grid-cols-6 gap-3 max-w-4xl mx-auto"
      style={{ perspective: '1000px' }}
    >
      {cards.map((card) => (
        card.isMatched ? (
          // Empty placeholder for matched cards
          <div
            key={card.id}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 opacity-30"
          />
        ) : (
          <Card
            key={card.id}
            card={card}
            onClick={() => onCardClick(card.id)}
          />
        )
      ))}
    </div>
  );
};
