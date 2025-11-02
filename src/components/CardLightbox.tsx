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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
        className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Large card display */}
        <div 
          className={`rounded-2xl shadow-2xl overflow-hidden ${
            card.gradient && !isImage
              ? `bg-gradient-to-br ${card.gradient}`
              : 'bg-white'
          }`}
          style={{
            width: 'min(80vw, 80vh)',
            height: 'min(80vw, 80vh)',
            maxWidth: '600px',
            maxHeight: '600px'
          }}
        >
          {/* Semi-transparent overlay for gradient backgrounds */}
          {card.gradient && !isImage && (
            <div className="absolute inset-0 bg-white opacity-30" />
          )}
          
          <div className="relative w-full h-full flex items-center justify-center p-8">
            {isImage ? (
              <img 
                src={card.imageUrl} 
                alt="" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div 
                className="text-center"
                style={{ fontSize: 'min(30vw, 30vh, 200px)' }}
              >
                {card.imageUrl || '?'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


