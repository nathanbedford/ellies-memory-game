import { CardPackOption } from '../types';

interface CardPackModalProps {
  cardPacks: CardPackOption[];
  selectedPack: string;
  onSelect: (packId: string) => void;
  onClose: () => void;
}

export const CardPackModal = ({ cardPacks, selectedPack, onSelect }: CardPackModalProps) => {
  const handleSelect = (packId: string) => {
    onSelect(packId);
    // Don't call onClose here - let the parent handle navigation
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {cardPacks.map((pack) => (
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
          <div className="mb-4">
            <div className={`w-full h-32 rounded-lg bg-gradient-to-br ${
              pack.id === 'animals' ? 'from-amber-400 to-orange-600' :
              pack.id === 'plants' ? 'from-green-400 to-green-700' :
              pack.id === 'buildings' ? 'from-gray-500 to-gray-700' :
              pack.id === 'ocean' ? 'from-blue-400 to-cyan-600' :
              'from-purple-400 to-purple-700'
            } flex items-center justify-center`}>
              <span className="text-6xl">{pack.emoji}</span>
            </div>
          </div>
          
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
  );
};
