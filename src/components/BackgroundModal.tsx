import { BackgroundOption, BACKGROUND_OPTIONS } from '../hooks/useBackgroundSelector';

interface BackgroundModalProps {
  selectedBackground: string;
  onSelect: (backgroundId: string) => void;
  onClose: () => void;
}

export const BackgroundModal = ({ selectedBackground, onSelect, onClose }: BackgroundModalProps) => {
  const handleSelect = (backgroundId: string) => {
    onSelect(backgroundId);
    onClose();
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {BACKGROUND_OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => handleSelect(option.id)}
          className={`p-6 rounded-xl border-3 transition-all duration-200 transform hover:scale-[1.02] ${
            selectedBackground === option.id
              ? 'border-purple-500 bg-purple-50 shadow-lg'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-6">
            {/* Preview Section */}
            <div className="flex-shrink-0">
              <div className={`w-24 h-24 rounded-lg bg-gradient-to-br ${option.gradient} shadow-inner`}>
                {/* Add some visual elements to show the gradient */}
                <div className="w-full h-full rounded-lg flex items-center justify-center">
                  <div className="w-16 h-16 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-white bg-opacity-50 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Info Section */}
            <div className="flex-1 text-left">
              <div className="text-xl font-bold text-gray-800 mb-2">
                {option.name}
              </div>
              <div className="text-sm text-gray-600 mb-3">
                {option.id === 'rainbow' && '🌈 Colorful and fun with pink, purple, and indigo'}
                {option.id === 'ocean' && '🌊 Calm and refreshing with blue and cyan tones'}
                {option.id === 'sunset' && '🌅 Warm and cozy with orange and red colors'}
                {option.id === 'forest' && '🌲 Natural and peaceful with green shades'}
                {option.id === 'galaxy' && '🌌 Mysterious and exciting with purple and pink'}
              </div>
              {selectedBackground === option.id && (
                <div className="text-sm font-semibold text-purple-600">
                  ✓ Currently Selected
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
