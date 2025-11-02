import { useState } from 'react';

export type BackgroundTheme = 'rainbow' | 'ocean' | 'sunset' | 'forest' | 'galaxy' | 'photo1' | 'photo2' | 'photo3';

export interface BackgroundOption {
  id: BackgroundTheme;
  name: string;
  gradient?: string;
  imageUrl?: string;
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
  },
  {
    id: 'photo1',
    name: 'El Senor Crabby Face',
    imageUrl: 'https://images.unsplash.com/photo-1642703746482-a8393214657d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=3132'
  },
  {
    id: 'photo2',
    name: 'Under Construction',
    imageUrl: 'https://images.unsplash.com/photo-1669717390649-7ce9a964a21c?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2069'
  },
  {
    id: 'photo3',
    name: 'Wooden Boxcar',
    imageUrl: 'https://images.unsplash.com/photo-1719678275096-70b51a7bc915?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070'
  }
];

export const useBackgroundSelector = () => {
  const [selectedBackground, setSelectedBackground] = useState<BackgroundTheme>('rainbow');

  const getCurrentBackground = () => {
    const option = BACKGROUND_OPTIONS.find(bg => bg.id === selectedBackground);
    return option || BACKGROUND_OPTIONS[0];
  };

  return {
    selectedBackground,
    setSelectedBackground,
    getCurrentBackground,
    backgroundOptions: BACKGROUND_OPTIONS
  };
};
