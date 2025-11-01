import { useState, useMemo } from 'react';
import { CardPack, CardPackOption } from '../types';

export const CARD_PACKS: CardPackOption[] = [
  { id: 'animals', name: 'Animals', emoji: '🦁' },
  { id: 'plants', name: 'Plants', emoji: '🌿' },
  { id: 'buildings', name: 'Buildings', emoji: '🏛️' },
  { id: 'colors', name: 'Colors', emoji: '🎨' }
];

const ANIMAL_CARDS = [
  { 
    id: 'lion', 
    emoji: '🦁',
    gradient: 'from-amber-400 to-orange-600'
  },
  { 
    id: 'elephant', 
    emoji: '🐘',
    gradient: 'from-gray-400 to-gray-600'
  },
  { 
    id: 'dog', 
    emoji: '🐕',
    gradient: 'from-amber-700 to-amber-900'
  },
  { 
    id: 'cat', 
    emoji: '🐈',
    gradient: 'from-orange-400 to-orange-600'
  },
  { 
    id: 'rabbit', 
    emoji: '🐰',
    gradient: 'from-gray-100 to-gray-300'
  },
  { 
    id: 'bird', 
    emoji: '🦅',
    gradient: 'from-blue-400 to-blue-600'
  },
  { 
    id: 'fish', 
    emoji: '🐠',
    gradient: 'from-red-400 to-red-600'
  },
  { 
    id: 'panda', 
    emoji: '🐼',
    gradient: 'from-gray-200 to-gray-400'
  }
];

const PLANT_CARDS = [
  { 
    id: 'rose', 
    emoji: '🌹',
    gradient: 'from-red-400 to-pink-600'
  },
  { 
    id: 'tulip', 
    emoji: '🌷',
    gradient: 'from-pink-400 to-purple-600'
  },
  { 
    id: 'sunflower', 
    emoji: '🌻',
    gradient: 'from-yellow-300 to-orange-500'
  },
  { 
    id: 'tree', 
    emoji: '🌳',
    gradient: 'from-green-500 to-green-700'
  },
  { 
    id: 'cactus', 
    emoji: '🌵',
    gradient: 'from-green-600 to-green-800'
  },
  { 
    id: 'leaf', 
    emoji: '🍃',
    gradient: 'from-green-400 to-green-600'
  },
  { 
    id: 'flower', 
    emoji: '🌸',
    gradient: 'from-purple-400 to-pink-600'
  },
  { 
    id: 'mushroom', 
    emoji: '🍄',
    gradient: 'from-red-500 to-orange-600'
  }
];

const BUILDING_CARDS = [
  { 
    id: 'house', 
    emoji: '🏠',
    gradient: 'from-red-600 to-red-800'
  },
  { 
    id: 'castle', 
    emoji: '🏰',
    gradient: 'from-gray-500 to-gray-700'
  },
  { 
    id: 'skyscraper', 
    emoji: '🏢',
    gradient: 'from-blue-500 to-blue-800'
  },
  { 
    id: 'church', 
    emoji: '⛪',
    gradient: 'from-amber-700 to-amber-900'
  },
  { 
    id: 'windmill', 
    emoji: '🏭',
    gradient: 'from-red-500 to-red-700'
  },
  { 
    id: 'lighthouse', 
    emoji: '🗼',
    gradient: 'from-red-500 to-white'
  },
  { 
    id: 'bridge', 
    emoji: '🌉',
    gradient: 'from-stone-500 to-stone-700'
  },
  { 
    id: 'pyramid', 
    emoji: '🔺',
    gradient: 'from-yellow-600 to-yellow-800'
  }
];

const COLOR_CARDS = [
  { 
    id: 'red-circle', 
    emoji: '🔴',
    gradient: 'from-red-500 to-red-700'
  },
  { 
    id: 'blue-square', 
    emoji: '🔵',
    gradient: 'from-blue-400 to-blue-700'
  },
  { 
    id: 'green-triangle', 
    emoji: '🟢',
    gradient: 'from-green-400 to-green-700'
  },
  { 
    id: 'yellow-star', 
    emoji: '🟡',
    gradient: 'from-yellow-400 to-yellow-600'
  },
  { 
    id: 'purple-hexagon', 
    emoji: '🟣',
    gradient: 'from-purple-400 to-purple-700'
  },
  { 
    id: 'orange-diamond', 
    emoji: '🟠',
    gradient: 'from-orange-400 to-orange-700'
  },
  { 
    id: 'pink-heart', 
    emoji: '💗',
    gradient: 'from-pink-400 to-pink-700'
  },
  { 
    id: 'teal-wave', 
    emoji: '🩵',
    gradient: 'from-teal-400 to-teal-700'
  }
];

export const useCardPacks = () => {
  const [selectedPack, setSelectedPack] = useState<CardPack>('animals');

  const getCurrentPackImages = useMemo(() => {
    const getPackImages = (pack: CardPack) => {
      switch (pack) {
        case 'animals':
          return ANIMAL_CARDS;
        case 'plants':
          return PLANT_CARDS;
        case 'buildings':
          return BUILDING_CARDS;
        case 'colors':
          return COLOR_CARDS;
        default:
          return ANIMAL_CARDS;
      }
    };

    const cards = getPackImages(selectedPack);
    return cards.map((card) => ({
      id: card.id,
      url: card.emoji,
      gradient: card.gradient
    }));
  }, [selectedPack]);

  return {
    selectedPack,
    setSelectedPack,
    getCurrentPackImages,
    cardPacks: CARD_PACKS
  };
};
