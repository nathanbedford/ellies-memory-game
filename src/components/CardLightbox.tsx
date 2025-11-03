import { useEffect } from 'react';
import { Card } from '../types';

interface CardLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
}

export const CardLightbox = ({ isOpen, onClose, card }: CardLightboxProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !card) return null;

  // Check if imageUrl is an actual image URL or an emoji
  const isImage = card.imageUrl && (
    card.imageUrl.startsWith('http') || 
    card.imageUrl.startsWith('/') || 
    card.imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
    card.imageUrl.includes('blob:') || 
    card.imageUrl.includes('data:')
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 text-white hover:text-gray-300 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors z-10"
        type="button"
        title="Close"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Card Display */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card container with rounded corners */}
        <div 
          className="relative flex items-center justify-center w-full h-full max-w-[95vmin] max-h-[95vmin] rounded-3xl overflow-hidden shadow-2xl"
        >
          {isImage ? (
            <img 
              src={card.imageUrl} 
              alt="" 
              className="w-full h-full object-contain"
            />
          ) : (
            <div 
              className={`relative w-full h-full flex items-center justify-center ${
                card.gradient
                  ? `bg-gradient-to-br ${card.gradient}`
                  : 'bg-white'
              }`}
            >
              {/* Semi-transparent overlay for gradient backgrounds */}
              {card.gradient && (
                <div className="absolute inset-0 bg-white opacity-30" />
              )}
              <div 
                className="text-center relative z-10"
                style={{ fontSize: 'min(30vw, 30vh, 200px)' }}
              >
                {card.imageUrl || '?'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


