import { CardPack } from '../types';

// Helper function to get image URL for animals-real deck
// Images should be in public folder for Vite to serve them
const getAnimalImageUrl = (animalId: string): string => {
  return `/deck-images/animals/${animalId}.jpg`;
};

// Helper function to get image URL for ocean-real deck
const getOceanImageUrl = (oceanId: string): string => {
  return `/deck-images/ocean-animals/${oceanId}.jpg`;
};

export interface CardData {
  id: string;
  emoji: string;
  gradient?: string;
  imageUrl?: string; // Optional image URL for decks that use images instead of emojis
}

export interface CardDeck {
  id: CardPack;
  name: string;
  emoji: string;
  cards: CardData[];
}

export const CARD_DECKS: CardDeck[] = [
  {
    id: 'animals',
    name: 'Animals',
    emoji: '🦁',
    cards: [
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
      },
      { 
        id: 'monkey', 
        emoji: '🐵',
        gradient: 'from-amber-500 to-amber-700'
      },
      { 
        id: 'tiger', 
        emoji: '🐯',
        gradient: 'from-orange-500 to-orange-700'
      },
      { 
        id: 'bear', 
        emoji: '🐻',
        gradient: 'from-amber-600 to-amber-800'
      },
      { 
        id: 'fox', 
        emoji: '🦊',
        gradient: 'from-orange-400 to-red-600'
      },
      { 
        id: 'pig', 
        emoji: '🐷',
        gradient: 'from-pink-300 to-pink-500'
      },
      { 
        id: 'cow', 
        emoji: '🐮',
        gradient: 'from-black to-gray-600'
      },
      { 
        id: 'horse', 
        emoji: '🐴',
        gradient: 'from-amber-500 to-brown-700'
      },
      { 
        id: 'sheep', 
        emoji: '🐑',
        gradient: 'from-white to-gray-200'
      },
      { 
        id: 'chicken', 
        emoji: '🐔',
        gradient: 'from-red-500 to-orange-500'
      },
      { 
        id: 'duck', 
        emoji: '🦆',
        gradient: 'from-yellow-300 to-yellow-500'
      },
      { 
        id: 'owl', 
        emoji: '🦉',
        gradient: 'from-amber-700 to-brown-800'
      },
      { 
        id: 'butterfly', 
        emoji: '🦋',
        gradient: 'from-purple-300 to-pink-500'
      }
    ]
  },
  {
    id: 'animals-real',
    name: 'Animals (Real)',
    emoji: '🦁',
    cards: [
      { 
        id: 'lion', 
        emoji: '🦁',
        gradient: 'from-amber-400 to-orange-600',
        imageUrl: getAnimalImageUrl('lion')
      },
      { 
        id: 'elephant', 
        emoji: '🐘',
        gradient: 'from-gray-400 to-gray-600',
        imageUrl: getAnimalImageUrl('elephant')
      },
      { 
        id: 'dog', 
        emoji: '🐕',
        gradient: 'from-amber-700 to-amber-900',
        imageUrl: getAnimalImageUrl('dog')
      },
      { 
        id: 'cat', 
        emoji: '🐈',
        gradient: 'from-orange-400 to-orange-600',
        imageUrl: getAnimalImageUrl('cat')
      },
      { 
        id: 'rabbit', 
        emoji: '🐰',
        gradient: 'from-gray-100 to-gray-300',
        imageUrl: getAnimalImageUrl('rabbit')
      },
      { 
        id: 'bird', 
        emoji: '🦅',
        gradient: 'from-blue-400 to-blue-600',
        imageUrl: getAnimalImageUrl('bird')
      },
      { 
        id: 'fish', 
        emoji: '🐠',
        gradient: 'from-red-400 to-red-600',
        imageUrl: getAnimalImageUrl('fish')
      },
      { 
        id: 'panda', 
        emoji: '🐼',
        gradient: 'from-gray-200 to-gray-400',
        imageUrl: getAnimalImageUrl('panda')
      },
      { 
        id: 'monkey', 
        emoji: '🐵',
        gradient: 'from-amber-500 to-amber-700',
        imageUrl: getAnimalImageUrl('monkey')
      },
      { 
        id: 'tiger', 
        emoji: '🐯',
        gradient: 'from-orange-500 to-orange-700',
        imageUrl: getAnimalImageUrl('tiger')
      },
      { 
        id: 'bear', 
        emoji: '🐻',
        gradient: 'from-amber-600 to-amber-800',
        imageUrl: getAnimalImageUrl('bear')
      },
      { 
        id: 'fox', 
        emoji: '🦊',
        gradient: 'from-orange-400 to-red-600',
        imageUrl: getAnimalImageUrl('fox')
      },
      { 
        id: 'pig', 
        emoji: '🐷',
        gradient: 'from-pink-300 to-pink-500',
        imageUrl: getAnimalImageUrl('pig')
      },
      { 
        id: 'cow', 
        emoji: '🐮',
        gradient: 'from-black to-gray-600',
        imageUrl: getAnimalImageUrl('cow')
      },
      { 
        id: 'horse', 
        emoji: '🐴',
        gradient: 'from-amber-500 to-brown-700',
        imageUrl: getAnimalImageUrl('horse')
      },
      { 
        id: 'sheep', 
        emoji: '🐑',
        gradient: 'from-white to-gray-200',
        imageUrl: getAnimalImageUrl('sheep')
      },
      { 
        id: 'chicken', 
        emoji: '🐔',
        gradient: 'from-red-500 to-orange-500',
        imageUrl: getAnimalImageUrl('chicken')
      },
      { 
        id: 'duck', 
        emoji: '🦆',
        gradient: 'from-yellow-300 to-yellow-500',
        imageUrl: getAnimalImageUrl('duck')
      },
      { 
        id: 'owl', 
        emoji: '🦉',
        gradient: 'from-amber-700 to-brown-800',
        imageUrl: getAnimalImageUrl('owl')
      },
      { 
        id: 'butterfly', 
        emoji: '🦋',
        gradient: 'from-purple-300 to-pink-500',
        imageUrl: getAnimalImageUrl('butterfly')
      }
    ]
  },
  {
    id: 'plants',
    name: 'Plants',
    emoji: '🌿',
    cards: [
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
      },
      { 
        id: 'palm-tree', 
        emoji: '🌴',
        gradient: 'from-green-500 to-yellow-600'
      },
      { 
        id: 'herb', 
        emoji: '🌿',
        gradient: 'from-green-400 to-green-500'
      },
      { 
        id: 'seedling', 
        emoji: '🌱',
        gradient: 'from-green-300 to-green-400'
      },
      { 
        id: 'evergreen', 
        emoji: '🌲',
        gradient: 'from-green-600 to-green-900'
      },
      { 
        id: 'cherry-blossom', 
        emoji: '🌺',
        gradient: 'from-pink-300 to-purple-500'
      },
      { 
        id: 'hibiscus', 
        emoji: '🏵️',
        gradient: 'from-red-400 to-pink-500'
      },
      { 
        id: 'four-leaf-clover', 
        emoji: '🍀',
        gradient: 'from-green-300 to-green-500'
      },
      { 
        id: 'wilted-flower', 
        emoji: '🥀',
        gradient: 'from-purple-600 to-gray-600'
      },
      { 
        id: 'corn', 
        emoji: '🌽',
        gradient: 'from-yellow-400 to-yellow-600'
      },
      { 
        id: 'carrot', 
        emoji: '🥕',
        gradient: 'from-orange-400 to-orange-600'
      },
      { 
        id: 'grapes', 
        emoji: '🍇',
        gradient: 'from-purple-500 to-purple-700'
      },
      { 
        id: 'apple', 
        emoji: '🍎',
        gradient: 'from-red-400 to-red-600'
      }
    ]
  },
  {
    id: 'buildings',
    name: 'Buildings',
    emoji: '🏛️',
    cards: [
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
        emoji: '🎡',
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
      },
      { 
        id: 'hospital', 
        emoji: '🏥',
        gradient: 'from-red-400 to-red-600'
      },
      { 
        id: 'hotel', 
        emoji: '🏨',
        gradient: 'from-blue-400 to-blue-600'
      },
      { 
        id: 'office', 
        emoji: '🏬',
        gradient: 'from-gray-400 to-gray-600'
      },
      { 
        id: 'school', 
        emoji: '🏫',
        gradient: 'from-amber-500 to-amber-700'
      },
      { 
        id: 'factory', 
        emoji: '🏭',
        gradient: 'from-gray-600 to-gray-800'
      },
      { 
        id: 'japanese-castle', 
        emoji: '🏯',
        gradient: 'from-red-600 to-red-800'
      },
      { 
        id: 'stadium', 
        emoji: '🏟️',
        gradient: 'from-gray-500 to-gray-700'
      },
      { 
        id: 'airport', 
        emoji: '🛫',
        gradient: 'from-blue-400 to-blue-600'
      },
      { 
        id: 'bank', 
        emoji: '🏦',
        gradient: 'from-gray-400 to-gray-600'
      },
      { 
        id: 'post-office', 
        emoji: '🏣',
        gradient: 'from-red-500 to-red-700'
      },
      { 
        id: 'department-store', 
        emoji: '🏛️',
        gradient: 'from-purple-500 to-purple-700'
      },
      { 
        id: 'convenience-store', 
        emoji: '🏪',
        gradient: 'from-green-500 to-green-700'
      }
    ]
  },
  {
    id: 'colors',
    name: 'Colors',
    emoji: '🎨',
    cards: [
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
      },
      { 
        id: 'brown-square', 
        emoji: '🟤',
        gradient: 'from-amber-700 to-amber-900'
      },
      { 
        id: 'black-circle', 
        emoji: '⚫',
        gradient: 'from-gray-700 to-gray-900'
      },
      { 
        id: 'white-square', 
        emoji: '⚪',
        gradient: 'from-gray-100 to-gray-300'
      },
      { 
        id: 'green-heart', 
        emoji: '💚',
        gradient: 'from-green-500 to-green-600'
      },
      { 
        id: 'blue-heart', 
        emoji: '💙',
        gradient: 'from-blue-500 to-blue-600'
      },
      { 
        id: 'yellow-heart', 
        emoji: '💛',
        gradient: 'from-yellow-400 to-yellow-600'
      },
      { 
        id: 'purple-heart', 
        emoji: '💜',
        gradient: 'from-purple-500 to-purple-700'
      },
      { 
        id: 'red-heart', 
        emoji: '❤️',
        gradient: 'from-red-500 to-red-700'
      },
      { 
        id: 'orange-heart', 
        emoji: '🧡',
        gradient: 'from-orange-500 to-orange-700'
      },
      { 
        id: 'brown-circle', 
        emoji: '🟫',
        gradient: 'from-amber-600 to-amber-800'
      },
      { 
        id: 'large-blue-diamond', 
        emoji: '🔷',
        gradient: 'from-blue-500 to-blue-800'
      },
      { 
        id: 'large-red-diamond', 
        emoji: '🔶',
        gradient: 'from-red-600 to-red-800'
      }
    ]
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    cards: [
      { 
        id: 'fish', 
        emoji: '🐟',
        gradient: 'from-blue-400 to-blue-600'
      },
      { 
        id: 'whale', 
        emoji: '🐋',
        gradient: 'from-blue-600 to-blue-800'
      },
      { 
        id: 'dolphin', 
        emoji: '🐬',
        gradient: 'from-cyan-400 to-cyan-600'
      },
      { 
        id: 'octopus', 
        emoji: '🐙',
        gradient: 'from-purple-400 to-purple-600'
      },
      { 
        id: 'crab', 
        emoji: '🦀',
        gradient: 'from-red-500 to-orange-600'
      },
      { 
        id: 'turtle', 
        emoji: '🐢',
        gradient: 'from-green-500 to-green-700'
      },
      { 
        id: 'jellyfish', 
        emoji: '🪼',
        gradient: 'from-pink-300 to-purple-400'
      },
      { 
        id: 'shark', 
        emoji: '🦈',
        gradient: 'from-gray-500 to-gray-700'
      },
      { 
        id: 'seahorse', 
        emoji: '🦭',
        gradient: 'from-yellow-400 to-orange-500'
      },
      { 
        id: 'shell', 
        emoji: '🐚',
        gradient: 'from-pink-200 to-pink-400'
      },
      { 
        id: 'starfish', 
        emoji: '⭐',
        gradient: 'from-orange-300 to-orange-500'
      },
      { 
        id: 'coral', 
        emoji: '🪸',
        gradient: 'from-red-300 to-pink-500'
      },
      { 
        id: 'squid', 
        emoji: '🦑',
        gradient: 'from-purple-500 to-purple-700'
      },
      { 
        id: 'lobster', 
        emoji: '🦞',
        gradient: 'from-red-600 to-orange-700'
      },
      { 
        id: 'shrimp', 
        emoji: '🦐',
        gradient: 'from-pink-400 to-orange-500'
      },
      { 
        id: 'blowfish', 
        emoji: '🐠',
        gradient: 'from-yellow-400 to-yellow-600'
      },
      { 
        id: 'tropical-fish', 
        emoji: '🐡',
        gradient: 'from-blue-300 to-purple-500'
      },
      { 
        id: 'eel', 
        emoji: '🐍',
        gradient: 'from-gray-600 to-gray-800'
      },
      { 
        id: 'ray', 
        emoji: '🦦',
        gradient: 'from-blue-400 to-blue-700'
      },
      { 
        id: 'pearl', 
        emoji: '💎',
        gradient: 'from-white to-gray-200'
      }
    ]
  },
  {
    id: 'ocean-real',
    name: 'Ocean (Real)',
    emoji: '🌊',
    cards: [
      { 
        id: 'fish', 
        emoji: '🐟',
        gradient: 'from-blue-400 to-blue-600',
        imageUrl: getOceanImageUrl('fish')
      },
      { 
        id: 'whale', 
        emoji: '🐋',
        gradient: 'from-blue-600 to-blue-800',
        imageUrl: getOceanImageUrl('whale')
      },
      { 
        id: 'dolphin', 
        emoji: '🐬',
        gradient: 'from-cyan-400 to-cyan-600',
        imageUrl: getOceanImageUrl('dolphin')
      },
      { 
        id: 'octopus', 
        emoji: '🐙',
        gradient: 'from-purple-400 to-purple-600',
        imageUrl: getOceanImageUrl('octopus')
      },
      { 
        id: 'crab', 
        emoji: '🦀',
        gradient: 'from-red-500 to-orange-600',
        imageUrl: getOceanImageUrl('crab')
      },
      { 
        id: 'turtle', 
        emoji: '🐢',
        gradient: 'from-green-500 to-green-700',
        imageUrl: getOceanImageUrl('turtle')
      },
      { 
        id: 'jellyfish', 
        emoji: '🪼',
        gradient: 'from-pink-300 to-purple-400',
        imageUrl: getOceanImageUrl('jellyfish')
      },
      { 
        id: 'shark', 
        emoji: '🦈',
        gradient: 'from-gray-500 to-gray-700',
        imageUrl: getOceanImageUrl('shark')
      },
      { 
        id: 'seahorse', 
        emoji: '🦭',
        gradient: 'from-yellow-400 to-orange-500',
        imageUrl: getOceanImageUrl('seahorse')
      },
      { 
        id: 'shell', 
        emoji: '🐚',
        gradient: 'from-pink-200 to-pink-400',
        imageUrl: getOceanImageUrl('shell')
      },
      { 
        id: 'starfish', 
        emoji: '⭐',
        gradient: 'from-orange-300 to-orange-500',
        imageUrl: getOceanImageUrl('starfish')
      },
      { 
        id: 'coral', 
        emoji: '🪸',
        gradient: 'from-red-300 to-pink-500',
        imageUrl: getOceanImageUrl('coral')
      },
      { 
        id: 'squid', 
        emoji: '🦑',
        gradient: 'from-purple-500 to-purple-700',
        imageUrl: getOceanImageUrl('squid')
      },
      { 
        id: 'lobster', 
        emoji: '🦞',
        gradient: 'from-red-600 to-orange-700',
        imageUrl: getOceanImageUrl('lobster')
      },
      { 
        id: 'shrimp', 
        emoji: '🦐',
        gradient: 'from-pink-400 to-orange-500',
        imageUrl: getOceanImageUrl('shrimp')
      },
      { 
        id: 'blowfish', 
        emoji: '🐠',
        gradient: 'from-yellow-400 to-yellow-600',
        imageUrl: getOceanImageUrl('blowfish')
      },
      { 
        id: 'tropical-fish', 
        emoji: '🐡',
        gradient: 'from-blue-300 to-purple-500',
        imageUrl: getOceanImageUrl('tropical-fish')
      },
      { 
        id: 'eel', 
        emoji: '🐍',
        gradient: 'from-gray-600 to-gray-800',
        imageUrl: getOceanImageUrl('eel')
      },
      { 
        id: 'ray', 
        emoji: '🦦',
        gradient: 'from-blue-400 to-blue-700',
        imageUrl: getOceanImageUrl('ray')
      },
      { 
        id: 'pearl', 
        emoji: '💎',
        gradient: 'from-white to-gray-200',
        imageUrl: getOceanImageUrl('pearl')
      }
    ]
  },
  {
    id: 'construction',
    name: 'Construction',
    emoji: '🔨',
    cards: [
      { 
        id: 'hammer', 
        emoji: '🔨',
        gradient: 'from-amber-600 to-amber-800'
      },
      { 
        id: 'axe', 
        emoji: '🪓',
        gradient: 'from-gray-600 to-gray-800'
      },
      { 
        id: 'pickaxe', 
        emoji: '⛏️',
        gradient: 'from-gray-500 to-gray-700'
      },
      { 
        id: 'wrench', 
        emoji: '🔧',
        gradient: 'from-gray-400 to-gray-600'
      },
      { 
        id: 'screwdriver', 
        emoji: '🪛',
        gradient: 'from-blue-500 to-blue-700'
      },
      { 
        id: 'nut-bolt', 
        emoji: '🔩',
        gradient: 'from-gray-500 to-gray-700'
      },
      { 
        id: 'construction', 
        emoji: '🏗️',
        gradient: 'from-orange-500 to-orange-700'
      },
      { 
        id: 'brick', 
        emoji: '🧱',
        gradient: 'from-red-600 to-red-800'
      },
      { 
        id: 'saw', 
        emoji: '🪚',
        gradient: 'from-gray-600 to-gray-800'
      },
      { 
        id: 'toolbox', 
        emoji: '🧰',
        gradient: 'from-red-500 to-red-700'
      },
      { 
        id: 'level', 
        emoji: '📐',
        gradient: 'from-gray-400 to-gray-600'
      },
      { 
        id: 'hard-hat', 
        emoji: '👷',
        gradient: 'from-yellow-400 to-yellow-600'
      },
      { 
        id: 'scissors', 
        emoji: '✂️',
        gradient: 'from-gray-500 to-gray-700'
      },
      { 
        id: 'chainsaw', 
        emoji: '🔪',
        gradient: 'from-gray-600 to-gray-800'
      },
      { 
        id: 'nail-polish', 
        emoji: '💅',
        gradient: 'from-pink-400 to-pink-600'
      },
      { 
        id: 'bucket', 
        emoji: '🪣',
        gradient: 'from-blue-400 to-blue-600'
      },
      { 
        id: 'magnifying-glass', 
        emoji: '🔍',
        gradient: 'from-gray-300 to-gray-500'
      },
      { 
        id: 'crane', 
        emoji: '🏋️',
        gradient: 'from-yellow-500 to-orange-600'
      },
      { 
        id: 'ruler', 
        emoji: '📏',
        gradient: 'from-blue-400 to-blue-600'
      },
      { 
        id: 'gear', 
        emoji: '⚙️',
        gradient: 'from-gray-500 to-gray-700'
      }
    ]
  }
];

