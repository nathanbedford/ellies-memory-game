import { useEffect } from 'react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onEndGameEarly: () => void;
  onToggleFlipAll: () => void;
  allCardsFlipped: boolean;
  onViewLogs?: () => void;
}

export const AdminSidebar = ({
  isOpen,
  onClose,
  onEndGameEarly,
  onToggleFlipAll,
  allCardsFlipped,
  onViewLogs,
}: AdminSidebarProps) => {
  // Handle Escape key to close sidebar
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed left-0 top-0 h-full bg-white shadow-xl z-20 transition-transform duration-300 ease-in-out"
      style={{ width: '140px' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col h-full p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="self-end mb-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close admin panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Admin Actions */}
        <div className="flex flex-col gap-3">
          {/* End Game Early */}
          <button
            onClick={onEndGameEarly}
            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>End Game</span>
          </button>

          {/* Toggle Flip All Cards */}
          <button
            onClick={onToggleFlipAll}
            className={`px-3 py-2 text-sm font-medium rounded transition-colors duration-200 flex items-center justify-center gap-2 ${
              allCardsFlipped
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Show All</span>
          </button>

          {/* View Logs */}
          {onViewLogs && (
            <button
              onClick={onViewLogs}
              className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Logs</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

