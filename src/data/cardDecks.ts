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

// Helper function to get image URL for emotions-real deck
const getEmotionImageUrl = (emotionId: string): string => {
  return `/deck-images/emotions/${emotionId}.jpg`;
};

// Helper function to get image URL for insects-real deck
const getInsectImageUrl = (insectId: string): string => {
  return `/deck-images/insects/${insectId}.jpg`;
};

// Helper function to get image URL for jungle-animals-real deck
const getJungleAnimalImageUrl = (jungleAnimalId: string): string => {
  return `/deck-images/jungle-animals/${jungleAnimalId}.jpg`;
};

// Helper function to get image URL for plush-cute-animals-real deck
const getPlushAnimalImageUrl = (plushAnimalId: string): string => {
  return `/deck-images/plush-cute-animals/${plushAnimalId}.jpg`;
};

// Helper function to get image URL for construction-real deck
const getConstructionImageUrl = (constructionId: string): string => {
  return `/deck-images/construction/${constructionId}.jpg`;
};

// Helper function to get image URL for animals-from-china deck
const getAnimalsFromChinaImageUrl = (animalId: string): string => {
  return `/deck-images/animals-from-china/${animalId}.jpg`;
};

// Helper function to get image URL for thanksgiving deck
const getThanksgivingImageUrl = (itemId: string): string => {
  return `/deck-images/thanksgiving/${itemId}.jpg`;
};

// Helper function to get image URL for christmas deck
const getChristmasImageUrl = (itemId: string): string => {
  return `/deck-images/christmas/${itemId}.jpg`;
};

// Helper function to get image URL for dinos deck
const getDinosImageUrl = (itemId: string): string => {
  return `/deck-images/dinos/${itemId}.jpg`;
};

