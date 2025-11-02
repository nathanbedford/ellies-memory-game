import { useState, useMemo, useEffect } from 'react';
import { CardPack, CardPackOption } from '../types';
import { CARD_DECKS } from '../data/cardDecks';

// Create CARD_PACKS after CARD_DECKS is defined to avoid evaluation issues
export const CARD_PACKS: CardPackOption[] = CARD_DECKS.map(deck => ({
  id: deck.id,
  name: deck.name,
  emoji: deck.emoji
}));

export const useCardPacks = () => {
  const [selectedPack, setSelectedPack] = useState<CardPack>('animals');

  const getCurrentPackImages = useMemo(() => {
    const deck = CARD_DECKS.find(d => d.id === selectedPack) || CARD_DECKS[0];
    
    return deck.cards.map((card) => ({
      id: card.id,
      url: card.imageUrl || card.emoji,
      gradient: card.gradient
    }));
  }, [selectedPack]);

  // Preload images when animals-real or ocean-real deck is selected
  useEffect(() => {
    if (selectedPack === 'animals-real') {
      const deck = CARD_DECKS.find(d => d.id === 'animals-real');
      if (deck) {
        deck.cards.forEach((card) => {
          if (card.imageUrl) {
            const img = new Image();
            img.src = card.imageUrl;
          }
        });
      }
    } else if (selectedPack === 'ocean-real') {
      const deck = CARD_DECKS.find(d => d.id === 'ocean-real');
      if (deck) {
        deck.cards.forEach((card) => {
          if (card.imageUrl) {
            const img = new Image();
            img.src = card.imageUrl;
          }
        });
      }
    }
  }, [selectedPack]);

  return {
    selectedPack,
    setSelectedPack,
    getCurrentPackImages,
    cardPacks: CARD_PACKS
  };
};
