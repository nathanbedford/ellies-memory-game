import { CardPackOption } from '../types';

interface CardPackSelectorProps {
  selectedPack: string;
  onPackChange: (pack: string) => void;
  cardPacks: CardPackOption[];
}

export const CardPackSelector = ({ selectedPack, onPackChange, cardPacks }: CardPackSelectorProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Choose Card Pack</h2>
      <div className="flex justify-center">
        <select
          value={selectedPack}
          onChange={(e) => onPackChange(e.target.value)}
          className="px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:border-gray-400 transition-colors cursor-pointer min-w-[200px]"
        >
          {cardPacks.map((pack) => (
            <option key={pack.id} value={pack.id}>
              {pack.emoji} {pack.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