// Helper function to get image URL for hotwheels deck
const getHotwheelsImageUrl = (itemId: string): string => {
  return `/deck-images/hotwheels/${itemId}.jpg`;
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
  },
  {
    id: 'emotions-real',
    name: 'Emotions',
    emoji: '😊',
    cards: [
      { 
        id: 'happy', 
        emoji: '😊',
        gradient: 'from-yellow-300 to-yellow-500',
        imageUrl: getEmotionImageUrl('happy')
      },
      { 
        id: 'sad', 
        emoji: '😢',
        gradient: 'from-blue-400 to-blue-600',
        imageUrl: getEmotionImageUrl('sad')
      },
      { 
        id: 'angry', 
        emoji: '😠',
        gradient: 'from-red-500 to-red-700',
        imageUrl: getEmotionImageUrl('angry')
      },
      { 
        id: 'brave', 
        emoji: '😤',
        gradient: 'from-orange-400 to-orange-600',
        imageUrl: getEmotionImageUrl('brave')
      },
      { 
        id: 'curious', 
        emoji: '🤔',
        gradient: 'from-indigo-400 to-indigo-600',
        imageUrl: getEmotionImageUrl('curious')
      },
      { 
        id: 'excited', 
        emoji: '🤩',
        gradient: 'from-yellow-400 to-orange-500',
        imageUrl: getEmotionImageUrl('excited')
      },
      { 
        id: 'scared', 
        emoji: '😨',
        gradient: 'from-purple-400 to-purple-600',
        imageUrl: getEmotionImageUrl('scared')
      },
      { 
        id: 'surprised', 
        emoji: '😲',
        gradient: 'from-yellow-400 to-yellow-600',
        imageUrl: getEmotionImageUrl('surprised')
      },
      { 
        id: 'silly', 
        emoji: '🤪',
        gradient: 'from-pink-300 to-pink-500',
        imageUrl: getEmotionImageUrl('silly')
      },
      { 
        id: 'tired', 
        emoji: '😴',
        gradient: 'from-gray-400 to-gray-600',
        imageUrl: getEmotionImageUrl('tired')
      },
      { 
        id: 'loving', 
        emoji: '🥰',
        gradient: 'from-pink-400 to-red-500',
        imageUrl: getEmotionImageUrl('loving')
      },
      { 
        id: 'very-happy', 
        emoji: '😄',
        gradient: 'from-yellow-300 to-yellow-500',
        imageUrl: getEmotionImageUrl('very-happy')
      },
      { 
        id: 'very-sad', 
        emoji: '😭',
        gradient: 'from-blue-400 to-blue-600',
        imageUrl: getEmotionImageUrl('very-sad')
      },
      { 
        id: 'very-angry', 
        emoji: '😡',
        gradient: 'from-red-500 to-red-700',
        imageUrl: getEmotionImageUrl('very-angry')
      },
      { 
        id: 'very-excited', 
        emoji: '🤗',
        gradient: 'from-yellow-400 to-orange-500',
        imageUrl: getEmotionImageUrl('very-excited')
      },
      { 
        id: 'very-scared', 
        emoji: '😱',
        gradient: 'from-purple-400 to-purple-600',
        imageUrl: getEmotionImageUrl('very-scared')
      },
      { 
        id: 'very-surprised', 
        emoji: '😱',
        gradient: 'from-yellow-400 to-yellow-600',
        imageUrl: getEmotionImageUrl('very-surprised')
      },
      { 
        id: 'very-silly', 
        emoji: '🤣',
        gradient: 'from-pink-300 to-pink-500',
        imageUrl: getEmotionImageUrl('very-silly')
      },
      { 
        id: 'very-tired', 
        emoji: '😴',
        gradient: 'from-gray-400 to-gray-600',
        imageUrl: getEmotionImageUrl('very-tired')
      },
      { 
        id: 'very-loving', 
        emoji: '😍',
        gradient: 'from-pink-400 to-red-500',
        imageUrl: getEmotionImageUrl('very-loving')
      }
    ]
  },
  {
    id: 'insects-real',
    name: 'Insects',
    emoji: '🦋',
    cards: [
      { 
        id: 'ant', 
        emoji: '🐜',
        gradient: 'from-gray-500 to-gray-700',
        imageUrl: getInsectImageUrl('ant')
      },
      { 
        id: 'blue-morpho-butterfly', 
        emoji: '🦋',
        gradient: 'from-blue-400 to-blue-600',
        imageUrl: getInsectImageUrl('blue-morpho-butterfly')
      },
      { 
        id: 'caterpillar', 
        emoji: '🐛',
        gradient: 'from-green-500 to-green-700',
        imageUrl: getInsectImageUrl('caterpillar')
      },
      { 
        id: 'cricket', 
        emoji: '🦗',
        gradient: 'from-green-600 to-green-800',
        imageUrl: getInsectImageUrl('cricket')
      },
      { 
        id: 'dragonfly', 
        emoji: '🪰',
        gradient: 'from-blue-500 to-cyan-600',
        imageUrl: getInsectImageUrl('dragonfly')
      },
      { 
        id: 'firefly', 
        emoji: '✨',
        gradient: 'from-yellow-300 to-yellow-500',
        imageUrl: getInsectImageUrl('firefly')
      },
      { 
        id: 'grasshopper', 
        emoji: '🦗',
        gradient: 'from-green-400 to-green-600',
        imageUrl: getInsectImageUrl('grasshopper')
      },
      { 
        id: 'honeybee', 
        emoji: '🐝',
        gradient: 'from-yellow-400 to-amber-600',
        imageUrl: getInsectImageUrl('honeybee')
      },
      { 
        id: 'hornet', 
        emoji: '🐝',
        gradient: 'from-amber-600 to-orange-700',
        imageUrl: getInsectImageUrl('hornet')
      },
      { 
        id: 'inchworm', 
        emoji: '🐛',
        gradient: 'from-green-400 to-green-600',
        imageUrl: getInsectImageUrl('inchworm')
      },
      { 
        id: 'lacewing', 
        emoji: '🦋',
        gradient: 'from-green-300 to-green-500',
        imageUrl: getInsectImageUrl('lacewing')
      },
      { 
        id: 'ladybug', 
        emoji: '🐞',
        gradient: 'from-red-500 to-red-700',
        imageUrl: getInsectImageUrl('ladybug')
      },
      { 
        id: 'monarch-butterfly', 
        emoji: '🦋',
        gradient: 'from-orange-500 to-amber-600',
        imageUrl: getInsectImageUrl('monarch-butterfly')
      },
      { 
        id: 'moth', 
        emoji: '🦋',
        gradient: 'from-gray-400 to-gray-600',
        imageUrl: getInsectImageUrl('moth')
      },
      { 
        id: 'praying-mantis', 
        emoji: '🦗',
        gradient: 'from-green-500 to-green-700',
        imageUrl: getInsectImageUrl('praying-mantis')
      },
      { 
        id: 'rhinoceros-beetle', 
        emoji: '🪲',
        gradient: 'from-gray-700 to-gray-900',
        imageUrl: getInsectImageUrl('rhinoceros-beetle')
      },
      { 
        id: 'roly-poly', 
        emoji: '🪲',
        gradient: 'from-gray-500 to-gray-700',
        imageUrl: getInsectImageUrl('roly-poly')
      },
      { 
        id: 'stink-bug', 
        emoji: '🪲',
        gradient: 'from-green-600 to-green-800',
        imageUrl: getInsectImageUrl('stink-bug')
      },
      { 
        id: 'swallowtail-butterfly', 
        emoji: '🦋',
        gradient: 'from-yellow-400 to-black',
        imageUrl: getInsectImageUrl('swallowtail-butterfly')
      },
      { 
        id: 'walking-stick', 
        emoji: '🪲',
        gradient: 'from-amber-600 to-amber-800',
        imageUrl: getInsectImageUrl('walking-stick')
      }
    ]
  },
  {
    id: 'jungle-animals-real',
    name: 'Jungle Animals',
    emoji: '🦁',
    cards: [
      { 
        id: 'anteater', 
        emoji: '🐜',
        gradient: 'from-gray-500 to-gray-700',
        imageUrl: getJungleAnimalImageUrl('anteater')
      },
      { 
        id: 'armadillo', 
        emoji: '🦔',
        gradient: 'from-gray-400 to-gray-600',
        imageUrl: getJungleAnimalImageUrl('armadillo')
      },
      { 
        id: 'boa-constrictor', 
        emoji: '🐍',
        gradient: 'from-green-600 to-green-800',
        imageUrl: getJungleAnimalImageUrl('boa-constrictor')
      },
      { 
        id: 'caiman', 
        emoji: '🐊',
        gradient: 'from-green-600 to-green-800',
        imageUrl: getJungleAnimalImageUrl('caiman')
      },
      { 
        id: 'capybara', 
        emoji: '🐹',
        gradient: 'from-amber-600 to-amber-800',
        imageUrl: getJungleAnimalImageUrl('capybara')
      },
      { 
        id: 'harpy-eagle', 
        emoji: '🦅',
        gradient: 'from-gray-600 to-gray-800',
        imageUrl: getJungleAnimalImageUrl('harpy-eagle')
      },
      { 
        id: 'howler-monkey', 
        emoji: '🐵',
        gradient: 'from-amber-500 to-amber-700',
        imageUrl: getJungleAnimalImageUrl('howler-monkey')
      },
      { 
        id: 'iguana', 
        emoji: '🦎',
        gradient: 'from-green-500 to-green-700',
        imageUrl: getJungleAnimalImageUrl('iguana')
      },
      { 
        id: 'jaguar', 
        emoji: '🐆',
        gradient: 'from-amber-600 to-orange-800',
        imageUrl: getJungleAnimalImageUrl('jaguar')
      },
      { 
        id: 'kinkajou', 
        emoji: '🐻',
        gradient: 'from-amber-500 to-amber-700',
        imageUrl: getJungleAnimalImageUrl('kinkajou')
      },
      { 
        id: 'macaw', 
        emoji: '🦜',
        gradient: 'from-red-500 to-blue-600',
        imageUrl: getJungleAnimalImageUrl('macaw')
      },
      { 
        id: 'ocelot', 
        emoji: '🐆',
        gradient: 'from-amber-500 to-orange-700',
        imageUrl: getJungleAnimalImageUrl('ocelot')
      },
      { 
        id: 'piranha', 
        emoji: '🐟',
        gradient: 'from-red-500 to-red-700',
        imageUrl: getJungleAnimalImageUrl('piranha')
      },
      { 
        id: 'poison-dart-frog', 
        emoji: '🐸',
        gradient: 'from-yellow-400 to-blue-600',
        imageUrl: getJungleAnimalImageUrl('poison-dart-frog')
      },
      { 
        id: 'puma', 
        emoji: '🐆',
        gradient: 'from-gray-500 to-gray-700',
        imageUrl: getJungleAnimalImageUrl('puma')
      },
      { 
        id: 'quetzal', 
        emoji: '🦜',
        gradient: 'from-green-400 to-red-500',
        imageUrl: getJungleAnimalImageUrl('quetzal')
      },
      { 
        id: 'sloth', 
        emoji: '🦥',
        gradient: 'from-gray-400 to-gray-600',
        imageUrl: getJungleAnimalImageUrl('sloth')
      },
      { 
        id: 'tamarin', 
        emoji: '🐵',
        gradient: 'from-orange-400 to-orange-600',
        imageUrl: getJungleAnimalImageUrl('tamarin')
      },
      { 
        id: 'tarantula', 
        emoji: '🕷️',
        gradient: 'from-gray-700 to-gray-900',
        imageUrl: getJungleAnimalImageUrl('tarantula')
      },
      { 
        id: 'toucan', 
        emoji: '🦜',
        gradient: 'from-yellow-400 to-blue-600',
        imageUrl: getJungleAnimalImageUrl('toucan')
      }
    ]
  },
  {
    id: 'plush-cute-animals-real',
    name: 'Plush Cute Animals',
    emoji: '🧸',
    cards: [
      { 
        id: 'baby-elephant', 
        emoji: '🐘',
        gradient: 'from-gray-300 to-gray-500',
        imageUrl: getPlushAnimalImageUrl('baby-elephant')
      },
      { 
        id: 'baby-giraffe', 
        emoji: '🦒',
        gradient: 'from-yellow-300 to-amber-500',
        imageUrl: getPlushAnimalImageUrl('baby-giraffe')
      },
      { 
        id: 'baby-tiger', 
        emoji: '🐯',
        gradient: 'from-orange-400 to-orange-600',
        imageUrl: getPlushAnimalImageUrl('baby-tiger')
      },
      { 
        id: 'bunny', 
        emoji: '🐰',
        gradient: 'from-gray-100 to-gray-300',
        imageUrl: getPlushAnimalImageUrl('bunny')
      },
      { 
        id: 'chick', 
        emoji: '🐤',
        gradient: 'from-yellow-300 to-yellow-500',
        imageUrl: getPlushAnimalImageUrl('chick')
      },
      { 
        id: 'chipmunk', 
        emoji: '🐿️',
        gradient: 'from-amber-500 to-amber-700',
        imageUrl: getPlushAnimalImageUrl('chipmunk')
      },
      { 
        id: 'duckling', 
        emoji: '🦆',
        gradient: 'from-yellow-300 to-yellow-500',
        imageUrl: getPlushAnimalImageUrl('duckling')
      },
      { 
        id: 'fawn', 
        emoji: '🦌',
        gradient: 'from-amber-400 to-amber-600',
        imageUrl: getPlushAnimalImageUrl('fawn')
      },
      { 
        id: 'fox', 
        emoji: '🦊',
        gradient: 'from-orange-400 to-red-600',
        imageUrl: getPlushAnimalImageUrl('fox')
      },
      { 
        id: 'hedgehog', 
        emoji: '🦔',
        gradient: 'from-gray-400 to-gray-600',
        imageUrl: getPlushAnimalImageUrl('hedgehog')
      },
      { 
        id: 'kitten', 
        emoji: '🐱',
        gradient: 'from-orange-300 to-orange-500',
        imageUrl: getPlushAnimalImageUrl('kitten')
      },
      { 
        id: 'koala', 
        emoji: '🐨',
        gradient: 'from-gray-200 to-gray-400',
        imageUrl: getPlushAnimalImageUrl('koala')
      },
      { 
        id: 'lamb', 
        emoji: '🐑',
        gradient: 'from-white to-gray-200',
        imageUrl: getPlushAnimalImageUrl('lamb')
      },
      { 
        id: 'otter', 
        emoji: '🦦',
        gradient: 'from-amber-400 to-amber-600',
        imageUrl: getPlushAnimalImageUrl('otter')
      },
      { 
        id: 'panda', 
        emoji: '🐼',
        gradient: 'from-gray-200 to-gray-400',
        imageUrl: getPlushAnimalImageUrl('panda')
      },
      { 
        id: 'penguin', 
        emoji: '🐧',
        gradient: 'from-gray-600 to-gray-800',
        imageUrl: getPlushAnimalImageUrl('penguin')
      },
      { 
        id: 'puppy', 
        emoji: '🐶',
        gradient: 'from-amber-500 to-amber-700',
        imageUrl: getPlushAnimalImageUrl('puppy')
      },
      { 
        id: 'red-panda', 
        emoji: '🐼',
        gradient: 'from-red-500 to-orange-600',
        imageUrl: getPlushAnimalImageUrl('red-panda')
      },
      { 
        id: 'seal-pup', 
        emoji: '🦭',
        gradient: 'from-gray-300 to-gray-500',
        imageUrl: getPlushAnimalImageUrl('seal-pup')
      },
      { 
        id: 'sloth', 
        emoji: '🦥',
        gradient: 'from-gray-400 to-gray-600',
        imageUrl: getPlushAnimalImageUrl('sloth')
      }
    ]
  },
  {
    id: 'construction-real',
    name: 'Construction',
    emoji: '🔨',
    cards: [
      { 
        id: 'asphalt-paver', 
        emoji: '🚧',
        gradient: 'from-gray-500 to-gray-700',
        imageUrl: getConstructionImageUrl('asphalt-paver')
      },
      { 
        id: 'barricades', 
        emoji: '🚧',
        gradient: 'from-orange-500 to-orange-700',
        imageUrl: getConstructionImageUrl('barricades')
      },
      { 
        id: 'boom-lift', 
        emoji: '🏗️',
        gradient: 'from-yellow-500 to-orange-600',
        imageUrl: getConstructionImageUrl('boom-lift')
      },
      { 
        id: 'bulldozer', 
        emoji: '🚜',
        gradient: 'from-yellow-500 to-yellow-700',
        imageUrl: getConstructionImageUrl('bulldozer')
      },
      { 
        id: 'cement-mixer-truck', 
        emoji: '🚛',
        gradient: 'from-gray-400 to-gray-600',
        imageUrl: getConstructionImageUrl('cement-mixer-truck')
      },
      { 
        id: 'concrete-pump-truck', 
        emoji: '🚛',
        gradient: 'from-gray-500 to-gray-700',
        imageUrl: getConstructionImageUrl('concrete-pump-truck')
      },
      { 
        id: 'dump-truck', 
        emoji: '🚛',
        gradient: 'from-yellow-600 to-orange-700',
        imageUrl: getConstructionImageUrl('dump-truck')
      },
      { 
        id: 'excavator', 
        emoji: '🚜',
        gradient: 'from-yellow-500 to-yellow-700',
        imageUrl: getConstructionImageUrl('excavator')
      },
      { 
        id: 'forklift', 
        emoji: '🚜',
        gradient: 'from-red-500 to-red-700',
        imageUrl: getConstructionImageUrl('forklift')
      },
      { 
        id: 'front-loader', 
        emoji: '🚜',
        gradient: 'from-yellow-500 to-orange-600',
        imageUrl: getConstructionImageUrl('front-loader')
      },
      { 
        id: 'hard-hat', 
        emoji: '👷',
        gradient: 'from-yellow-400 to-yellow-600',
        imageUrl: getConstructionImageUrl('hard-hat')
      },
      { 
        id: 'jackhammer', 
        emoji: '🔨',
        gradient: 'from-gray-600 to-gray-800',
        imageUrl: getConstructionImageUrl('jackhammer')
      },
      { 
        id: 'road-roller', 
        emoji: '🚜',
        gradient: 'from-yellow-500 to-yellow-700',
        imageUrl: getConstructionImageUrl('road-roller')
      },
      { 
        id: 'scraper', 
        emoji: '🚜',
        gradient: 'from-yellow-600 to-orange-700',
        imageUrl: getConstructionImageUrl('scraper')
      },
      { 
        id: 'snowplow-truck', 
        emoji: '🚛',
        gradient: 'from-blue-400 to-blue-600',
        imageUrl: getConstructionImageUrl('snowplow-truck')
      },
      { 
        id: 'stop-slow-sign', 
        emoji: '🛑',
        gradient: 'from-red-500 to-orange-600',
        imageUrl: getConstructionImageUrl('stop-slow-sign')
      },
      { 
        id: 'telehandler', 
        emoji: '🏗️',
        gradient: 'from-yellow-500 to-orange-600',
        imageUrl: getConstructionImageUrl('telehandler')
      },
      { 
        id: 'toolbox', 
        emoji: '🧰',
        gradient: 'from-red-500 to-red-700',
        imageUrl: getConstructionImageUrl('toolbox')
      },
      { 
        id: 'tower-crane', 
        emoji: '🏗️',
        gradient: 'from-gray-500 to-gray-700',
        imageUrl: getConstructionImageUrl('tower-crane')
      },
      { 
        id: 'traffic-cones', 
        emoji: '🚧',
        gradient: 'from-orange-500 to-orange-700',
        imageUrl: getConstructionImageUrl('traffic-cones')
      }
    ]
  },
  {
    id: 'animals-from-china-real',
    name: 'Animals from China',
    emoji: '🐼',
    cards: [
      {
        id: 'asiatic-black-bear',
        emoji: '🐻',
        gradient: 'from-zinc-700 to-zinc-900',
        imageUrl: getAnimalsFromChinaImageUrl('asiatic-black-bear')
      },
      {
        id: 'chinese-bamboo-rat',
        emoji: '🐀',
        gradient: 'from-stone-400 to-stone-600',
        imageUrl: getAnimalsFromChinaImageUrl('chinese-bamboo-rat')
      },
      {
        id: 'chinese-pangolin',
        emoji: '🦎',
        gradient: 'from-amber-600 to-amber-800',
        imageUrl: getAnimalsFromChinaImageUrl('chinese-pangolin')
      },
      {
        id: 'chinese-water-deer',
        emoji: '🦌',
        gradient: 'from-amber-700 to-amber-900',
        imageUrl: getAnimalsFromChinaImageUrl('chinese-water-deer')
      },
      {
        id: 'chinese-white-dolphin',
        emoji: '🐬',
        gradient: 'from-pink-100 to-pink-300',
        imageUrl: getAnimalsFromChinaImageUrl('chinese-white-dolphin')
      },
      {
        id: 'clouded-leopard',
        emoji: '🐆',
        gradient: 'from-yellow-600 to-stone-700',
        imageUrl: getAnimalsFromChinaImageUrl('clouded-leopard')
      },
      {
        id: 'crested-ibis',
        emoji: '🐦',
        gradient: 'from-red-400 to-white',
        imageUrl: getAnimalsFromChinaImageUrl('crested-ibis')
      },
      {
        id: 'giant-panda',
        emoji: '🐼',
        gradient: 'from-gray-800 to-white',
        imageUrl: getAnimalsFromChinaImageUrl('giant-panda')
      },
      {
        id: 'golden-pheasant',
        emoji: '🐦',
        gradient: 'from-yellow-500 to-red-600',
        imageUrl: getAnimalsFromChinaImageUrl('golden-pheasant')
      },
      {
        id: 'golden-snub-nosed-monkey',
        emoji: '🐵',
        gradient: 'from-orange-400 to-orange-600',
        imageUrl: getAnimalsFromChinaImageUrl('golden-snub-nosed-monkey')
      },
      {
        id: 'himalayan-monal',
        emoji: '🐦',
        gradient: 'from-blue-500 to-purple-600',
        imageUrl: getAnimalsFromChinaImageUrl('himalayan-monal')
      },
      {
        id: 'mandarin-duck',
        emoji: '🦆',
        gradient: 'from-red-500 to-blue-600',
        imageUrl: getAnimalsFromChinaImageUrl('mandarin-duck')
      },
      {
        id: 'pere-davids-deer',
        emoji: '🦌',
        gradient: 'from-stone-500 to-stone-700',
        imageUrl: getAnimalsFromChinaImageUrl('pere-davids-deer')
      },
      {
        id: 'przewalskis-horse',
        emoji: '🐴',
        gradient: 'from-amber-200 to-amber-400',
        imageUrl: getAnimalsFromChinaImageUrl('przewalskis-horse')
      },
      {
        id: 'red-panda',
        emoji: '🦊',
        gradient: 'from-red-600 to-orange-700',
        imageUrl: getAnimalsFromChinaImageUrl('red-panda')
      },
      {
        id: 'siberian-tiger',
        emoji: '🐯',
        gradient: 'from-orange-500 to-orange-700',
        imageUrl: getAnimalsFromChinaImageUrl('siberian-tiger')
      },
      {
        id: 'snow-leopard',
        emoji: '🐆',
        gradient: 'from-gray-200 to-gray-400',
        imageUrl: getAnimalsFromChinaImageUrl('snow-leopard')
      },
      {
        id: 'tibetan-fox',
        emoji: '🦊',
        gradient: 'from-orange-300 to-orange-500',
        imageUrl: getAnimalsFromChinaImageUrl('tibetan-fox')
      },
      {
        id: 'yak',
        emoji: '🐂',
        gradient: 'from-zinc-700 to-black',
        imageUrl: getAnimalsFromChinaImageUrl('yak')
      },
      {
        id: 'yangtze-finless-porpoise',
        emoji: '🐬',
        gradient: 'from-gray-300 to-gray-500',
        imageUrl: getAnimalsFromChinaImageUrl('yangtze-finless-porpoise')
      }
    ]
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    emoji: '🦃',
    cards: [
      {
        id: 'acorn',
        emoji: '🌰',
        gradient: 'from-amber-600 to-amber-800',
        imageUrl: getThanksgivingImageUrl('acorn')
      },
      {
        id: 'apple-cider-jug',
        emoji: '🍶',
        gradient: 'from-amber-500 to-amber-700',
        imageUrl: getThanksgivingImageUrl('apple-cider-jug')
      },
      {
        id: 'corn-on-the-cob',
        emoji: '🌽',
        gradient: 'from-yellow-400 to-yellow-600',
        imageUrl: getThanksgivingImageUrl('corn-on-the-cob')
      },
      {
        id: 'cornucopia',
        emoji: '🧺',
        gradient: 'from-amber-500 to-orange-600',
        imageUrl: getThanksgivingImageUrl('cornucopia')
      },
      {
        id: 'football',
        emoji: '🏈',
        gradient: 'from-amber-700 to-amber-900',
        imageUrl: getThanksgivingImageUrl('football')
      },
      {
        id: 'fox',
        emoji: '🦊',
        gradient: 'from-orange-500 to-red-600',
        imageUrl: getThanksgivingImageUrl('fox')
      },
      {
        id: 'live-turkey',
        emoji: '🦃',
        gradient: 'from-amber-600 to-red-700',
        imageUrl: getThanksgivingImageUrl('live-turkey')
      },
      {
        id: 'maple-leaf',
        emoji: '🍁',
        gradient: 'from-red-500 to-orange-600',
        imageUrl: getThanksgivingImageUrl('maple-leaf')
      },
      {
        id: 'mayflower-ship',
        emoji: '⛵',
        gradient: 'from-amber-700 to-stone-600',
        imageUrl: getThanksgivingImageUrl('mayflower-ship')
      },
      {
        id: 'native-american-headdress',
        emoji: '🪶',
        gradient: 'from-red-600 to-amber-600',
        imageUrl: getThanksgivingImageUrl('native-american-headdress')
      },
      {
        id: 'owl',
        emoji: '🦉',
        gradient: 'from-amber-700 to-stone-700',
        imageUrl: getThanksgivingImageUrl('owl')
      },
      {
        id: 'pilgrim-hat',
        emoji: '🎩',
        gradient: 'from-gray-800 to-gray-900',
        imageUrl: getThanksgivingImageUrl('pilgrim-hat')
      },
      {
        id: 'pumpkin-pie',
        emoji: '🥧',
        gradient: 'from-orange-500 to-amber-600',
        imageUrl: getThanksgivingImageUrl('pumpkin-pie')
      },
      {
        id: 'pumpkin',
        emoji: '🎃',
        gradient: 'from-orange-500 to-orange-700',
        imageUrl: getThanksgivingImageUrl('pumpkin')
      },
      {
        id: 'rake-leaf-pile',
        emoji: '🍂',
        gradient: 'from-orange-400 to-red-500',
        imageUrl: getThanksgivingImageUrl('rake-leaf-pile')
      },
      {
        id: 'red-apple',
        emoji: '🍎',
        gradient: 'from-red-500 to-red-700',
        imageUrl: getThanksgivingImageUrl('red-apple')
      },
      {
        id: 'scarecrow',
        emoji: '🧑‍🌾',
        gradient: 'from-amber-500 to-stone-600',
        imageUrl: getThanksgivingImageUrl('scarecrow')
      },
      {
        id: 'squirrel',
        emoji: '🐿️',
        gradient: 'from-amber-600 to-amber-800',
        imageUrl: getThanksgivingImageUrl('squirrel')
      },
      {
        id: 'sunflower',
        emoji: '🌻',
        gradient: 'from-yellow-400 to-amber-500',
        imageUrl: getThanksgivingImageUrl('sunflower')
      },
      {
        id: 'wheat-stalks',
        emoji: '🌾',
        gradient: 'from-yellow-500 to-amber-600',
        imageUrl: getThanksgivingImageUrl('wheat-stalks')
      }
    ]
  },
  {
    id: 'christmas',
    name: 'Christmas',
    emoji: '🎄',
    cards: [
      {
        id: 'angel',
        emoji: '👼',
        gradient: 'from-yellow-100 to-yellow-300',
        imageUrl: getChristmasImageUrl('angel')
      },
      {
        id: 'baby-jesus-manger',
        emoji: '👶',
        gradient: 'from-amber-400 to-amber-600',
        imageUrl: getChristmasImageUrl('baby-jesus')
      },
      {
        id: 'camels',
        emoji: '🐪',
        gradient: 'from-amber-500 to-amber-700',
        imageUrl: getChristmasImageUrl('camels')
      },
      {
        id: 'candy-cane',
        emoji: '🍬',
        gradient: 'from-red-500 to-red-300',
        imageUrl: getChristmasImageUrl('candy-cane')
      },
      {
        id: 'christmas-lights',
        emoji: '💡',
        gradient: 'from-green-500 to-red-500',
        imageUrl: getChristmasImageUrl('christmas-lights')
      },
      {
        id: 'christmas-tree',
        emoji: '🎄',
        gradient: 'from-green-600 to-green-800',
        imageUrl: getChristmasImageUrl('christmas-tree')
      },
      {
        id: 'donkey',
        emoji: '🫏',
        gradient: 'from-gray-500 to-gray-700',
        imageUrl: getChristmasImageUrl('donkey')
      },
      {
        id: 'joseph',
        emoji: '👨',
        gradient: 'from-amber-600 to-amber-800',
        imageUrl: getChristmasImageUrl('joseph')
      },
      {
        id: 'mary',
        emoji: '👩',
        gradient: 'from-blue-400 to-blue-600',
        imageUrl: getChristmasImageUrl('mary')
      },
      {
        id: 'ornament',
        emoji: '🎊',
        gradient: 'from-red-500 to-yellow-500',
        imageUrl: getChristmasImageUrl('ornament')
      },
      {
        id: 'present-gift-box',
        emoji: '🎁',
        gradient: 'from-red-500 to-green-600',
        imageUrl: getChristmasImageUrl('gift')
      },
      {
        id: 'reindeer',
        emoji: '🦌',
        gradient: 'from-amber-600 to-amber-800',
        imageUrl: getChristmasImageUrl('reindeer')
      },
      {
        id: 'santa-claus',
        emoji: '🎅',
        gradient: 'from-red-500 to-red-700',
        imageUrl: getChristmasImageUrl('santa-claus')
      },
      {
        id: 'sheep-lamb',
        emoji: '🐑',
        gradient: 'from-white to-gray-200',
        imageUrl: getChristmasImageUrl('lamb')
      },
      {
        id: 'shepherd',
        emoji: '🧑‍🌾',
        gradient: 'from-amber-500 to-stone-600',
        imageUrl: getChristmasImageUrl('shepherd')
      },
      {
        id: 'snowflake',
        emoji: '❄️',
        gradient: 'from-blue-200 to-blue-400',
        imageUrl: getChristmasImageUrl('snowflake')
      },
      {
        id: 'snowman',
        emoji: '⛄',
        gradient: 'from-white to-blue-200',
        imageUrl: getChristmasImageUrl('snowman')
      },
      {
        id: 'star-of-bethlehem',
        emoji: '⭐',
        gradient: 'from-yellow-400 to-yellow-600',
        imageUrl: getChristmasImageUrl('star-of-bethlehem')
      },
      {
        id: 'stocking',
        emoji: '🧦',
        gradient: 'from-red-500 to-green-600',
        imageUrl: getChristmasImageUrl('stocking')
      },
      {
        id: 'wise-men-three-kings',
        emoji: '👑',
        gradient: 'from-purple-500 to-yellow-600',
        imageUrl: getChristmasImageUrl('three-kings')
      }
    ]
  },
  {
    id: 'dinos',
    name: 'Dinosaurs',
    emoji: '',
    cards: [
      { id: 'amber-specimen', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('amber-specimen') },
      { id: 'ammonite', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('ammonite') },
      { id: 'ankylosaurus', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('ankylosaurus') },
      { id: 'archelon', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('archelon') },
      { id: 'asteroid-impact', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('asteroid-impact') },
      { id: 'brachiosaurus', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('brachiosaurus') },
      { id: 'dinosaur-eggs', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('dinosaur-eggs') },
      { id: 'hatching-dinosaur', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('hatching-dinosaur') },
      { id: 'juvenile-trex', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('juvenile-trex') },
      { id: 'pachycephalosaurus', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('pachycephalosaurus') },
      { id: 'parasaurolophus', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('parasaurolophus') },
      { id: 'pteranodon', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('pteranodon') },
      { id: 'sarcosuchus', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('sarcosuchus') },
      { id: 'spinosaurus', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('spinosaurus') },
      { id: 'stegosaurus', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('stegosaurus') },
      { id: 'triceratops', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('triceratops') },
      { id: 'trilobite', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('trilobite') },
      { id: 'tyrannosaurus-rex', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('tyrannosaurus-rex') },
      { id: 'velociraptor', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('velociraptor') },
      { id: 'volcanic-eruption', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getDinosImageUrl('volcanic-eruption') }
    ]
  },
  {
    id: 'hotwheels',
    name: 'Hot Wheels',
    emoji: '',
    cards: [
      { id: '67-camaro', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('67-camaro') },
      { id: 'ambulance', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('ambulance') },
      { id: 'apache-helicopter', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('apache-helicopter') },
      { id: 'coast-guard-boat', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('coast-guard-boat') },
      { id: 'coast-guard-helicopter', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('coast-guard-helicopter') },
      { id: 'corvette-stingray', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('corvette-stingray') },
      { id: 'dodge-charger', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('dodge-charger') },
      { id: 'f16-fighter-jet', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('f16-fighter-jet') },
      { id: 'fire-truck', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('fire-truck') },
      { id: 'ford-gt', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('ford-gt') },
      { id: 'humvee', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('humvee') },
      { id: 'jeep-wrangler', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('jeep-wrangler') },
      { id: 'm1-abrams-tank', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('m1-abrams-tank') },
      { id: 'mars-rover', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('mars-rover') },
      { id: 'military-truck', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('military-truck') },
      { id: 'police-interceptor', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('police-interceptor') },
      { id: 'police-motorcycle', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('police-motorcycle') },
      { id: 'porsche-911', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('porsche-911') },
      { id: 'swat-truck', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('swat-truck') },
      { id: 'vw-bus', emoji: '', gradient: 'from-slate-400 to-slate-600', imageUrl: getHotwheelsImageUrl('vw-bus') }
    ]
  }
];

