import { useState, useMemo, useCallback } from 'react';
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

  // Note: Image preloading is now handled by useImagePreloader hook in App.tsx
  // which preloads all assets (cards, backgrounds, card backs) when user reaches the start game step

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
