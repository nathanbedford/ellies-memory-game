import { useMemo, useRef, useEffect, useState } from 'react';
import { CardLightbox } from './CardLightbox';
import { Card } from './Card';
import { Card as CardType } from '../types';
import type { CardBackOption } from '../hooks/useCardBackSelector';

interface GameBoardProps {
  cards: CardType[];
  onCardClick: (cardId: string) => void;
  cardSize?: number;
  isAnimating?: boolean;
  useWhiteCardBackground?: boolean;
  emojiSizePercentage?: number;
  cardBack?: CardBackOption;
}

interface CardAnimationData {
  startX: number;
  startY: number;
  rotation: number;
}

export const GameBoard = ({ cards, onCardClick, cardSize = 100, isAnimating = false, useWhiteCardBackground = false, emojiSizePercentage = 72, cardBack }: GameBoardProps) => {
  const [lightboxCardId, setLightboxCardId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // Monitor card state changes for debugging
  useEffect(() => {
    const flippedCards = cards.filter(c => c.isFlipped && !c.isMatched);
    const flyingCards = cards.filter(c => c.isFlyingToPlayer);
    const matchedCards = cards.filter(c => c.isMatched);
    
    console.log('[CARD STATE] Cards state changed', JSON.stringify({
      totalCards: cards.length,
      flippedCardsCount: flippedCards.length,
      flippedCards: flippedCards.map(c => ({ id: c.id, isFlipped: c.isFlipped, isMatched: c.isMatched })),
      flyingCardsCount: flyingCards.length,
      matchedCardsCount: matchedCards.length,
      timestamp: new Date().toISOString()
    }));
  }, [cards]);
  
  // Generate random starting positions and rotations for each card
  const animationData = useMemo<CardAnimationData[]>(() => {
    if (!isAnimating) return [];
    
    // Get the game board container position (we'll need to calculate offsets relative to viewport)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    return cards.map((_, index) => {
      // Calculate card's position in grid
      const col = index % 8;
      const row = Math.floor(index / 8);
      
      // Estimate card's final position (center of game board)
      const boardWidth = (cardSize * 8) + (8 * 7); // 8 cards + 7 gaps
      const boardLeft = (viewportWidth - boardWidth) / 2;
      const cardCenterX = boardLeft + (col * (cardSize + 8)) + (cardSize / 2);
      const cardCenterY = viewportHeight / 2 + (row * (cardSize + 8)) - (cardSize / 2);
      
      // Random edge: 0 = top, 1 = right, 2 = bottom, 3 = left
      const edge = Math.floor(Math.random() * 4);
      
      // Calculate offset from card's final position to screen edge
      let offsetX: number, offsetY: number;
      
      switch (edge) {
        case 0: // Top - card comes from above
          offsetX = (Math.random() - 0.5) * 400; // Some horizontal variation
          offsetY = -viewportHeight - cardCenterY - 200; // Way above the card
          break;
        case 1: // Right - card comes from right
          offsetX = viewportWidth - cardCenterX + 200; // Way to the right
          offsetY = (Math.random() - 0.5) * 400; // Some vertical variation
          break;
        case 2: // Bottom - card comes from below
          offsetX = (Math.random() - 0.5) * 400; // Some horizontal variation
          offsetY = viewportHeight - cardCenterY + 200; // Way below the card
          break;
        case 3: // Left - card comes from left
          offsetX = -cardCenterX - 200; // Way to the left
          offsetY = (Math.random() - 0.5) * 400; // Some vertical variation
          break;
        default:
          offsetX = 0;
          offsetY = -viewportHeight;
      }
      
      // Random rotation between -720 and 720 degrees (2 full spins either direction)
      const rotation = (Math.random() - 0.5) * 1440;
      
      return {
        startX: offsetX,
        startY: offsetY,
        rotation
      };
    });
  }, [isAnimating, cardSize, cards]);

  // Calculate fly-to-player animation data
  const flyToPlayerData = useMemo(() => {
    const flyingCards = cards.filter(c => c.isFlyingToPlayer);
    console.log('[FLY DATA] Calculating fly-to-player data', {
      totalCards: cards.length,
      flyingCardsCount: flyingCards.length,
      flyingCards: flyingCards.map(c => ({
        id: c.id,
        isFlyingToPlayer: c.isFlyingToPlayer,
        flyingToPlayerId: c.flyingToPlayerId
      })),
      cardSize,
      viewport: { width: window.innerWidth, height: window.innerHeight }
    });
    
    const result = cards.map((card) => {
      if (!card.isFlyingToPlayer) return null;
      
      // Get the actual DOM position of the card using the ref
      const cardElement = cardRefs.current.get(card.id);
      if (!cardElement) {
        console.warn('[FLY DATA] Card element not found in refs', { cardId: card.id });
        return null;
      }
      
      // Get the actual bounding rectangle
      const rect = cardElement.getBoundingClientRect();
      
      // Calculate card's actual center position from DOM
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;
      
      // Calculate target position (next to player name)
      // Player 1 is on the left, Player 2 is on the right
      const headerY = 120; // Approximate header Y position
      const viewportWidth = window.innerWidth;
      const targetX = card.flyingToPlayerId === 1 
        ? viewportWidth * 0.25 // Left side for Player 1
        : viewportWidth * 0.75; // Right side for Player 2
      
      // Calculate rotation angle based on direction from card to player name
      const deltaX = targetX - cardCenterX;
      const deltaY = headerY - cardCenterY;
      const rotationAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      
      // Final position: continue off screen above the player name
      const finalY = -cardSize - 50; // Off screen above
      
      const flyData = {
        startX: rect.left,
        startY: rect.top,
        endX: targetX - cardSize / 2,
        endY: headerY - cardSize / 2,
        finalY: finalY,
        rotationAngle: rotationAngle,
        playerId: card.flyingToPlayerId
      };
      
      console.log('[FLY DATA] Calculated fly data for card', {
        cardId: card.id,
        actualRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        positions: {
          start: { x: flyData.startX, y: flyData.startY },
          end: { x: flyData.endX, y: flyData.endY },
          final: { x: flyData.endX, y: flyData.finalY }
        },
        rotationAngle: flyData.rotationAngle,
        playerId: flyData.playerId
      });
      
      return flyData;
    });
    
    const validResults = result.filter(r => r !== null);
    console.log('[FLY DATA] Fly data calculation complete', {
      totalResults: result.length,
      validResults: validResults.length,
      validCardIds: validResults.map((r) => cards.find(c => c.isFlyingToPlayer && result.indexOf(r) === cards.indexOf(c))?.id)
    });
    
    return result;
  }, [cards, cardSize]);

  return (
    <>
      {/* Flying cards overlay */}
      {cards.map((card, index) => {
        const flyData = flyToPlayerData[index];
        
        // Log all cards being processed
        if (card.isFlyingToPlayer) {
          console.log('[RENDER] Card is marked as flying', {
            cardId: card.id,
            index,
            hasFlyData: !!flyData,
            flyData: flyData ? {
              startX: flyData.startX,
              startY: flyData.startY,
              endX: flyData.endX,
              endY: flyData.endY,
              rotationAngle: flyData.rotationAngle
            } : null
          });
        }
        
        if (!card.isFlyingToPlayer || !flyData) {
          if (card.isFlyingToPlayer && !flyData) {
            console.warn('[RENDER] ⚠️ Card marked as flying but no fly data!', {
              cardId: card.id,
              index,
              cardState: {
                isFlyingToPlayer: card.isFlyingToPlayer,
                flyingToPlayerId: card.flyingToPlayerId
              }
            });
          }
          return null;
        }
        
        console.log('[RENDER] ✓ Rendering flying card overlay', {
          cardId: card.id,
          style: {
            left: `${flyData.startX}px`,
            top: `${flyData.startY}px`,
            '--end-x': `${flyData.endX - flyData.startX}px`,
            '--end-y': `${flyData.endY - flyData.startY}px`,
            '--final-y': `${flyData.finalY - flyData.startY}px`,
            '--rotation-angle': `${flyData.rotationAngle}deg`
          }
        });
        
        return (
          <div
            key={`flying-${card.id}`}
            className="fixed z-50 card-fly-to-player"
            style={{
              left: `${flyData.startX}px`,
              top: `${flyData.startY}px`,
              '--end-x': `${flyData.endX - flyData.startX}px`,
              '--end-y': `${flyData.endY - flyData.startY}px`,
              '--final-y': `${flyData.finalY - flyData.startY}px`,
              '--rotation-angle': `${flyData.rotationAngle}deg`,
            } as React.CSSProperties & {
              '--end-x': string;
              '--end-y': string;
              '--final-y': string;
              '--rotation-angle': string;
            }}
          >
            <Card
              card={card}
              onClick={() => setLightboxCardId(card.id)}
              size={cardSize}
              useWhiteBackground={useWhiteCardBackground}
              emojiSizePercentage={emojiSizePercentage}
              cardBack={cardBack}
            />
          </div>
        );
      })}
      
      <CardLightbox
        isOpen={!!lightboxCardId}
        onClose={() => setLightboxCardId(null)}
        card={lightboxCardId ? cards.find(c => c.id === lightboxCardId) || null : null}
      />

      <div 
        ref={boardRef}
        className="grid grid-cols-8 gap-2 max-w-none mx-auto justify-center"
        style={{ 
          perspective: '1000px',
          width: `${(cardSize * 8) + (8 * 7)}px` // 8 cards + 7 gaps
        }}
      >
        {cards.map((card, index) => {
          const shouldShowPlaceholder = card.isMatched || card.isFlyingToPlayer;
          
          if (shouldShowPlaceholder) {
            console.log('[RENDER] Showing placeholder for card', {
              cardId: card.id,
              index,
              isMatched: card.isMatched,
              isFlyingToPlayer: card.isFlyingToPlayer,
              reason: card.isMatched ? 'matched' : 'flying'
            });
          }
          
          return shouldShowPlaceholder ? (
            // Placeholder for matched cards (or cards that are flying)
            <div
              key={card.id}
              className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 opacity-15"
              style={{ 
                width: `${cardSize}px`, 
                height: `${cardSize}px` 
              }}
            />
          ) : (
            <div
              key={card.id}
              ref={(el) => {
                if (el) {
                  cardRefs.current.set(card.id, el);
                } else {
                  cardRefs.current.delete(card.id);
                }
              }}
              className={isAnimating ? 'card-fly-in' : ''}
              style={{
                animationDelay: isAnimating ? `${index * 30}ms` : '0ms',
                '--start-x': isAnimating && animationData[index] ? `${animationData[index].startX}px` : '0px',
                '--start-y': isAnimating && animationData[index] ? `${animationData[index].startY}px` : '0px',
                '--rotation': isAnimating && animationData[index] ? `${animationData[index].rotation}deg` : '0deg',
              } as React.CSSProperties & {
                '--start-x': string;
                '--start-y': string;
                '--rotation': string;
              }}
            >
              <Card
                card={card}
                onClick={() => onCardClick(card.id)}
                size={cardSize}
                useWhiteBackground={useWhiteCardBackground}
                emojiSizePercentage={emojiSizePercentage}
                cardBack={cardBack}
              />
            </div>
          );
        })}
      </div>
    </>
  );
};
