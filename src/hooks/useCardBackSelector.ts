import { useState } from 'react';

export type CardBackType = 'default' | 'emoji' | 'image' | 'blue';

export interface CardBackOption {
  id: CardBackType;
  name: string;
  emoji?: string;
  imageUrl?: string;
  gradient?: string;
  radialGradient?: string;
  solidColor?: string;
}

export const CARD_BACK_OPTIONS: CardBackOption[] = [
  {
    id: 'image',
    name: 'Matchimus',
    imageUrl: '/matchy-min.png'
  },
  {
    id: 'default',
    name: 'Default Purple',
    gradient: 'from-indigo-500 to-purple-600',
    emoji: '?'
  },
  {
    id: 'emoji',
    name: 'Question Mark',
    emoji: '❓',
    gradient: 'from-indigo-500 to-purple-600'
  },
  {
    id: 'blue',
    name: 'Royal Blue',
    solidColor: '#4169E1'
  }
];

export const useCardBackSelector = () => {
  const [selectedCardBack, setSelectedCardBack] = useState<CardBackType>(() => {
    const saved = localStorage.getItem('cardBack');
    return (saved as CardBackType) || 'default';
  });

  const getCurrentCardBack = () => {
    const option = CARD_BACK_OPTIONS.find(cb => cb.id === selectedCardBack);
    return option || CARD_BACK_OPTIONS[0];
  };

  const setCardBack = (cardBack: CardBackType) => {
    setSelectedCardBack(cardBack);
    localStorage.setItem('cardBack', cardBack);
  };

  return {
    selectedCardBack,
    setSelectedCardBack: setCardBack,
    getCurrentCardBack,
    cardBackOptions: CARD_BACK_OPTIONS
  };
};

