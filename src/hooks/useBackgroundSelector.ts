import { useState } from 'react';

export type BackgroundTheme = 'rainbow' | 'ocean' | 'sunset' | 'forest' | 'galaxy';

export interface BackgroundOption {
  id: BackgroundTheme;
  name: string;
  gradient: string;
}

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: 'rainbow',
    name: 'Rainbow',
    gradient: 'from-pink-300 via-purple-300 to-indigo-400'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    gradient: 'from-blue-200 via-cyan-200 to-teal-300'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    gradient: 'from-orange-300 via-red-300 to-pink-400'
  },
  {
    id: 'forest',
    name: 'Forest',
    gradient: 'from-green-200 via-emerald-300 to-teal-400'
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    gradient: 'from-purple-400 via-pink-400 to-indigo-500'
  }
];

export const useBackgroundSelector = () => {
  const [selectedBackground, setSelectedBackground] = useState<BackgroundTheme>('rainbow');

  const getCurrentBackground = () => {
    const option = BACKGROUND_OPTIONS.find(bg => bg.id === selectedBackground);
    return option?.gradient || BACKGROUND_OPTIONS[0].gradient;
  };

  return {
    selectedBackground,
    setSelectedBackground,
    getCurrentBackground,
    backgroundOptions: BACKGROUND_OPTIONS
  };
};
