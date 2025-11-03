import { useState } from 'react';
import { CardPackOption } from '../types';
import { CARD_DECKS } from '../data/cardDecks';

interface CardPackModalProps {
  cardPacks: CardPackOption[];
  selectedPack: string;
  onSelect: (packId: string) => void;
  onClose: () => void;
}

export const CardPackModal = ({ cardPacks, selectedPack, onSelect }: CardPackModalProps) => {
  // Determine initial tab based on selected pack
  const getInitialTab = () => {
    const picturePackIds = ['animals-real', 'ocean-real', 'emotions-real'];
    return picturePackIds.includes(selectedPack) ? 'pictures' : 'emoji';
  };
  
  const [activeTab, setActiveTab] = useState<'emoji' | 'pictures'>(getInitialTab());

  const handleSelect = (packId: string) => {
    onSelect(packId);
    // Don't call onClose here - let the parent handle navigation
  };

  // Separate emoji and picture packs
  const emojiPacks = cardPacks.filter(pack => 
    ['animals', 'plants', 'buildings', 'colors', 'ocean', 'construction'].includes(pack.id)
  );
  const picturePacks = cardPacks.filter(pack => 
    ['animals-real', 'ocean-real', 'emotions-real'].includes(pack.id)
  );

  // Get preview images for animals-real deck
  const getAnimalsRealPreview = () => {
    const deck = CARD_DECKS.find(d => d.id === 'animals-real');
    if (!deck) return [];
    // Pick 4 images for preview: lion, elephant, cat, dog
    const previewIds = ['lion', 'elephant', 'cat', 'dog'];
    return deck.cards.filter(card => previewIds.includes(card.id)).slice(0, 4);
  };

  // Get preview images for ocean-real deck
  const getOceanRealPreview = () => {
    const deck = CARD_DECKS.find(d => d.id === 'ocean-real');
    if (!deck) return [];
    // Pick 4 images for preview: fish, whale, dolphin, octopus
    const previewIds = ['fish', 'whale', 'dolphin', 'octopus'];
    return deck.cards.filter(card => previewIds.includes(card.id)).slice(0, 4);
  };

  // Get preview images for emotions-real deck
  const getEmotionsRealPreview = () => {
    const deck = CARD_DECKS.find(d => d.id === 'emotions-real');
    if (!deck) return [];
    // Pick 4 images for preview: happy, sad, angry, excited
    const previewIds = ['happy', 'sad', 'angry', 'excited'];
    return deck.cards.filter(card => previewIds.includes(card.id)).slice(0, 4);
  };

  const animalsRealPreview = getAnimalsRealPreview();
  const oceanRealPreview = getOceanRealPreview();
  const emotionsRealPreview = getEmotionsRealPreview();

  // Determine which packs to show based on active tab
  const displayedPacks = activeTab === 'emoji' ? emojiPacks : picturePacks;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('emoji')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'emoji'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Emoji
        </button>
        <button
          onClick={() => setActiveTab('pictures')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'pictures'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pictures
        </button>
      </div>

      {/* Card Pack Options */}
      <div className="grid grid-cols-2 gap-6">
        {displayedPacks.map((pack) => (
          <button
          key={pack.id}
          onClick={() => handleSelect(pack.id)}
          className={`p-8 rounded-xl border-3 transition-all duration-200 transform hover:scale-105 ${
            selectedPack === pack.id
              ? 'border-blue-500 bg-blue-50 shadow-lg'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
          }`}
        >
          {/* Preview Section */}
          {pack.id === 'animals-real' ? (
            <div className="mb-4">
              <div className="w-full h-40 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 grid grid-cols-2 grid-rows-2 gap-1 p-1">
                {animalsRealPreview.map((card) => (
                  card.imageUrl && (
                    <div key={card.id} className="w-full h-full flex items-center justify-center bg-white bg-opacity-20 rounded overflow-hidden">
                      <img
                        src={card.imageUrl}
                        alt={card.id}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )
                ))}
              </div>
            </div>
          ) : pack.id === 'ocean-real' ? (
            <div className="mb-4">
              <div className="w-full h-40 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-600 grid grid-cols-2 grid-rows-2 gap-1 p-1">
                {oceanRealPreview.map((card) => (
                  card.imageUrl && (
                    <div key={card.id} className="w-full h-full flex items-center justify-center bg-white bg-opacity-20 rounded overflow-hidden">
                      <img
                        src={card.imageUrl}
                        alt={card.id}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )
                ))}
              </div>
            </div>
          ) : pack.id === 'emotions-real' ? (
            <div className="mb-4">
              <div className="w-full h-40 rounded-lg bg-gradient-to-br from-pink-400 to-purple-600 grid grid-cols-2 grid-rows-2 gap-1 p-1">
                {emotionsRealPreview.map((card) => (
                  card.imageUrl && (
                    <div key={card.id} className="w-full h-full flex items-center justify-center bg-white bg-opacity-20 rounded overflow-hidden">
                      <img
                        src={card.imageUrl}
                        alt={card.id}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <div className={`w-full h-32 rounded-lg bg-gradient-to-br ${
                pack.id === 'animals' ? 'from-amber-400 to-orange-600' :
                pack.id === 'plants' ? 'from-green-400 to-green-700' :
                pack.id === 'buildings' ? 'from-gray-500 to-gray-700' :
                pack.id === 'ocean' ? 'from-blue-400 to-cyan-600' :
                pack.id === 'colors' ? 'from-purple-400 to-purple-700' :
                pack.id === 'construction' ? 'from-gray-600 to-gray-800' :
                'from-purple-400 to-purple-700'
              } flex items-center justify-center`}>
                <span className="text-6xl">{pack.emoji}</span>
              </div>
            </div>
          )}
          
          {/* Info Section */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 mb-2">
              {pack.emoji} {pack.name}
            </div>
            <div className="text-sm text-gray-600">
              {pack.id === 'animals' && '🦁🐘🐕🐈🐰🦅🐠🐼🐵🐯🐻🦊'}
              {pack.id === 'plants' && '🌹🌷🌻🌳🌵🍃🌸🍄🌴🌿🌱🌲'}
              {pack.id === 'buildings' && '🏠🏰🏢⛪🏭🗼🌉🔺🏥🏨🏬🏫'}
              {pack.id === 'colors' && '🔴🔵🟢🟡🟣🟠💗🩵🟤⚫⚪💚'}
              {pack.id === 'ocean' && '🐟🐋🐬🐙🦀🐢🪼🦈🐴🐚⭐🪸'}
            </div>
            {selectedPack === pack.id && (
              <div className="mt-3 text-sm font-semibold text-blue-600">
                ✓ Currently Selected
              </div>
            )}
          </div>
          </button>
        ))}
      </div>
    </div>
  );
};
