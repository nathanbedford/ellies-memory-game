import { useState, useMemo, useEffect, useCallback } from 'react';
import { CardPack, CardPackOption } from '../types';
import type { CardImage } from '../services/game/GameEngine';
import { CARD_DECKS } from '../data/cardDecks';

// Create CARD_PACKS after CARD_DECKS is defined to avoid evaluation issues
export const CARD_PACKS: CardPackOption[] = CARD_DECKS.map(deck => ({
  id: deck.id,
  name: deck.name,
  emoji: deck.emoji
}));

/**
 * Fisher-Yates shuffle algorithm for arrays
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get a random subset of cards from a deck.
 * Used when the player selects fewer pairs than the full deck has.
 * 
 * @param images - Full array of card images from the deck
 * @param pairCount - Number of pairs to select
 * @returns Randomly selected subset of card images
 */
export function getRandomCardSubset(images: CardImage[], pairCount: number): CardImage[] {
  // If requesting all or more cards than available, return all (shuffled for variety)
  if (pairCount >= images.length) {
    return shuffleArray(images);
  }
  
  // Shuffle and take the first N cards
  const shuffled = shuffleArray(images);
  return shuffled.slice(0, pairCount);
}

export const useCardPacks = () => {
  const [selectedPack, setSelectedPack] = useState<CardPack>(() => {
    const saved = localStorage.getItem('cardPack');
    return (saved as CardPack) || 'animals';
  });

  const currentPackImages = useMemo<CardImage[]>(() => {
    const deck = CARD_DECKS.find(d => d.id === selectedPack) || CARD_DECKS[0];

    return deck.cards.map((card) => ({
      id: card.id,
      url: card.imageUrl || card.emoji,
      gradient: card.gradient,
    }));
  }, [selectedPack]);

  const getCurrentPackImages = useCallback(() => currentPackImages, [currentPackImages]);

  // Preload images when animals-real, ocean-real, emotions-real, insects-real, jungle-animals-real, construction-real, or animals-from-china-real deck is selected
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
    } else if (selectedPack === 'emotions-real') {
      const deck = CARD_DECKS.find(d => d.id === 'emotions-real');
      if (deck) {
        deck.cards.forEach((card) => {
          if (card.imageUrl) {
            const img = new Image();
            img.src = card.imageUrl;
          }
        });
      }
    } else if (selectedPack === 'insects-real') {
      const deck = CARD_DECKS.find(d => d.id === 'insects-real');
      if (deck) {
        deck.cards.forEach((card) => {
          if (card.imageUrl) {
            const img = new Image();
            img.src = card.imageUrl;
          }
        });
      }
    } else if (selectedPack === 'jungle-animals-real') {
      const deck = CARD_DECKS.find(d => d.id === 'jungle-animals-real');
      if (deck) {
        deck.cards.forEach((card) => {
          if (card.imageUrl) {
            const img = new Image();
            img.src = card.imageUrl;
          }
        });
      }
    } else if (selectedPack === 'construction-real') {
      const deck = CARD_DECKS.find(d => d.id === 'construction-real');
      if (deck) {
        deck.cards.forEach((card) => {
          if (card.imageUrl) {
            const img = new Image();
            img.src = card.imageUrl;
          }
        });
      }
    } else if (selectedPack === 'animals-from-china-real') {
      const deck = CARD_DECKS.find(d => d.id === 'animals-from-china-real');
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

  const setSelectedPackWithStorage = useCallback((pack: CardPack) => {
    setSelectedPack(pack);
    localStorage.setItem('cardPack', pack);
  }, []);

  /**
   * Get a subset of images from the current pack for a specific pair count.
   * Used when starting a game with fewer pairs than the full deck.
   */
  const getPackImagesForPairCount = useCallback((pairCount: number): CardImage[] => {
    return getRandomCardSubset(currentPackImages, pairCount);
  }, [currentPackImages]);

  return {
    selectedPack,
    setSelectedPack: setSelectedPackWithStorage,
    getCurrentPackImages,
    getPackImagesForPairCount,
    currentPackImages,
    cardPacks: CARD_PACKS
  };
};
